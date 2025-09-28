import os
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
# from flask_helmet import Helmet  # Not available in simplified requirements
from dotenv import load_dotenv
import logging
from datetime import datetime

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET', 'your-jwt-secret-here')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # No expiration for now
app.config['JWT_TOKEN_LOCATION'] = ['headers', 'cookies']
app.config['JWT_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['JWT_COOKIE_CSRF_PROTECT'] = False
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///license_manager.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JSON_SORT_KEYS'] = False

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)
migrate = Migrate(app, db)
# helmet = Helmet(app)  # Not available in simplified requirements

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["1000 per hour"]
)

# Configure CORS
CORS(app, 
     origins=[
         'http://localhost:3000',
         'http://localhost:3002', 
         'http://localhost:3003',
         'http://localhost:3004',
         'http://localhost:3009'
     ],
     supports_credentials=True,
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
     expose_headers=['Content-Type', 'Authorization'])

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import models (must be after db initialization)
from models.user import User
from models.license import License

# Import blueprints
from routes.auth import auth_bp
from routes.licenses import licenses_bp
from routes.security import security_bp
from routes.secure_licenses import secure_licenses_bp
from routes.daemon import daemon_bp

# Configure URL trailing slash handling
app.url_map.strict_slashes = False

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(licenses_bp, url_prefix='/api/licenses')
app.register_blueprint(security_bp, url_prefix='/api/security')
app.register_blueprint(secure_licenses_bp, url_prefix='/api/secure-licenses')
app.register_blueprint(daemon_bp, url_prefix='/api/daemon')

# Health check endpoint
@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'ok',
        'message': 'Torro License Manager API is running',
        'timestamp': datetime.utcnow().isoformat(),
        'config': {
            'environment': os.getenv('FLASK_ENV', 'development'),
            'database': 'connected'
        }
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({'error': 'Rate limit exceeded'}), 429

# JWT error handlers
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid token'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'error': 'Authorization token is required'}), 401

if __name__ == '__main__':
    # Create tables
    with app.app_context():
        db.create_all()
        logger.info("Database tables created")
    
    # Start the application
    port = int(os.getenv('PORT', 3010))
    host = os.getenv('HOST', '0.0.0.0')
    
    logger.info(f"🚀 Torro License Manager API Server starting on {host}:{port}")
    logger.info(f"📊 Frontend Dashboard: http://localhost:3009")
    logger.info(f"🔗 API Endpoint: http://{host}:{port}/api")
    
    app.run(host=host, port=port, debug=os.getenv('FLASK_ENV') == 'development')
