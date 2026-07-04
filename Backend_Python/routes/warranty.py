"""API Bảo hành (/api/Warranty) — nhóm endpoint FrontEnd cần nhưng Backend_Dotnet chưa có.

FrontEnd (src/api.js — warrantyApi):
    POST   /api/Warranty                     (multipart form)   — khách tạo yêu cầu
    GET    /api/Warranty/my-claims                              — khách xem yêu cầu của mình
    GET    /api/Warranty                     (Admin)            — danh sách tất cả yêu cầu
    PUT    /api/Warranty/<id>/status         (Admin)            — cập nhật trạng thái + ghi chú
    DELETE /api/Warranty/<id>                                   — chủ yêu cầu hoặc Admin xóa

Dữ liệu lưu vào bảng ServiceTickets (xem models.py). Ảnh/video lưu vào
uploads/warranty/ và phục vụ qua /api/python/uploads/... (gateway route về Python).
"""
import json
import os
import uuid
from datetime import datetime, timezone

from flask import Blueprint, current_app, g, jsonify, request, send_from_directory

from auth import admin_required, token_required
from extensions import db
from models import ServiceTicket

warranty_bp = Blueprint('warranty', __name__)

VALID_STATUSES = ['Chờ xử lý', 'Đang xử lý', 'Đã xử lý', 'Từ chối']
DEFAULT_STATUS = VALID_STATUSES[0]

# Cột ServiceTickets.Status có CHECK constraint chỉ cho phép 4 giá trị bên phải,
# khác với 4 trạng thái FE dùng. Trạng thái FE được lưu trong JSON (CurrentCondition)
# làm nguồn chính xác; cột Status ghi giá trị hợp lệ gần nghĩa nhất.
STATUS_TO_DB = {
    'Chờ xử lý': 'Đang chờ',
    'Đang xử lý': 'Đang xử lý',
    'Đã xử lý': 'Đã xong',
    'Từ chối': 'Đã trả khách',
}

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'}
VIDEO_EXTENSIONS = {'.mp4', '.mov', '.avi', '.webm', '.mkv'}


# ── Helpers ──────────────────────────────────────────────────────────────────

def _upload_dir():
    path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'warranty')
    os.makedirs(path, exist_ok=True)
    return path


def _save_file(file, allowed_extensions):
    ext = os.path.splitext(file.filename or '')[1].lower()
    if ext not in allowed_extensions:
        raise ValueError(f"Định dạng file '{ext}' không được hỗ trợ.")
    filename = f'{uuid.uuid4().hex}{ext}'
    file.save(os.path.join(_upload_dir(), filename))
    return f'/api/python/uploads/warranty/{filename}'


def _parse_detail(ticket):
    """CurrentCondition chứa JSON các trường không có cột riêng trong ServiceTickets."""
    try:
        detail = json.loads(ticket.current_condition or '{}')
    except (TypeError, ValueError):
        return None
    return detail if detail.get('type') == 'warranty' else None


def _to_response(ticket, detail):
    return {
        'warrantyId': ticket.service_ticket_id,
        'orderId': ticket.order_id,
        'orderDetailId': detail.get('orderDetailId'),
        'productName': ticket.customer_racket_name,
        'serialNumber': detail.get('serialNumber'),
        'reasonCategory': detail.get('reasonCategory'),
        'reasonLabel': detail.get('reasonLabel'),
        'description': detail.get('description'),
        'customerId': detail.get('customerId'),
        'customerName': detail.get('customerName'),
        'images': detail.get('images', []),
        'videoName': detail.get('videoName'),
        'videoUrl': detail.get('videoUrl'),
        'adminNote': detail.get('adminNote', ''),
        'status': detail.get('status') or DEFAULT_STATUS,
        'createdAt': ticket.received_date.isoformat() if ticket.received_date else None,
    }


def _warranty_tickets():
    """Chỉ lấy các ticket là yêu cầu bảo hành (bảng có thể chứa loại ticket khác)."""
    tickets = (ServiceTicket.query
               .order_by(ServiceTicket.service_ticket_id.desc())
               .all())
    result = []
    for ticket in tickets:
        detail = _parse_detail(ticket)
        if detail is not None:
            result.append((ticket, detail))
    return result


def _get_warranty_or_404(warranty_id):
    ticket = db.session.get(ServiceTicket, warranty_id)
    if ticket is None:
        return None, None
    detail = _parse_detail(ticket)
    if detail is None:
        return None, None
    return ticket, detail


def _to_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


# ── Endpoints ────────────────────────────────────────────────────────────────

@warranty_bp.route('/Warranty', methods=['POST'])
@token_required
def create_claim():
    form = request.form
    product_name = (form.get('productName') or '').strip()
    if not product_name:
        return jsonify({'message': 'Thiếu tên sản phẩm.'}), 400
    if not form.get('orderId'):
        return jsonify({'message': 'Thiếu mã đơn hàng.'}), 400

    try:
        images = [_save_file(f, IMAGE_EXTENSIONS)
                  for f in request.files.getlist('images') if f and f.filename]
        video = request.files.get('video')
        video_url = None
        video_name = None
        if video and video.filename:
            video_url = _save_file(video, VIDEO_EXTENSIONS)
            video_name = video.filename
    except ValueError as e:
        return jsonify({'message': str(e)}), 400

    detail = {
        'type': 'warranty',
        'orderDetailId': _to_int(form.get('orderDetailId')),
        'serialNumber': form.get('serialNumber') or '',
        'reasonCategory': form.get('reasonCategory') or '',
        'reasonLabel': form.get('reasonLabel') or '',
        'description': form.get('description') or '',
        # Luôn lấy customerId từ token, không tin dữ liệu client gửi lên
        'customerId': g.current_user['userId'],
        'customerName': form.get('customerName') or g.current_user['email'] or '',
        'images': images,
        'videoName': video_name,
        'videoUrl': video_url,
        'adminNote': '',
        'status': DEFAULT_STATUS,
    }
    ticket = ServiceTicket(
        order_id=_to_int(form.get('orderId')),
        customer_racket_name=product_name,
        current_condition=json.dumps(detail, ensure_ascii=False),
        received_date=datetime.now(timezone.utc),
        status=STATUS_TO_DB[DEFAULT_STATUS],
    )
    db.session.add(ticket)
    db.session.commit()
    return jsonify({'message': 'Gửi yêu cầu bảo hành thành công.',
                    **_to_response(ticket, detail)}), 201


@warranty_bp.route('/Warranty/my-claims', methods=['GET'])
@token_required
def my_claims():
    user_id = g.current_user['userId']
    claims = [_to_response(t, d) for t, d in _warranty_tickets()
              if d.get('customerId') == user_id]
    return jsonify(claims)


@warranty_bp.route('/Warranty', methods=['GET'])
@admin_required
def get_all():
    return jsonify([_to_response(t, d) for t, d in _warranty_tickets()])


@warranty_bp.route('/Warranty/<int:warranty_id>/status', methods=['PUT'])
@admin_required
def update_status(warranty_id):
    ticket, detail = _get_warranty_or_404(warranty_id)
    if ticket is None:
        return jsonify({'message': 'Không tìm thấy yêu cầu bảo hành.'}), 404

    body = request.get_json(silent=True) or {}
    status = (body.get('status') or '').strip()
    if status not in VALID_STATUSES:
        return jsonify({'message': f'Trạng thái không hợp lệ. Hợp lệ: {", ".join(VALID_STATUSES)}'}), 400

    ticket.status = STATUS_TO_DB[status]
    detail['status'] = status
    if 'adminNote' in body:
        detail['adminNote'] = body.get('adminNote') or ''
    ticket.current_condition = json.dumps(detail, ensure_ascii=False)
    db.session.commit()
    return jsonify({'message': 'Cập nhật trạng thái thành công.',
                    **_to_response(ticket, detail)})


@warranty_bp.route('/Warranty/<int:warranty_id>', methods=['DELETE'])
@token_required
def delete_claim(warranty_id):
    ticket, detail = _get_warranty_or_404(warranty_id)
    if ticket is None:
        return jsonify({'message': 'Không tìm thấy yêu cầu bảo hành.'}), 404

    user = g.current_user
    if 'Admin' not in user['roles'] and detail.get('customerId') != user['userId']:
        return jsonify({'message': 'Bạn không có quyền xóa yêu cầu này.'}), 403

    # Xóa file đính kèm (best effort — hỏng cũng không chặn việc xóa bản ghi)
    upload_root = current_app.config['UPLOAD_FOLDER']
    for url in detail.get('images', []) + ([detail['videoUrl']] if detail.get('videoUrl') else []):
        relative = url.replace('/api/python/uploads/', '', 1)
        try:
            os.remove(os.path.join(upload_root, relative))
        except OSError:
            pass

    db.session.delete(ticket)
    db.session.commit()
    return jsonify({'message': 'Xóa yêu cầu bảo hành thành công.'})


# ── Phục vụ file đã upload (gateway route /api/python/* về backend này) ──────

@warranty_bp.route('/python/uploads/<path:filename>', methods=['GET'])
def serve_upload(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)
