"""Seed đơn hàng 2024–2025 để trang Statistics/Dashboard có dữ liệu lịch sử.

Trang Statistics của FE so sánh cứng "Năm 2024" vs "Năm 2025" (Statistics.jsx),
trong khi DB chỉ có đơn năm 2026 — script này sinh đơn hàng thật (Orders,
OrderDetails, Payments, OrderVouchers) trải đều 24 tháng của 2024–2025 với
xu hướng tăng trưởng, dùng đúng user/sản phẩm/voucher đang có trong DB.

Chạy:      docker exec backend_python python3 seed_orders.py
Xóa seed:  docker exec backend_python python3 seed_orders.py --remove

- Idempotent: mọi đơn seed có Note bắt đầu bằng SEED_MARKER; chạy lại sẽ báo
  đã seed và thoát (dùng --remove trước nếu muốn seed lại).
- random.seed cố định nên dữ liệu tái lập được.
"""
import random
import sys
from datetime import datetime

from sqlalchemy import text

from app import create_app
from extensions import db

SEED_MARKER = '[seed-2024-2025]'
REVENUE_SHIPPING_FEES = [0, 20000, 30000, 35000]

# Trạng thái: (OrderStatusID, trọng số) — đa số đơn cũ đã hoàn tất
STATUS_WEIGHTS = [(7, 62), (6, 15), (8, 10), (2, 4), (3, 4), (5, 5)]
PAYMENT_METHODS = [('COD', 50), ('Bank Transfer', 30), ('E-Wallet', 20)]

RECEIVERS = [
    ('Nguyễn Văn Linh', '0901234561', '12 Lê Lợi, Quận 1, TP.HCM'),
    ('Trần Quang Minh', '0912345672', '45 Trần Hưng Đạo, Quận 5, TP.HCM'),
    ('Lê Thị Hoa', '0923456783', '78 Nguyễn Huệ, Quận 1, TP.HCM'),
    ('Phạm Anh Tuấn', '0934567894', '221B Hai Bà Trưng, Quận 3, TP.HCM'),
    ('Hoàng Minh Quân', '0945678905', '9 Phan Chu Trinh, Hoàn Kiếm, Hà Nội'),
    ('Vũ Thu Trang', '0956789016', '35 Láng Hạ, Đống Đa, Hà Nội'),
    ('Đặng Quốc Bảo', '0967890127', '102 Nguyễn Văn Cừ, Long Biên, Hà Nội'),
    ('Bùi Thanh Sơn', '0978901238', '56 Bạch Đằng, Hải Châu, Đà Nẵng'),
]


def weighted_choice(pairs):
    values, weights = zip(*pairs)
    return random.choices(values, weights=weights, k=1)[0]


def fetch_reference_data():
    """Lấy user, variant sản phẩm, voucher đang có trong DB làm nguyên liệu seed."""
    users = [r[0] for r in db.session.execute(text('''
        SELECT u.UserID FROM Users u
        WHERE NOT EXISTS (SELECT 1 FROM UserRoles ur JOIN Roles r ON r.RoleID = ur.RoleID
                          WHERE ur.UserID = u.UserID AND r.RoleName = 'Admin')
    ''')).fetchall()]
    # Variant giá <= 8 triệu (loại outlier giá test 100 triệu), bỏ danh mục "Kiểm tra"
    details = db.session.execute(text('''
        SELECT d.DetailID, d.ProductID, d.Price
        FROM ProductDetails d
        JOIN Products p ON p.ProductID = d.ProductID
        LEFT JOIN Categories c ON c.CategoryID = p.CategoryID
        WHERE d.Price BETWEEN 45000 AND 8000000
          AND ISNULL(c.CategoryName, '') <> N'Kiểm tra'
    ''')).fetchall()
    vouchers = db.session.execute(text('''
        SELECT VoucherID, DiscountValue, ISNULL(IsPercent, 0), MaxDiscountAmount
        FROM Vouchers WHERE IsActive = 1
    ''')).fetchall()
    return users, details, vouchers


def voucher_discount(voucher, subtotal):
    _, value, is_percent, max_amount = voucher
    if is_percent:
        discount = subtotal * float(value) / 100
        if max_amount is not None:
            discount = min(discount, float(max_amount))
    else:
        discount = float(value)
    return round(min(discount, subtotal), 0)


def orders_per_month(year, month):
    """Số đơn mỗi tháng: 2024 thấp hơn, 2025 tăng trưởng, có mùa vụ nhẹ cuối năm."""
    base = 9 if year == 2024 else 14
    seasonal = 3 if month in (5, 6, 11, 12) else 0
    return base + seasonal + random.randint(-2, 3)


def seed():
    users, details, vouchers = fetch_reference_data()
    if not users or not details:
        print('DB thiếu user hoặc sản phẩm — không seed được.')
        sys.exit(1)

    sold_by_product = {}
    total_orders = 0

    for year in (2024, 2025):
        for month in range(1, 13):
            for _ in range(orders_per_month(year, month)):
                order_date = datetime(year, month, random.randint(1, 28),
                                      random.randint(8, 21), random.randint(0, 59))
                status = weighted_choice(STATUS_WEIGHTS)
                user_id = random.choice(users)
                receiver, phone, address = random.choice(RECEIVERS)

                # 1-3 dòng hàng, mỗi dòng 1-2 sản phẩm
                lines = random.sample(details, k=random.randint(1, 3))
                items = [(d, random.randint(1, 2)) for d in lines]
                subtotal = sum(float(d[2]) * qty for d, qty in items)

                # ~25% đơn có doanh thu dùng voucher
                discount = 0.0
                used_voucher = None
                if vouchers and status in (6, 7) and random.random() < 0.25:
                    used_voucher = random.choice(vouchers)
                    discount = voucher_discount(used_voucher, subtotal)

                shipping = random.choice(REVENUE_SHIPPING_FEES)
                final_amount = subtotal - discount + shipping

                cancelled_at = order_date if status == 8 else None
                cancel_reason = 'Khách đổi ý, không mua nữa' if status == 8 else None

                order_id = db.session.execute(text('''
                    INSERT INTO Orders (OrderDate, SubTotal, UserID, ShippingAddress,
                        PhoneNumber, Note, ReceiverName, ShippingFee, OrderStatusID,
                        TotalDiscount, FinalAmount, CancelReason, CancelledAt, CancelledByUserID)
                    OUTPUT inserted.OrderID
                    VALUES (:d, :sub, :uid, :addr, :phone, :note, :recv, :ship, :st,
                            :disc, :fin, :creason, :cat, :cby)
                '''), {
                    'd': order_date, 'sub': subtotal, 'uid': user_id, 'addr': address,
                    'phone': phone, 'note': f'{SEED_MARKER} đơn mẫu phục vụ thống kê',
                    'recv': receiver, 'ship': shipping, 'st': status,
                    'disc': discount, 'fin': final_amount,
                    'creason': cancel_reason, 'cat': cancelled_at,
                    'cby': user_id if status == 8 else None,
                }).scalar()

                for d, qty in items:
                    db.session.execute(text('''
                        INSERT INTO OrderDetails (OrderID, DetailID, Quantity, UnitPrice, IsStringingService)
                        VALUES (:oid, :did, :qty, :price, 0)
                    '''), {'oid': order_id, 'did': d[0], 'qty': qty, 'price': float(d[2])})
                    if status in (6, 7):
                        sold_by_product[d[1]] = sold_by_product.get(d[1], 0) + qty

                method = weighted_choice(PAYMENT_METHODS)
                pay_status = 'Completed' if status in (6, 7) else ('Refunded' if status == 8 and method != 'COD' else 'Pending')
                db.session.execute(text('''
                    INSERT INTO Payments (OrderID, PaymentMethod, PaymentDate, Amount, Status)
                    VALUES (:oid, :m, :d, :amt, :s)
                '''), {'oid': order_id, 'm': method, 'd': order_date,
                       'amt': final_amount, 's': pay_status})

                if used_voucher is not None:
                    db.session.execute(text('''
                        INSERT INTO OrderVouchers (OrderID, VoucherID, AppliedDiscount)
                        VALUES (:oid, :vid, :disc)
                    '''), {'oid': order_id, 'vid': used_voucher[0], 'disc': discount})
                    db.session.execute(text(
                        'UPDATE Vouchers SET UsedCount = UsedCount + 1 WHERE VoucherID = :vid'
                    ), {'vid': used_voucher[0]})

                total_orders += 1

    # Đồng bộ SoldQuantity để trang chủ/bestseller nhất quán với đơn đã bán
    for product_id, qty in sold_by_product.items():
        db.session.execute(text('''
            UPDATE Products SET SoldQuantity = ISNULL(SoldQuantity, 0) + :q
            WHERE ProductID = :pid
        '''), {'q': qty, 'pid': product_id})

    db.session.commit()
    print(f'Đã seed {total_orders} đơn hàng cho 2024–2025 '
          f'({len(sold_by_product)} sản phẩm được cập nhật SoldQuantity).')


def remove():
    ids = [r[0] for r in db.session.execute(text(
        "SELECT OrderID FROM Orders WHERE CHARINDEX(:m, Note) = 1"), {'m': SEED_MARKER}).fetchall()]
    if not ids:
        print('Không có dữ liệu seed để xóa.')
        return

    # Trả lại SoldQuantity và UsedCount trước khi xóa
    rows = db.session.execute(text(f'''
        SELECT d.ProductID, SUM(od.Quantity)
        FROM OrderDetails od
        JOIN Orders o ON o.OrderID = od.OrderID
        JOIN ProductDetails d ON d.DetailID = od.DetailID
        WHERE CHARINDEX(:m, o.Note) = 1 AND o.OrderStatusID IN (6, 7)
        GROUP BY d.ProductID
    '''), {'m': SEED_MARKER}).fetchall()
    for product_id, qty in rows:
        db.session.execute(text('''
            UPDATE Products SET SoldQuantity =
                CASE WHEN ISNULL(SoldQuantity, 0) >= :q THEN SoldQuantity - :q ELSE 0 END
            WHERE ProductID = :pid
        '''), {'q': qty, 'pid': product_id})
    db.session.execute(text('''
        UPDATE v SET v.UsedCount = CASE WHEN v.UsedCount >= x.Cnt THEN v.UsedCount - x.Cnt ELSE 0 END
        FROM Vouchers v
        JOIN (SELECT ov.VoucherID, COUNT(*) Cnt
              FROM OrderVouchers ov JOIN Orders o ON o.OrderID = ov.OrderID
              WHERE CHARINDEX(:m, o.Note) = 1 GROUP BY ov.VoucherID) x ON x.VoucherID = v.VoucherID
    '''), {'m': SEED_MARKER})

    db.session.execute(text('''
        DELETE ov FROM OrderVouchers ov JOIN Orders o ON o.OrderID = ov.OrderID
        WHERE CHARINDEX(:m, o.Note) = 1'''), {'m': SEED_MARKER})
    db.session.execute(text('''
        DELETE p FROM Payments p JOIN Orders o ON o.OrderID = p.OrderID
        WHERE CHARINDEX(:m, o.Note) = 1'''), {'m': SEED_MARKER})
    db.session.execute(text('''
        DELETE od FROM OrderDetails od JOIN Orders o ON o.OrderID = od.OrderID
        WHERE CHARINDEX(:m, o.Note) = 1'''), {'m': SEED_MARKER})
    db.session.execute(text('DELETE FROM Orders WHERE CHARINDEX(:m, Note) = 1'), {'m': SEED_MARKER})
    db.session.commit()
    print(f'Đã xóa {len(ids)} đơn hàng seed cùng dữ liệu liên quan.')


if __name__ == '__main__':
    random.seed(42)
    app = create_app()
    with app.app_context():
        if '--remove' in sys.argv:
            remove()
        else:
            existing = db.session.execute(text(
                'SELECT COUNT(*) FROM Orders WHERE CHARINDEX(:m, Note) = 1'), {'m': SEED_MARKER}).scalar()
            if existing:
                print(f'Đã có {existing} đơn seed trong DB — bỏ qua. '
                      f'Dùng "python3 seed_orders.py --remove" nếu muốn seed lại.')
            else:
                seed()
