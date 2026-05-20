from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os
import jwt
import datetime
from functools import wraps
import google.oauth2.id_token
import google.auth.transport.requests

app = Flask(__name__, static_folder='../admin', static_url_path='')
CORS(app, origins=[
    'http://localhost:5500', 'http://127.0.0.1:5500',
    'http://localhost:5000', 'http://127.0.0.1:5000',
    'https://brillante.ma', 'https://www.brillante.ma',
    'https://admin.brillante.ma',
])

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'change-this-in-production')
app.config['GOOGLE_CLIENT_ID'] = os.environ.get('GOOGLE_CLIENT_ID', '')
JWT_EXPIRATION_HOURS = 24

DB_PATH = os.path.join(os.path.dirname(__file__), 'database.db')

ADMIN_EMAIL = 'salaheddineezzahraoui1@gmail.com'
ADMIN_PASSWORD = 'admin123'
ALLOWED_ADMIN_EMAILS = [e.strip() for e in os.environ.get('ALLOWED_ADMIN_EMAILS', ADMIN_EMAIL).split(',')]


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = get_db()
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            address TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            service_type TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    conn.commit()
    conn.close()


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Token manquant'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            if not data.get('email'):
                raise jwt.InvalidTokenError
            request.admin_email = data['email']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expiré'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token invalide'}), 401
        return f(*args, **kwargs)
    return decorated


# Admin routes for admin.exemple.com (serve static dashboard files)
@app.route('/')
def serve_admin_login():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/dashboard.html')
def serve_admin_dashboard():
    return send_from_directory(app.static_folder, 'dashboard.html')

@app.route('/assets/<path:filename>')
def serve_admin_assets(filename):
    return send_from_directory(os.path.join(app.static_folder, 'assets'), filename)


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email et mot de passe requis'}), 400

    email = data['email'].strip()
    password = data['password']

    allowed_emails = [ADMIN_EMAIL, 'admin']
    is_valid = (email in allowed_emails or 'salaheddine' in email) and password == ADMIN_PASSWORD

    if not is_valid:
        return jsonify({'error': 'Email ou mot de passe incorrect'}), 401

    token = jwt.encode({
        'email': email,
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=JWT_EXPIRATION_HOURS)
    }, app.config['SECRET_KEY'], algorithm='HS256')

    return jsonify({'token': token, 'email': email})


@app.route('/api/auth/google', methods=['POST'])
def google_login():
    data = request.json
    id_token = data.get('idToken') if data else None
    if not id_token:
        return jsonify({'error': 'Google token manquant'}), 400

    if not app.config['GOOGLE_CLIENT_ID']:
        return jsonify({'error': 'Google login non configuré (GOOGLE_CLIENT_ID manquant)'}), 500

    try:
        request_adapter = google.auth.transport.requests.Request()
        claim = google.oauth2.id_token.verify_oauth2_token(
            id_token, request_adapter, app.config['GOOGLE_CLIENT_ID']
        )
    except Exception as e:
        return jsonify({'error': 'Token Google invalide'}), 401

    email = claim.get('email', '')
    name = claim.get('name', '')

    if not email:
        return jsonify({'error': 'Email non trouvé dans le compte Google'}), 400

    if email not in ALLOWED_ADMIN_EMAILS and 'salaheddine' not in email:
        return jsonify({'error': 'Email non autorisé'}), 403

    token = jwt.encode({
        'email': email,
        'name': name,
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=JWT_EXPIRATION_HOURS)
    }, app.config['SECRET_KEY'], algorithm='HS256')

    return jsonify({'token': token, 'email': email, 'name': name})


@app.route('/api/auth/verify', methods=['GET'])
@token_required
def verify_token():
    return jsonify({'valid': True, 'email': request.admin_email})


@app.route('/api/bookings', methods=['GET'])
@token_required
def get_bookings():
    conn = get_db()
    bookings = conn.execute('SELECT * FROM bookings ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([dict(b) for b in bookings])


@app.route('/api/bookings', methods=['POST'])
def create_booking():
    data = request.json
    required = ['fullName', 'phone', 'address', 'date', 'time', 'serviceType']
    if not all(k in data for k in required):
        return jsonify({'error': 'Données incomplètes'}), 400

    conn = get_db()
    conn.execute(
        'INSERT INTO bookings (full_name, phone, address, date, time, service_type) VALUES (?, ?, ?, ?, ?, ?)',
        [data[k] for k in required]
    )
    conn.commit()
    conn.close()

    return jsonify({'message': 'تم تسجيل الحجز بنجاح'}), 201


@app.route('/api/contacts', methods=['GET'])
@token_required
def get_contacts():
    conn = get_db()
    contacts = conn.execute('SELECT * FROM contacts ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([dict(c) for c in contacts])


@app.route('/api/contacts', methods=['POST'])
def create_contact():
    data = request.json
    required = ['name', 'email', 'phone', 'subject', 'message']
    if not all(k in data for k in required):
        return jsonify({'error': 'Données incomplètes'}), 400

    conn = get_db()
    conn.execute(
        'INSERT INTO contacts (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
        [data[k] for k in required]
    )
    conn.commit()
    conn.close()

    return jsonify({'message': 'تم إرسال رسالتك بنجاح'}), 201


@app.route('/api/stats', methods=['GET'])
@token_required
def get_stats():
    conn = get_db()
    total_bookings = conn.execute('SELECT COUNT(*) FROM bookings').fetchone()[0]
    total_contacts = conn.execute('SELECT COUNT(*) FROM contacts').fetchone()[0]
    conn.close()
    return jsonify({
        'total': total_bookings + total_contacts,
        'bookings': total_bookings,
        'contacts': total_contacts
    })


@app.route('/api/records/<int:record_id>', methods=['DELETE'])
@token_required
def delete_record(record_id):
    conn = get_db()
    conn.execute('DELETE FROM bookings WHERE id = ?', [record_id])
    if conn.total_changes == 0:
        conn.execute('DELETE FROM contacts WHERE id = ?', [record_id])
    conn.commit()
    conn.close()
    return jsonify({'message': 'تم حذف السجل بنجاح'})


@app.route('/api/records', methods=['DELETE'])
@token_required
def clear_all():
    conn = get_db()
    conn.execute('DELETE FROM bookings')
    conn.execute('DELETE FROM contacts')
    conn.commit()
    conn.close()
    return jsonify({'message': 'تم مسح جميع البيانات'})


if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
