"""Xác thực JWT dùng chung với Backend_Dotnet.

Token do AuthController (.NET) phát hành bằng JwtSecurityTokenHandler + HS256.
JwtSecurityTokenHandler áp OutboundClaimTypeMap nên trong payload thực tế:
    ClaimTypes.NameIdentifier -> "nameid"
    ClaimTypes.Email          -> "email"
    ClaimTypes.Role           -> "role" (chuỗi hoặc mảng nếu nhiều role)
Vẫn kiểm tra thêm dạng URI đầy đủ để phòng thay đổi cấu hình phía .NET.
"""
from functools import wraps

import jwt
from flask import current_app, g, jsonify, request

CLAIM_NAMEID_URI = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
CLAIM_EMAIL_URI = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
CLAIM_ROLE_URI = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'


def _decode_token():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None, 'Thiếu token xác thực.'
    token = auth_header[len('Bearer '):].strip()
    try:
        payload = jwt.decode(
            token,
            current_app.config['JWT_SECRET_KEY'],
            algorithms=['HS256'],
            options={'verify_aud': False, 'verify_iss': False},
        )
    except jwt.ExpiredSignatureError:
        return None, 'Phiên đăng nhập đã hết hạn.'
    except jwt.InvalidTokenError:
        return None, 'Token không hợp lệ.'
    return payload, None


def _as_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def _current_user(payload):
    user_id = payload.get('nameid') or payload.get(CLAIM_NAMEID_URI) or payload.get('sub')
    email = payload.get('email') or payload.get(CLAIM_EMAIL_URI)
    roles = _as_list(payload.get('role')) + _as_list(payload.get(CLAIM_ROLE_URI))
    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        user_id = None
    return {'userId': user_id, 'email': email, 'roles': roles}


def token_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        payload, error = _decode_token()
        if error:
            return jsonify({'message': error}), 401
        user = _current_user(payload)
        if user['userId'] is None:
            return jsonify({'message': 'Không xác định được người dùng.'}), 401
        g.current_user = user
        return f(*args, **kwargs)
    return wrapper


def admin_required(f):
    @wraps(f)
    @token_required
    def wrapper(*args, **kwargs):
        if 'Admin' not in g.current_user['roles']:
            return jsonify({'message': 'Bạn không có quyền truy cập chức năng này.'}), 403
        return f(*args, **kwargs)
    return wrapper
