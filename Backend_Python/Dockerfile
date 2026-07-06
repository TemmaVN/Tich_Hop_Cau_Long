FROM python:3.12-slim AS base

RUN apt-get update && apt-get install -y \
    curl gnupg2 apt-transport-https unixodbc-dev \
    && mkdir -p /etc/apt/keyrings \
    && curl -sSL https://packages.microsoft.com/keys/microsoft.asc \
        | gpg --dearmor -o /etc/apt/keyrings/microsoft-prod.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" \
        > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql18 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

# Stage debug — chạy debugpy lắng nghe cổng 5678 để VS Code attach đặt breakpoint.
# Build bằng docker-compose.debug.yml (target: debug); không dùng cho production.
FROM base AS debug
RUN pip install --no-cache-dir debugpy==1.8.14
# -Xfrozen_modules=off: debugpy khuyến nghị để breakpoint không bị bỏ qua
CMD ["python", "-Xfrozen_modules=off", "-m", "debugpy", "--listen", "0.0.0.0:5678", "app.py"]

# Stage cuối = mặc định khi build không chỉ định target (production).
FROM base AS production
EXPOSE 5001
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "2", "app:create_app()"]
