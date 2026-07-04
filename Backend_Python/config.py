import os

class Config:
    DEBUG = os.getenv('FLASK_DEBUG', 'False') == 'True'
    SECRET_KEY = os.getenv('SECRET_KEY', 'change-me-in-production')
    # Kết nối tới SQL Server đang chạy sẵn trên máy (giống Backend_Dotnet),
    # dùng localhost vì container chạy network_mode: host.
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'mssql+pyodbc://sa:Khoitoc123@localhost,1433/Web_Badminton'
        '?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # PHẢI trùng với SecretKey trong AuthController của Backend_Dotnet
    # để xác thực được token do .NET phát hành.
    JWT_SECRET_KEY = os.getenv(
        'JWT_SECRET_KEY',
        'YourSecretKeyForAuthenticationShouldBeLongEnough'
    )
    UPLOAD_FOLDER = os.getenv(
        'UPLOAD_FOLDER',
        os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    )
