"""API Thống kê (/api/admin/statistic) — bản Python tương đương StatisticController (.NET).

Giữ nguyên contract với FrontEnd (StatisticContext, Statistics.jsx):
- Response bọc {"success": true, "data": ...}, key camelCase.
- Cùng ngữ nghĩa tính toán với StatisticRepository.cs:
  * "Đơn có doanh thu" = OrderStatusID 6 (Đã giao hàng) hoặc 7 (Hoàn tất)
  * overview & revenue/monthly tính theo SubTotal
  * revenue/category|brand & products/top tính theo UnitPrice * Quantity
  * orders/status, revenue/payment-method, vouchers, customers tính theo FinalAmount
  * revenue/monthly luôn trả đủ 12 tháng + growthRate so với tháng trước
"""
from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request
from sqlalchemy import text

from auth import admin_required
from extensions import db

statistic_bp = Blueprint('statistic', __name__)

REVENUE_STATUSES = '6, 7'   # DaGiaoHang, HoanTat
CANCELLED_STATUS = 8


# ── Helpers ──────────────────────────────────────────────────────────────────

class BadRequest(Exception):
    pass


def _ok(data):
    return jsonify({'success': True, 'data': data})


def _fail(message, code=400):
    return jsonify({'success': False, 'message': message}), code


def _num(value):
    """Decimal/None -> float/0 để jsonify được."""
    return float(value) if value is not None else 0.0


def _parse_date(name):
    raw = request.args.get(name)
    if not raw:
        return None
    try:
        return datetime.fromisoformat(raw.replace('Z', '+00:00')).replace(tzinfo=None)
    except ValueError:
        raise BadRequest(f"Tham số '{name}' không phải ngày hợp lệ.")


def _parse_int(name, default=None):
    raw = request.args.get(name)
    if raw in (None, ''):
        return default
    try:
        return int(raw)
    except ValueError:
        raise BadRequest(f"Tham số '{name}' không hợp lệ.")


def _validate_range(from_date, to_date):
    if from_date and to_date and from_date.date() > to_date.date():
        raise BadRequest('Ngày bắt đầu không được lớn hơn ngày kết thúc.')


def _validate_top(top):
    if top <= 0 or top > 100:
        raise BadRequest('Top phải nằm trong khoảng 1 đến 100.')


def _rows(sql, **params):
    return db.session.execute(text(sql), params).fetchall()


def _date_clause(alias, from_date, to_date, params, normalize=False):
    """Sinh điều kiện lọc ngày. normalize=True: from lấy đầu ngày, to lấy hết ngày
    (giống ApplyOrderDateFilter bên .NET); False: so sánh trực tiếp >= / <=."""
    clause = ''
    if from_date is not None:
        params['fromDate'] = from_date.replace(hour=0, minute=0, second=0, microsecond=0) if normalize else from_date
        clause += f' AND {alias}.OrderDate >= :fromDate'
    if to_date is not None:
        if normalize:
            params['toDate'] = to_date.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
            clause += f' AND {alias}.OrderDate < :toDate'
        else:
            params['toDate'] = to_date
            clause += f' AND {alias}.OrderDate <= :toDate'
    return clause


# ── Các hàm tính toán (dùng chung cho endpoint riêng lẻ và full-report) ──────

def _overview(from_date, to_date):
    params = {}
    date_sql = _date_clause('o', from_date, to_date, params)
    row = _rows(f'''
        SELECT ISNULL(SUM(o.SubTotal), 0), COUNT(*)
        FROM Orders o
        WHERE o.OrderStatusID IN ({REVENUE_STATUSES}) {date_sql}
    ''', **params)[0]
    total_revenue, total_orders = _num(row[0]), row[1]
    cancelled = _rows('SELECT COUNT(*) FROM Orders WHERE OrderStatusID = :s', s=CANCELLED_STATUS)[0][0]
    customers = _rows(f'''
        SELECT COUNT(DISTINCT o.UserID) FROM Orders o WHERE 1 = 1 {date_sql}
    ''', **params)[0][0]
    return {
        'totalRevenue': total_revenue,
        'totalOrders': total_orders,
        'cancelledOrders': cancelled,
        'totalCustomers': customers,
        'averageOrderValue': total_revenue / total_orders if total_orders > 0 else 0,
    }


def _revenue_by_category(from_date, to_date, category_id):
    params = {}
    date_sql = _date_clause('o', from_date, to_date, params)
    cat_sql = ''
    if category_id is not None:
        params['categoryId'] = category_id
        cat_sql = ' AND p.CategoryID = :categoryId'
    rows = _rows(f'''
        SELECT p.CategoryID, c.CategoryName,
               SUM(od.UnitPrice * od.Quantity),
               COUNT(DISTINCT od.OrderID),
               SUM(od.Quantity)
        FROM OrderDetails od
        JOIN Orders o          ON o.OrderID = od.OrderID
        JOIN ProductDetails d  ON d.DetailID = od.DetailID
        JOIN Products p        ON p.ProductID = d.ProductID
        JOIN Categories c      ON c.CategoryID = p.CategoryID
        WHERE o.OrderStatusID IN ({REVENUE_STATUSES}) {date_sql} {cat_sql}
        GROUP BY p.CategoryID, c.CategoryName
        ORDER BY SUM(od.UnitPrice * od.Quantity) DESC
    ''', **params)
    result = [{'categoryId': r[0], 'categoryName': r[1], 'totalRevenue': _num(r[2]),
               'totalOrders': r[3], 'totalItems': r[4], 'revenueShare': 0.0} for r in rows]
    _fill_share(result, 'totalRevenue', 'revenueShare')
    return result


def _revenue_by_brand(from_date, to_date, brand_id):
    params = {}
    date_sql = _date_clause('o', from_date, to_date, params)
    brand_sql = ''
    if brand_id is not None:
        params['brandId'] = brand_id
        brand_sql = ' AND p.BrandID = :brandId'
    rows = _rows(f'''
        SELECT p.BrandID, b.BrandName,
               SUM(od.UnitPrice * od.Quantity),
               COUNT(DISTINCT od.OrderID),
               SUM(od.Quantity)
        FROM OrderDetails od
        JOIN Orders o          ON o.OrderID = od.OrderID
        JOIN ProductDetails d  ON d.DetailID = od.DetailID
        JOIN Products p        ON p.ProductID = d.ProductID
        JOIN Brands b          ON b.BrandID = p.BrandID
        WHERE o.OrderStatusID IN ({REVENUE_STATUSES}) {date_sql} {brand_sql}
        GROUP BY p.BrandID, b.BrandName
        ORDER BY SUM(od.UnitPrice * od.Quantity) DESC
    ''', **params)
    result = [{'brandId': r[0], 'brandName': r[1], 'totalRevenue': _num(r[2]),
               'totalOrders': r[3], 'totalItems': r[4], 'revenueShare': 0.0} for r in rows]
    _fill_share(result, 'totalRevenue', 'revenueShare')
    return result


def _fill_share(items, value_key, share_key):
    total = sum(i[value_key] for i in items)
    if total > 0:
        for i in items:
            i[share_key] = round(i[value_key] / total * 100, 2)


def _revenue_by_month(year):
    rows = _rows(f'''
        SELECT MONTH(o.OrderDate), ISNULL(SUM(o.SubTotal), 0), COUNT(*)
        FROM Orders o
        WHERE o.OrderDate IS NOT NULL AND YEAR(o.OrderDate) = :year
          AND o.OrderStatusID IN ({REVENUE_STATUSES})
        GROUP BY MONTH(o.OrderDate)
    ''', year=year)
    by_month = {r[0]: r for r in rows}
    result = []
    for m in range(1, 13):
        r = by_month.get(m)
        result.append({
            'month': m, 'year': year,
            'totalRevenue': _num(r[1]) if r else 0.0,
            'totalOrders': r[2] if r else 0,
            'growthRate': None,
        })
    # Tăng trưởng so với tháng trước (tháng 1 giữ None như .NET)
    for i in range(1, 12):
        prev, curr = result[i - 1]['totalRevenue'], result[i]['totalRevenue']
        if prev > 0:
            result[i]['growthRate'] = round((curr - prev) / prev * 100, 2)
        else:
            result[i]['growthRate'] = 100 if curr > 0 else 0
    return result


def _top_products(from_date, to_date, category_id, brand_id, top):
    params = {'top': top}
    date_sql = _date_clause('o', from_date, to_date, params)
    extra = ''
    if category_id is not None:
        params['categoryId'] = category_id
        extra += ' AND p.CategoryID = :categoryId'
    if brand_id is not None:
        params['brandId'] = brand_id
        extra += ' AND p.BrandID = :brandId'
    rows = _rows(f'''
        SELECT TOP (:top) p.ProductID, p.ProductName, c.CategoryName, b.BrandName,
               SUM(od.Quantity), SUM(od.UnitPrice * od.Quantity)
        FROM OrderDetails od
        JOIN Orders o          ON o.OrderID = od.OrderID
        JOIN ProductDetails d  ON d.DetailID = od.DetailID
        JOIN Products p        ON p.ProductID = d.ProductID
        JOIN Categories c      ON c.CategoryID = p.CategoryID
        JOIN Brands b          ON b.BrandID = p.BrandID
        WHERE o.OrderStatusID IN ({REVENUE_STATUSES}) {date_sql} {extra}
        GROUP BY p.ProductID, p.ProductName, c.CategoryName, b.BrandName
        ORDER BY SUM(od.UnitPrice * od.Quantity) DESC
    ''', **params)
    return [{'productId': r[0], 'productName': r[1], 'categoryName': r[2], 'brandName': r[3],
             'totalSold': r[4], 'totalRevenue': _num(r[5])} for r in rows]


def _revenue_category_by_month(year, category_id):
    params = {'year': year}
    cat_sql = ''
    if category_id is not None:
        params['categoryId'] = category_id
        cat_sql = ' AND p.CategoryID = :categoryId'
    rows = _rows(f'''
        SELECT MONTH(o.OrderDate), p.CategoryID, c.CategoryName,
               SUM(od.UnitPrice * od.Quantity)
        FROM OrderDetails od
        JOIN Orders o          ON o.OrderID = od.OrderID
        JOIN ProductDetails d  ON d.DetailID = od.DetailID
        JOIN Products p        ON p.ProductID = d.ProductID
        JOIN Categories c      ON c.CategoryID = p.CategoryID
        WHERE o.OrderDate IS NOT NULL AND YEAR(o.OrderDate) = :year
          AND o.OrderStatusID IN ({REVENUE_STATUSES}) {cat_sql}
        GROUP BY MONTH(o.OrderDate), p.CategoryID, c.CategoryName
        ORDER BY MONTH(o.OrderDate)
    ''', **params)
    return [{'month': r[0], 'categoryId': r[1], 'categoryName': r[2],
             'totalRevenue': _num(r[3])} for r in rows]


# ── Endpoints ────────────────────────────────────────────────────────────────

@statistic_bp.errorhandler(BadRequest)
def _handle_bad_request(e):
    return _fail(str(e))


@statistic_bp.route('/overview', methods=['GET'])
@admin_required
def overview():
    from_date, to_date = _parse_date('fromDate'), _parse_date('toDate')
    return _ok(_overview(from_date, to_date))


@statistic_bp.route('/revenue/category', methods=['GET'])
@admin_required
def revenue_by_category():
    return _ok(_revenue_by_category(_parse_date('fromDate'), _parse_date('toDate'),
                                    _parse_int('categoryId')))


@statistic_bp.route('/revenue/brand', methods=['GET'])
@admin_required
def revenue_by_brand():
    return _ok(_revenue_by_brand(_parse_date('fromDate'), _parse_date('toDate'),
                                 _parse_int('brandId')))


@statistic_bp.route('/revenue/monthly', methods=['GET'])
@admin_required
def revenue_by_month():
    year = _parse_int('year', 0)
    if year == 0:
        year = datetime.now(timezone.utc).year
    if year < 2000 or year > datetime.now(timezone.utc).year + 1:
        return _fail('Năm không hợp lệ.')
    return _ok(_revenue_by_month(year))


@statistic_bp.route('/products/top', methods=['GET'])
@admin_required
def top_products():
    top = _parse_int('top', 10)
    _validate_top(top)
    return _ok(_top_products(_parse_date('fromDate'), _parse_date('toDate'),
                             _parse_int('categoryId'), _parse_int('brandId'), top))


@statistic_bp.route('/revenue/category-monthly', methods=['GET'])
@admin_required
def revenue_category_by_month():
    year = _parse_int('year', datetime.now(timezone.utc).year)
    if year < 2000 or year > datetime.now(timezone.utc).year + 1:
        return _fail('Năm không hợp lệ.')
    return _ok(_revenue_category_by_month(year, _parse_int('categoryId')))


@statistic_bp.route('/full-report', methods=['GET'])
@admin_required
def full_report():
    from_date, to_date = _parse_date('fromDate'), _parse_date('toDate')
    category_id, brand_id = _parse_int('categoryId'), _parse_int('brandId')
    year = _parse_int('year', 0)
    if year == 0:
        year = datetime.now(timezone.utc).year
    return _ok({
        'overview': _overview(from_date, to_date),
        'revenueByCategories': _revenue_by_category(from_date, to_date, category_id),
        'revenueByBrands': _revenue_by_brand(from_date, to_date, brand_id),
        'revenueByMonths': _revenue_by_month(year),
        'topProducts': _top_products(from_date, to_date, None, None, 10),
        'revenueCategoryMonthly': _revenue_category_by_month(year, None),
    })


@statistic_bp.route('/orders/status', methods=['GET'])
@admin_required
def order_status():
    from_date, to_date = _parse_date('fromDate'), _parse_date('toDate')
    _validate_range(from_date, to_date)
    params = {}
    date_sql = _date_clause('o', from_date, to_date, params, normalize=True)
    rows = _rows(f'''
        SELECT s.OrderStatusID, s.StatusName,
               COUNT(o.OrderID),
               ISNULL(SUM(CASE WHEN o.OrderStatusID IN ({REVENUE_STATUSES})
                               THEN ISNULL(o.FinalAmount, 0) ELSE 0 END), 0)
        FROM OrderStatuses s
        LEFT JOIN Orders o ON o.OrderStatusID = s.OrderStatusID {date_sql}
        GROUP BY s.OrderStatusID, s.StatusName
        ORDER BY s.OrderStatusID
    ''', **params)
    result = [{'statusId': r[0], 'statusName': r[1], 'totalOrders': r[2],
               'totalRevenue': _num(r[3]), 'orderShare': 0.0} for r in rows]
    _fill_share(result, 'totalOrders', 'orderShare')
    return _ok(result)


@statistic_bp.route('/revenue/payment-method', methods=['GET'])
@admin_required
def revenue_by_payment_method():
    from_date, to_date = _parse_date('fromDate'), _parse_date('toDate')
    _validate_range(from_date, to_date)
    params = {}
    date_sql = _date_clause('o', from_date, to_date, params, normalize=True)
    rows = _rows(f'''
        SELECT pm.PaymentMethod, COUNT(*), ISNULL(SUM(ISNULL(o.FinalAmount, 0)), 0)
        FROM Orders o
        JOIN Payments pm ON pm.OrderID = o.OrderID
        WHERE o.OrderStatusID IN ({REVENUE_STATUSES}) {date_sql}
        GROUP BY pm.PaymentMethod
        ORDER BY 3 DESC
    ''', **params)
    result = [{'paymentMethod': r[0], 'totalOrders': r[1],
               'totalRevenue': _num(r[2]), 'revenueShare': 0.0} for r in rows]
    _fill_share(result, 'totalRevenue', 'revenueShare')
    return _ok(result)


@statistic_bp.route('/vouchers/effectiveness', methods=['GET'])
@admin_required
def voucher_effectiveness():
    from_date, to_date = _parse_date('fromDate'), _parse_date('toDate')
    _validate_range(from_date, to_date)
    top = _parse_int('top', 10)
    _validate_top(top)
    params = {'top': top}
    date_sql = _date_clause('o', from_date, to_date, params, normalize=True)
    rows = _rows(f'''
        SELECT TOP (:top) v.VoucherID, v.VoucherCode, v.UsedCount,
               COUNT(DISTINCT ov.OrderID),
               SUM(ov.AppliedDiscount),
               SUM(ISNULL(o.FinalAmount, 0))
        FROM OrderVouchers ov
        JOIN Vouchers v ON v.VoucherID = ov.VoucherID
        JOIN Orders o   ON o.OrderID = ov.OrderID
        WHERE o.OrderStatusID IN ({REVENUE_STATUSES}) {date_sql}
        GROUP BY v.VoucherID, v.VoucherCode, v.UsedCount
        ORDER BY COUNT(DISTINCT ov.OrderID) DESC, SUM(ov.AppliedDiscount) DESC
    ''', **params)
    result = []
    for r in rows:
        total_orders = r[3]
        total_discount = _num(r[4])
        result.append({
            'voucherId': r[0], 'voucherCode': r[1], 'currentUsedCount': r[2],
            'totalOrders': total_orders, 'totalDiscount': total_discount,
            'totalRevenue': _num(r[5]),
            'averageDiscountPerOrder': total_discount / total_orders if total_orders > 0 else 0,
        })
    return _ok(result)


@statistic_bp.route('/customers/top', methods=['GET'])
@admin_required
def top_customers():
    from_date, to_date = _parse_date('fromDate'), _parse_date('toDate')
    _validate_range(from_date, to_date)
    top = _parse_int('top', 10)
    _validate_top(top)
    params = {'top': top}
    date_sql = _date_clause('o', from_date, to_date, params, normalize=True)
    rows = _rows(f'''
        SELECT TOP (:top) o.UserID, u.Email,
               (SELECT TOP 1 p.FullName FROM UserProfiles p
                WHERE p.UserID = o.UserID ORDER BY p.ProfileID),
               (SELECT TOP 1 p.PhoneNumber FROM UserProfiles p
                WHERE p.UserID = o.UserID ORDER BY p.ProfileID),
               COUNT(*), SUM(ISNULL(o.FinalAmount, 0)), MAX(o.OrderDate)
        FROM Orders o
        JOIN Users u ON u.UserID = o.UserID
        WHERE o.OrderStatusID IN ({REVENUE_STATUSES}) {date_sql}
        GROUP BY o.UserID, u.Email
        ORDER BY SUM(ISNULL(o.FinalAmount, 0)) DESC, COUNT(*) DESC
    ''', **params)
    return _ok([{'userId': r[0], 'email': r[1], 'fullName': r[2], 'phoneNumber': r[3],
                 'totalOrders': r[4], 'totalSpent': _num(r[5]),
                 'lastOrderDate': r[6].isoformat() if r[6] else None} for r in rows])
