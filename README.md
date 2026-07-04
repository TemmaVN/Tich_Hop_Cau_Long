# Tích Hợp Cầu Lông — Full Stack (Docker)

Chạy toàn bộ (FrontEnd + API Gateway + 2 Backend) bằng **1 lệnh**, kết nối tới
SQL Server đang chạy sẵn trên máy.

## Kiến trúc

```
   http://localhost:3000  (FrontEnd — Vite dev)
              │  proxy /api
              ▼
   http://localhost:8000  (API Gateway — nginx)
         ┌────┴─────────────────┐
         │ /api/python/*        │ /* (mọi path còn lại)
         ▼                      ▼
   Python Flask :5001     .NET 9 :5000
         └──────────┬───────────┘
                    ▼
          SQL Server :1433  ← chạy sẵn trên máy
          DB Web_Badminton    (KHÔNG nằm trong compose)
```

Tất cả container dùng `network_mode: host`, nên `localhost` trong container =
`localhost` máy. Kết nối DB giống hệt khi chạy trực tiếp. Compose **không**
tạo database.

| Service        | Cổng | Vai trò                                   |
|----------------|------|-------------------------------------------|
| frontend       | 3000 | Vite dev server (hot-reload), proxy `/api`|
| gateway        | 8000 | nginx — 1 cổng route tới 2 backend        |
| backend_dotnet | 5000 | ASP.NET Core 9                            |
| backend_python | 5001 | Flask (khung), prefix `/api/python`       |
| SQL Server     | 1433 | Chạy sẵn trên máy, không đụng tới          |

## Chạy (1 lệnh)

```bash
docker compose up -d --build
```

Mở trình duyệt: **http://localhost:3000**

Kiểm tra nhanh:
- FrontEnd:        http://localhost:3000
- Gateway → .NET:   http://localhost:8000/api/Product/home
- Gateway → Python: http://localhost:8000/api/python/health

## Dừng

```bash
docker compose down
```

> SQL Server chạy độc lập bên ngoài compose nên lệnh này **không** ảnh hưởng database.

## Định tuyến qua Gateway (cổng 8000)

| Path                    | Đích               |
|-------------------------|--------------------|
| `/api/Warranty*`        | Backend Python     |
| `/api/admin/statistic*` | Backend Python     |
| `/api/python/*`         | Backend Python     |
| `/*` (còn lại)          | Backend .NET       |

FrontEnd (Vite) proxy toàn bộ `/api` và `/uploads` về gateway `localhost:8000`.

## Backend Python — cấu trúc

```
Backend_Python/
├── app.py              # application factory (init db + routes)
├── config.py           # DATABASE_URL / JWT_SECRET_KEY / UPLOAD_FOLDER từ env
├── extensions.py       # SQLAlchemy instance
├── models.py           # ServiceTicket (map bảng ServiceTickets có sẵn)
├── auth.py             # giải mã JWT do Backend_Dotnet phát hành (cùng secret)
├── requirements.txt    # Flask, SQLAlchemy, pyodbc, PyJWT, gunicorn...
├── Dockerfile          # Python 3.12 + ODBC Driver 18 for SQL Server
├── uploads/            # ảnh/video bảo hành (mount volume, gitignore)
├── seed_orders.py      # seed đơn hàng 2024–2025 cho trang thống kê
└── routes/
    ├── __init__.py     # register_routes(app)
    ├── sample.py       # /api/python/health, /api/python/hello
    ├── warranty.py     # API Bảo hành /api/Warranty (FE cần, .NET chưa có)
    └── statistic.py    # API Thống kê /api/admin/statistic (bản Python)
```

## API Bảo hành (Backend Python đảm nhận)

FrontEnd có sẵn `warrantyApi` (WarrantyFormModal, WarrantyManagement, MyOrders)
nhưng Backend .NET chưa có controller nào — Backend Python bổ sung nhóm này,
lưu vào bảng `ServiceTickets` có sẵn trong DB:

| Method | Path                          | Quyền       | Mô tả                                |
|--------|-------------------------------|-------------|--------------------------------------|
| POST   | `/api/Warranty`               | Đăng nhập   | Khách tạo yêu cầu (multipart: ảnh/video) |
| GET    | `/api/Warranty/my-claims`     | Đăng nhập   | Yêu cầu bảo hành của tôi             |
| GET    | `/api/Warranty`               | Admin       | Tất cả yêu cầu                        |
| PUT    | `/api/Warranty/{id}/status`   | Admin       | Cập nhật trạng thái + ghi chú        |
| DELETE | `/api/Warranty/{id}`          | Chủ / Admin | Xóa yêu cầu (kèm file đính kèm)      |

- Token dùng chung với .NET (cùng JWT secret, HS256) — đăng nhập 1 lần dùng cả 2 backend.
- Trạng thái FE (`Chờ xử lý / Đang xử lý / Đã xử lý / Từ chối`) lưu trong JSON
  `CurrentCondition`; cột `Status` của bảng ghi giá trị hợp lệ theo CHECK constraint
  (`Đang chờ / Đang xử lý / Đã xong / Đã trả khách`).
- File đính kèm phục vụ tại `/api/python/uploads/warranty/...` (route về Python).

## API Thống kê (Backend Python đảm nhận)

`/api/admin/statistic/*` (11 endpoint: overview, revenue/category, revenue/brand,
revenue/monthly, products/top, revenue/category-monthly, full-report, orders/status,
revenue/payment-method, vouchers/effectiveness, customers/top) được cài lại bằng
Python với **cùng contract và cùng kết quả** với StatisticController (.NET) —
đã đối chiếu số liệu từng endpoint. Gateway route nhóm này về Python.

> Lưu ý: `full-report` bên .NET bị lỗi runtime (dùng chung DbContext với
> `Task.WhenAll`), bản Python hoạt động bình thường.

### Dữ liệu mẫu cho trang Thống kê

Trang Statistics của FE so sánh cứng năm **2024 vs 2025**, nhưng DB gốc chỉ có
đơn năm 2026. Script seed sinh ~330 đơn hàng thật (Orders, OrderDetails,
Payments, OrderVouchers, cập nhật SoldQuantity) trải đều 24 tháng 2024–2025
với xu hướng tăng trưởng:

```bash
docker exec backend_python python3 seed_orders.py            # seed (idempotent)
docker exec backend_python python3 seed_orders.py --remove   # gỡ toàn bộ dữ liệu seed
```

Mọi đơn seed có `Note` bắt đầu bằng `[seed-2024-2025]` nên nhận diện/gỡ được an toàn.

Thêm route mới: tạo file trong `routes/`, đăng ký blueprint trong `routes/__init__.py`:

```python
from .my_module import my_bp

def register_routes(app):
    app.register_blueprint(my_bp, url_prefix='/api/python')
```

## Ghi chú

- Sửa code FrontEnd → tự hot-reload (source được mount vào container).
- Sửa code backend (.NET / Python) → chạy lại `docker compose up -d --build`.
- Mật khẩu SA đang để trong `docker-compose.yml` cho tiện học tập; nếu đẩy repo
  public nên chuyển sang file `.env` (đã gitignore).
