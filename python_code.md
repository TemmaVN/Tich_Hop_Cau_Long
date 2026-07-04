# Phân tích luồng hoạt động — Backend_Python

Tài liệu này mô tả kiến trúc và luồng xử lý của từng endpoint trong `Backend_Python`
(Flask), gồm 2 nhóm nghiệp vụ chính: **Bảo hành** (`/api/Warranty`) và
**Thống kê** (`/api/admin/statistic`), cùng hạ tầng chung (xác thực JWT, kết nối DB,
phục vụ file upload) và script seed dữ liệu.

## 1. Kiến trúc tổng quan

```
Trình duyệt (React)
   │  gọi /api/...  (axios, kèm header Authorization: Bearer <token>)
   ▼
Vite dev server :3000            — proxy toàn bộ /api → localhost:8000
   ▼
API Gateway nginx :8000          — định tuyến theo path:
   ├── /api/Warranty*          → Backend Python :5001
   ├── /api/admin/statistic*   → Backend Python :5001
   ├── /api/python/*           → Backend Python :5001  (health, uploads)
   └── /* (còn lại)            → Backend .NET  :5000
   ▼
Flask (gunicorn, 2 worker) :5001
   ├── auth.py        — giải mã JWT (cùng secret với .NET)
   ├── routes/warranty.py
   ├── routes/statistic.py
   └── extensions.db  — SQLAlchemy → pyodbc → SQL Server :1433 (Web_Badminton)
```

Điểm mấu chốt của tích hợp: **Python không phát hành token** — nó xác thực token
do `AuthController` (.NET) cấp, nhờ dùng chung secret HS256. Người dùng đăng nhập
một lần, gọi được API của cả hai backend.

## 2. Khởi tạo ứng dụng

### 2.1. `app.py` — application factory

```
create_app()
  ├── Flask(__name__)
  ├── app.config.from_object(Config)     # config.py
  ├── db.init_app(app)                   # extensions.py — SQLAlchemy
  └── register_routes(app)               # routes/__init__.py
```

`routes/__init__.py` đăng ký 3 blueprint:

| Blueprint      | url_prefix              | Vai trò                                  |
|----------------|-------------------------|------------------------------------------|
| `sample_bp`    | `/api/python`           | health check, hello                      |
| `warranty_bp`  | `/api`                  | 5 endpoint `/Warranty...` + serve upload |
| `statistic_bp` | `/api/admin/statistic`  | 11 endpoint thống kê                     |

### 2.2. `config.py` — cấu hình từ biến môi trường

- `SQLALCHEMY_DATABASE_URI`: chuỗi `mssql+pyodbc` trỏ tới SQL Server trên máy
  (container chạy `network_mode: host` nên `localhost` là máy thật).
- `JWT_SECRET_KEY`: **phải trùng** secret trong `AuthController` (.NET)
  (`YourSecretKeyForAuthenticationShouldBeLongEnough`) — điều kiện để xác thực chéo.
- `UPLOAD_FOLDER`: thư mục lưu ảnh/video bảo hành, mount volume ra
  `./Backend_Python/uploads` để không mất khi rebuild.

### 2.3. `models.py` — map bảng có sẵn

Chỉ có 1 model `ServiceTicket` map vào bảng `ServiceTickets` **có sẵn** trong DB
(không tạo bảng mới). Nhóm thống kê không dùng ORM model mà truy vấn SQL thuần
qua `db.session.execute(text(...))` — phù hợp với truy vấn GROUP BY phức tạp.

## 3. Luồng xác thực — `auth.py`

Token do .NET phát hành bằng `JwtSecurityTokenHandler`, class này **đổi tên claim**
khi ghi vào JWT (OutboundClaimTypeMap):

| Claim .NET (`ClaimTypes.*`) | Key thực tế trong JWT payload |
|-----------------------------|-------------------------------|
| `NameIdentifier`            | `nameid`                      |
| `Email`                     | `email`                       |
| `Role`                      | `role` (chuỗi hoặc mảng)      |

Luồng của decorator:

```
request → token_required
  1. Đọc header Authorization, cắt tiền tố "Bearer "
  2. jwt.decode(token, JWT_SECRET_KEY, HS256)
       - hết hạn        → 401 "Phiên đăng nhập đã hết hạn."
       - sai chữ ký/rác  → 401 "Token không hợp lệ."
  3. Rút userId (nameid → int), email, roles (chuẩn hóa về list)
     — kiểm tra thêm dạng URI đầy đủ để phòng .NET đổi cấu hình
  4. Gắn g.current_user = {userId, email, roles} → chạy view

admin_required = token_required + kiểm tra 'Admin' ∈ roles (sai → 403)
```

Mọi endpoint phía sau chỉ cần đọc `g.current_user`, không đụng tới token nữa.

## 4. Nhóm API Bảo hành — `routes/warranty.py`

### 4.1. Mô hình dữ liệu

Bảng `ServiceTickets` chỉ có 7 cột, không đủ chỗ cho form bảo hành của FE
(serial, lý do, ảnh, ghi chú admin...). Cách giải quyết — **JSON trong cột text**:

| Cột bảng               | Lưu gì                                             |
|------------------------|-----------------------------------------------------|
| `ServiceTicketID`      | → `warrantyId` trả về FE                            |
| `OrderID`              | mã đơn hàng                                         |
| `CustomerRacketName`   | tên sản phẩm                                        |
| `CurrentCondition`     | **JSON**: `{type:"warranty", orderDetailId, serialNumber, reasonCategory, reasonLabel, description, customerId, customerName, images[], videoName, videoUrl, adminNote, status}` |
| `ReceivedDate`         | thời điểm tạo (`createdAt`)                         |
| `Status`               | giá trị hợp lệ theo CHECK constraint (xem 4.3)      |

Trường `type: "warranty"` là **discriminator**: bảng này còn có thể chứa ticket
đan vợt, nên mọi hàm đọc đều lọc qua `_parse_detail()` — JSON không parse được
hoặc thiếu discriminator thì bỏ qua, không bao giờ lẫn dữ liệu.

### 4.2. Luồng từng endpoint

**POST `/api/Warranty`** — khách tạo yêu cầu (multipart/form-data)

```
token_required
  → validate: productName, orderId bắt buộc (400 nếu thiếu)
  → lưu file:  images[] (đuôi ảnh hợp lệ) + video (đuôi video hợp lệ)
               tên file = uuid4().hex + đuôi  → uploads/warranty/
               URL trả về = /api/python/uploads/warranty/<file>   (route về Python)
               đuôi lạ → 400, không ghi DB
  → dựng detail JSON — customerId LẤY TỪ TOKEN (g.current_user), không tin form
  → INSERT ServiceTickets (Status cột = 'Đang chờ', status JSON = 'Chờ xử lý')
  → 201 + object claim đầy đủ (FE dùng ngay không cần refetch)
```

**GET `/api/Warranty/my-claims`** — khách xem yêu cầu của mình

```
token_required
  → _warranty_tickets(): SELECT toàn bộ, ORDER BY id DESC, lọc discriminator
  → lọc detail.customerId == g.current_user.userId   (so bằng token, không query param)
  → trả mảng JSON thuần (FE check Array.isArray(res.data))
```

**GET `/api/Warranty`** — admin xem tất cả

```
admin_required → _warranty_tickets() → trả toàn bộ mảng claim
```

**PUT `/api/Warranty/<id>/status`** — admin cập nhật trạng thái

```
admin_required
  → _get_warranty_or_404: đọc ticket + parse JSON (không phải warranty → 404)
  → validate status ∈ {Chờ xử lý, Đang xử lý, Đã xử lý, Từ chối}  (sai → 400)
  → ghi 2 nơi: cột Status = STATUS_TO_DB[status] (thỏa CHECK constraint)
               JSON.status = giá trị FE + JSON.adminNote nếu có
  → 200 + claim sau cập nhật
```

**DELETE `/api/Warranty/<id>`** — chủ yêu cầu hoặc admin xóa

```
token_required
  → không phải Admin VÀ không phải chủ (JSON.customerId ≠ userId) → 403
  → xóa file đính kèm trên đĩa (best-effort — lỗi IO không chặn việc xóa bản ghi)
  → DELETE bản ghi → 200
```

**GET `/api/python/uploads/<path>`** — phục vụ file tĩnh qua `send_from_directory`
(chặn path-traversal sẵn có của Flask).

### 4.3. Ánh xạ trạng thái (vì CHECK constraint)

Cột `Status` của `ServiceTickets` có CHECK constraint chỉ nhận
`Đang chờ / Đang xử lý / Đã xong / Đã trả khách`, trong khi FE dùng bộ khác.
Giải pháp: **JSON giữ trạng thái FE làm nguồn chính xác**, cột vật lý ghi giá trị
gần nghĩa nhất:

| Trạng thái FE (JSON) | Cột `Status` (DB) |
|----------------------|-------------------|
| Chờ xử lý            | Đang chờ          |
| Đang xử lý           | Đang xử lý        |
| Đã xử lý             | Đã xong           |
| Từ chối              | Đã trả khách      |

`_to_response()` luôn đọc trạng thái từ JSON nên FE không bao giờ thấy giá trị DB.

## 5. Nhóm API Thống kê — `routes/statistic.py`

### 5.1. Nguyên tắc thiết kế

Đây là bản Python **tương đương từng con số** với `StatisticController` (.NET) —
đã đối chiếu output hai bên trên cùng DB. Muốn vậy phải giữ đúng các quy ước
"không đồng nhất" sẵn có của bản gốc:

- "Đơn có doanh thu" = `OrderStatusID ∈ {6 Đã giao hàng, 7 Hoàn tất}`.
- Mỗi nhóm endpoint tính doanh thu theo **cột khác nhau** (đúng như .NET):

| Endpoint                          | Doanh thu tính theo       |
|-----------------------------------|---------------------------|
| overview, revenue/monthly         | `Orders.SubTotal`         |
| revenue/category, /brand, products/top, category-monthly | `OrderDetails.UnitPrice × Quantity` |
| orders/status, payment-method, vouchers, customers/top   | `Orders.FinalAmount`      |

- Lọc ngày cũng có 2 chế độ giống .NET (`_date_clause`):
  - nhóm revenue/category...: so sánh trực tiếp `OrderDate >= from / <= to`;
  - nhóm orders/status...: chuẩn hóa `from` về đầu ngày, `to` thành *exclusive*
    ngày kế tiếp (`< to+1d`) — đúng logic `ApplyOrderDateFilter` bên C#.
- Response bọc `{"success": true, "data": ...}`, key camelCase — trùng
  serializer mặc định của ASP.NET nên FE không phân biệt được backend nào trả lời.

### 5.2. Cấu trúc luồng chung

```
GET /api/admin/statistic/<x>
  → admin_required (403 nếu không phải Admin, 401 nếu thiếu/sai token)
  → parse query param (_parse_date/_parse_int — sai định dạng ném BadRequest → 400)
  → validate nghiệp vụ (year 2000..now+1, top 1..100, from ≤ to)
  → hàm _tính_toán(...) chạy 1 câu SQL GROUP BY, trả list/dict đã camelCase
  → hậu xử lý tại Python nếu .NET cũng làm ở service layer:
       _fill_share()  — tỷ trọng % (revenueShare/orderShare)
       growthRate     — tăng trưởng so tháng trước
  → _ok(data)
```

Các hàm tính toán tách khỏi view (`_overview`, `_revenue_by_month`,...) để
`full-report` tái sử dụng — gọi tuần tự 6 hàm rồi gộp thành một object.

### 5.3. Điểm đáng chú ý theo endpoint

- **`overview`** — 3 câu SQL: tổng SubTotal + đếm đơn doanh thu (có lọc ngày);
  `cancelledOrders` đếm **toàn bộ** đơn hủy *không* theo bộ lọc ngày (giữ nguyên
  hành vi .NET để số hai bên khớp); `totalCustomers` = COUNT DISTINCT UserID của
  *mọi* đơn trong khoảng ngày (không chỉ đơn doanh thu). `averageOrderValue` chia
  tại Python.
- **`revenue/monthly`** — GROUP BY MONTH; sau đó Python **đắp đủ 12 tháng**
  (tháng trống = 0) rồi tính `growthRate`: tháng 1 để `null`, tháng trước = 0 mà
  tháng này > 0 thì quy ước 100%.
- **`revenue/category` / `revenue/brand`** — JOIN 4–5 bảng
  (OrderDetails→Orders→ProductDetails→Products→Categories/Brands), GROUP BY danh mục
  hoặc thương hiệu; `totalOrders` = COUNT DISTINCT OrderID; tỷ trọng tính sau.
- **`products/top`** — như trên nhưng GROUP BY sản phẩm, `SELECT TOP (:top)`,
  sắp theo doanh thu giảm dần; nhận cả filter categoryId/brandId.
- **`revenue/category-monthly`** — GROUP BY (tháng, danh mục) cho biểu đồ đa đường;
  không đắp tháng trống (giống .NET).
- **`orders/status`** — LEFT JOIN từ `OrderStatuses` để **mọi trạng thái đều
  xuất hiện** kể cả 0 đơn; điều kiện ngày đặt **trong mệnh đề ON** để không phá
  LEFT JOIN; doanh thu chỉ cộng cho trạng thái 6/7 (CASE WHEN).
- **`revenue/payment-method`** — JOIN Payments, chỉ đơn doanh thu, GROUP BY
  phương thức, tính `revenueShare`.
- **`vouchers/effectiveness`** — từ `OrderVouchers` JOIN Vouchers + Orders (chỉ
  đơn doanh thu); `currentUsedCount` lấy từ cột `Vouchers.UsedCount`;
  `averageDiscountPerOrder` = tổng giảm / số đơn distinct.
- **`customers/top`** — GROUP BY (UserID, Email); FullName/PhoneNumber lấy bằng
  correlated subquery `TOP 1 ... ORDER BY ProfileID` (một user có thể nhiều profile);
  sắp theo tổng chi tiêu.
- **`full-report`** — gộp 6 phần cho Dashboard. Bản .NET của endpoint này **lỗi
  runtime** ("A second operation was started on this context instance" — chạy
  `Task.WhenAll` trên một DbContext); bản Python chạy tuần tự nên hoạt động
  bình thường — đây là endpoint Python *sửa được bug* của .NET.

### 5.4. Xử lý lỗi

- `BadRequest` (exception nội bộ) được `errorhandler` của blueprint bắt →
  `400 {"success": false, "message": ...}` — cùng format lỗi với .NET.
- Kiểu `Decimal` từ pyodbc được ép `float` (`_num`) trước khi `jsonify`;
  `datetime` chuyển ISO string.

## 6. Script seed dữ liệu — `seed_orders.py`

Không phải endpoint, chạy tay trong container:

```bash
docker exec backend_python python3 seed_orders.py            # seed
docker exec backend_python python3 seed_orders.py --remove   # gỡ toàn bộ
```

Luồng `seed()`:

```
1. fetch_reference_data() — lấy nguyên liệu THẬT từ DB:
     users    : mọi user không có role Admin
     details  : variant giá 45k–8tr (loại outlier 100tr + danh mục "Kiểm tra")
     vouchers : voucher đang active
2. Vòng lặp 24 tháng (2024–2025), mỗi tháng orders_per_month():
     2024 nền 9 đơn/tháng, 2025 nền 14 (tăng trưởng), +3 vào mùa vụ (T5,6,11,12)
3. Mỗi đơn: ngày giờ ngẫu nhiên trong tháng, trạng thái theo trọng số
   (62% Hoàn tất, 15% Đã giao, 10% Hủy kèm CancelReason, còn lại đang xử lý),
   1–3 dòng OrderDetails, ~25% đơn doanh thu dùng voucher
   (tính AppliedDiscount theo %/số tiền + trần MaxDiscountAmount,
    ghi OrderVouchers + tăng Vouchers.UsedCount),
   1 bản ghi Payments (COD 50% / Bank 30% / E-Wallet 20%).
   FinalAmount = SubTotal − TotalDiscount + ShippingFee.
4. Cộng dồn Products.SoldQuantity cho hàng đã bán → trang chủ/bestseller nhất quán.
5. Commit một lần.
```

Cơ chế an toàn:

- Mọi đơn seed có `Note` bắt đầu bằng `[seed-2024-2025]` → nhận diện được.
- **Idempotent**: chạy lại phát hiện marker và thoát. Lưu ý cách kiểm tra dùng
  `CHARINDEX(:marker, Note) = 1` chứ **không** dùng `LIKE` — vì `[...]` trong
  `LIKE` của SQL Server là *character class*, pattern `[seed-2024-2025]%` sẽ
  khớp sai hoàn toàn (bug đã gặp và sửa thực tế).
- `--remove` gỡ theo đúng thứ tự FK (OrderVouchers → Payments → OrderDetails →
  Orders) và **hoàn trả** SoldQuantity + UsedCount về trước khi seed.
- `random.seed(42)` cố định → dữ liệu tái lập được.

## 7. Bảng tra nhanh endpoint

| # | Method | Path | Quyền | File | Trả về |
|---|--------|------|-------|------|--------|
| 1 | GET  | `/api/python/health` | công khai | sample.py | `{status, service}` |
| 2 | GET  | `/api/python/hello` | công khai | sample.py | `{message}` |
| 3 | POST | `/api/Warranty` | đăng nhập | warranty.py | claim vừa tạo (201) |
| 4 | GET  | `/api/Warranty/my-claims` | đăng nhập | warranty.py | mảng claim của user |
| 5 | GET  | `/api/Warranty` | Admin | warranty.py | mảng mọi claim |
| 6 | PUT  | `/api/Warranty/{id}/status` | Admin | warranty.py | claim sau cập nhật |
| 7 | DELETE | `/api/Warranty/{id}` | chủ/Admin | warranty.py | message |
| 8 | GET  | `/api/python/uploads/{path}` | công khai | warranty.py | file tĩnh |
| 9 | GET  | `/api/admin/statistic/overview` | Admin | statistic.py | KPI tổng quan |
| 10 | GET | `/api/admin/statistic/revenue/category` | Admin | statistic.py | doanh thu theo danh mục |
| 11 | GET | `/api/admin/statistic/revenue/brand` | Admin | statistic.py | doanh thu theo thương hiệu |
| 12 | GET | `/api/admin/statistic/revenue/monthly?year=` | Admin | statistic.py | 12 tháng + growthRate |
| 13 | GET | `/api/admin/statistic/products/top?top=` | Admin | statistic.py | top sản phẩm |
| 14 | GET | `/api/admin/statistic/revenue/category-monthly?year=` | Admin | statistic.py | danh mục × tháng |
| 15 | GET | `/api/admin/statistic/full-report?year=` | Admin | statistic.py | gộp 6 phần |
| 16 | GET | `/api/admin/statistic/orders/status` | Admin | statistic.py | phân bố trạng thái đơn |
| 17 | GET | `/api/admin/statistic/revenue/payment-method` | Admin | statistic.py | cơ cấu thanh toán |
| 18 | GET | `/api/admin/statistic/vouchers/effectiveness?top=` | Admin | statistic.py | hiệu quả voucher |
| 19 | GET | `/api/admin/statistic/customers/top?top=` | Admin | statistic.py | top khách hàng |

## 8. Ví dụ luồng end-to-end hoàn chỉnh

Khách bấm "Gửi yêu cầu bảo hành" trong `WarrantyFormModal`:

```
1. FE dựng FormData (orderId, productName, serial, lý do, ảnh, video)
   → fetch POST /api/Warranty, header Bearer token         (WarrantyContext.createClaim)
2. Vite proxy /api → nginx :8000
3. nginx khớp location /api/Warranty (client_max_body_size 50m) → Flask :5001
4. token_required giải mã JWT → g.current_user = {userId: 8, roles: [Customer]}
5. create_claim(): validate → lưu 2 ảnh vào uploads/warranty/<uuid>.png
   → INSERT ServiceTickets (JSON detail, Status='Đang chờ') → commit
6. 201 {warrantyId, images: [/api/python/uploads/warranty/...], status: 'Chờ xử lý', ...}
7. FE render thẻ claim; thẻ <img src="/api/python/uploads/..."> đi lại đúng
   con đường proxy → nginx → Flask send_from_directory → hiển thị ảnh.

Admin mở trang Quản lý bảo hành → GET /api/Warranty (role Admin trong token)
→ đổi trạng thái → PUT /{id}/status → cột Status + JSON cập nhật đồng thời.
```

Admin mở trang Thống kê (`Statistics.jsx`):

```
1. StatisticContext gọi song song: overview, revenue/monthly?year=2025,
   revenue/category, orders/status, payment-method, vouchers, customers/top...
   riêng RevenueTab tự gọi thêm revenue/monthly?year=2024 để vẽ biểu đồ so sánh.
2. nginx route cả cụm /api/admin/statistic → Flask.
3. admin_required xác thực role Admin từ token .NET cấp.
4. Mỗi endpoint chạy 1 câu SQL GROUP BY trên dữ liệu Orders 2024/2025 (đã seed)
   + 2026 (dữ liệu gốc) → JSON {success, data} camelCase.
5. FE không biết (và không cần biết) response đến từ Python thay vì .NET.
```
