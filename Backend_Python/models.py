from extensions import db


class ServiceTicket(db.Model):
    """Map vào bảng ServiceTickets có sẵn trong DB Web_Badminton.

    Yêu cầu bảo hành (warranty claim) được lưu vào bảng này:
    - CustomerRacketName  -> tên sản phẩm
    - CurrentCondition    -> JSON chứa các trường chi tiết mà bảng không có cột riêng
      (orderDetailId, serialNumber, reasonCategory, reasonLabel, description,
       customerId, customerName, images, videoName, adminNote)
    - ReceivedDate        -> ngày tạo yêu cầu
    - Status              -> 'Chờ xử lý' | 'Đang xử lý' | 'Đã xử lý' | 'Từ chối'
    """
    __tablename__ = 'ServiceTickets'

    service_ticket_id = db.Column('ServiceTicketID', db.Integer, primary_key=True)
    order_id = db.Column('OrderID', db.Integer, nullable=True)
    customer_racket_name = db.Column('CustomerRacketName', db.Unicode(250), nullable=False)
    current_condition = db.Column('CurrentCondition', db.UnicodeText, nullable=True)
    received_date = db.Column('ReceivedDate', db.DateTime, nullable=True)
    appointment_date = db.Column('AppointmentDate', db.DateTime, nullable=True)
    status = db.Column('Status', db.Unicode(50), nullable=True)
