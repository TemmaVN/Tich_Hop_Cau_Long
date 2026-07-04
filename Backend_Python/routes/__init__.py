from .sample import sample_bp
from .statistic import statistic_bp
from .warranty import warranty_bp

def register_routes(app):
    app.register_blueprint(sample_bp, url_prefix='/api/python')
    # Warranty dùng prefix /api để khớp đường dẫn FE gọi: /api/Warranty/...
    # (gateway đã route /api/Warranty và /api/python về backend này)
    app.register_blueprint(warranty_bp, url_prefix='/api')
    # Thống kê — bản Python tương đương StatisticController (.NET),
    # gateway route /api/admin/statistic về backend này.
    app.register_blueprint(statistic_bp, url_prefix='/api/admin/statistic')
