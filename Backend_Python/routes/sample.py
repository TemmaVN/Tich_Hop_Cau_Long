from flask import Blueprint, jsonify

sample_bp = Blueprint('sample', __name__)

@sample_bp.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'backend-python'})

@sample_bp.route('/hello', methods=['GET'])
def hello():
    return jsonify({'message': 'Hello from Python Flask!'})
