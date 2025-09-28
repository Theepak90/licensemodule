import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Base configuration class"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET', 'your-jwt-secret-here')
    JWT_ACCESS_TOKEN_EXPIRES = False  # No expiration for now
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False
    
    # Database configuration
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///license_manager.db')
    
    # Server configuration
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 3010))
    
    # CORS configuration
    CORS_ORIGINS = [
        'http://localhost:3000',
        'http://localhost:3002', 
        'http://localhost:3003',
        'http://localhost:3004',
        'http://localhost:3009'
    ]
    
    # Rate limiting
    RATELIMIT_STORAGE_URL = os.getenv('REDIS_URL', 'memory://')
    
    # Security configuration
    BCRYPT_LOG_ROUNDS = 12
    
    # Logging configuration
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    
    # Daemon configuration
    DAEMON_LOG_FILE = 'logs/daemon.log'
    DAEMON_METRICS_FILE = 'logs/metrics.json'
    DAEMON_PID_FILE = 'daemon.pid'
    
    # License configuration
    LICENSE_KEY_PREFIX = 'TORRO'
    CLIENT_ID_SUFFIX_LENGTH = 9
    DEFAULT_EXPIRY_DAYS = 30
    
    # Military-grade security settings
    MILITARY_GRADE_ENABLED = True
    HARDWARE_BINDING_ENABLED = True
    ANTI_TAMPERING_ENABLED = True
    ANTI_DEBUGGING_ENABLED = True
    SELF_DESTRUCTION_ENABLED = True
    INTEGRITY_CHECKING_ENABLED = True
    RISK_SCORING_ENABLED = True
    SECURE_DELETION_ENABLED = True

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    FLASK_ENV = 'development'

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    FLASK_ENV = 'production'
    
    # Use more secure settings for production
    BCRYPT_LOG_ROUNDS = 15
    
    # Use PostgreSQL in production
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://user:password@localhost/license_manager')

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
