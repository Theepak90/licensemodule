from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import uuid
import json
import re

# Import db from app.py (will be imported after app initialization)
try:
    from app import db
except ImportError:
    from flask_sqlalchemy import SQLAlchemy
    db = SQLAlchemy()

class License(db.Model):
    __tablename__ = 'licenses'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Military-grade license key format
    license_key = db.Column(db.String(255), unique=True, nullable=False, index=True)
    
    # Encrypted license key storage
    encrypted_license_key = db.Column(db.Text)  # JSON string for encrypted data
    
    client_id = db.Column(db.String(255), unique=True, nullable=False, index=True)
    client_name = db.Column(db.String(255), nullable=False)
    client_email = db.Column(db.String(255), nullable=False)
    product_name = db.Column(db.String(255), default='Torro Platform')
    version = db.Column(db.String(50), default='1.0.0')
    
    license_type = db.Column(db.String(50), nullable=False, default='trial')
    status = db.Column(db.String(50), nullable=False, default='active')
    
    issued_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expiry_date = db.Column(db.DateTime, nullable=False)
    
    max_users = db.Column(db.Integer, default=1)
    max_connections = db.Column(db.Integer, default=10)
    
    # Features stored as JSON
    features = db.Column(db.Text, default='{}')  # JSON string
    
    last_checked = db.Column(db.DateTime, default=datetime.utcnow)
    check_count = db.Column(db.Integer, default=0)
    last_access_ip = db.Column(db.String(45))
    last_access_user_agent = db.Column(db.Text)
    notes = db.Column(db.Text)
    
    # Foreign key to user
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Military-grade security fields
    military_grade = db.Column(db.Boolean, default=True)
    hardware_binding = db.Column(db.Boolean, default=True)
    hardware_fingerprint = db.Column(db.Text)
    hardware_components = db.Column(db.Text)  # JSON string
    integrity_checksums = db.Column(db.Text)  # JSON string
    encrypted_data = db.Column(db.Text)  # JSON string
    security_level = db.Column(db.String(50), default='military')
    
    # IP and country restrictions
    allowed_ips = db.Column(db.Text)  # JSON array string
    allowed_countries = db.Column(db.Text)  # JSON array string
    
    risk_score = db.Column(db.Float, default=0.0)
    security_violations = db.Column(db.Text)  # JSON array string
    
    # Indexes
    __table_args__ = (
        db.Index('idx_expiry_status', 'expiry_date', 'status'),
        db.Index('idx_client_status', 'client_id', 'status'),
    )
    
    def __init__(self, **kwargs):
        super(License, self).__init__(**kwargs)
        if not self.license_key:
            self.license_key = self._generate_license_key()
        if not self.client_id:
            self.client_id = self._generate_client_id()
    
    def _generate_license_key(self):
        """Generate military-grade license key format: TORRO-MIL-{timestamp}-{64-char-hex}-{8-char-checksum}"""
        import time
        import secrets
        import hashlib
        
        timestamp = str(int(time.time()))
        random_hex = secrets.token_hex(32)  # 64 characters
        checksum_data = f"TORRO-MIL-{timestamp}-{random_hex}"
        checksum = hashlib.sha256(checksum_data.encode()).hexdigest()[:8].upper()
        
        return f"TORRO-MIL-{timestamp}-{random_hex.upper()}-{checksum}"
    
    def _generate_client_id(self):
        """Generate unique client ID"""
        import time
        import secrets
        
        timestamp = str(int(time.time()))
        random_part1 = secrets.token_hex(4).upper()
        random_part2 = secrets.token_urlsafe(9).upper()
        process_id = str(hash(str(time.time())))[:8].upper()
        
        return f"TORRO-{timestamp}-{random_part1}-{random_part2}-{process_id}"
    
    def _validate_license_key_format(self, license_key):
        """Validate military-grade license key format"""
        pattern = r'^TORRO-MIL-[a-z0-9]+-[A-F0-9]{64}-[A-F0-9]{8}$'
        return bool(re.match(pattern, license_key))
    
    @property
    def days_until_expiry(self):
        """Calculate days until expiry"""
        if not self.expiry_date:
            return 0
        delta = self.expiry_date - datetime.utcnow()
        return max(0, delta.days)
    
    @property
    def is_expired(self):
        """Check if license is expired"""
        return datetime.utcnow() > self.expiry_date
    
    def is_valid(self):
        """Check if license is valid"""
        return self.status == 'active' and not self.is_expired
    
    def get_features(self):
        """Get features as dictionary"""
        try:
            return json.loads(self.features) if self.features else {}
        except (json.JSONDecodeError, TypeError):
            return {
                'database_access': True,
                'api_access': True,
                'analytics': False,
                'support': False
            }
    
    def set_features(self, features_dict):
        """Set features from dictionary"""
        self.features = json.dumps(features_dict)
    
    def get_hardware_components(self):
        """Get hardware components as dictionary"""
        try:
            return json.loads(self.hardware_components) if self.hardware_components else {}
        except (json.JSONDecodeError, TypeError):
            return {}
    
    def set_hardware_components(self, components_dict):
        """Set hardware components from dictionary"""
        self.hardware_components = json.dumps(components_dict)
    
    def get_integrity_checksums(self):
        """Get integrity checksums as dictionary"""
        try:
            return json.loads(self.integrity_checksums) if self.integrity_checksums else {}
        except (json.JSONDecodeError, TypeError):
            return {}
    
    def set_integrity_checksums(self, checksums_dict):
        """Set integrity checksums from dictionary"""
        self.integrity_checksums = json.dumps(checksums_dict)
    
    def get_encrypted_data(self):
        """Get encrypted data as dictionary"""
        try:
            return json.loads(self.encrypted_data) if self.encrypted_data else {}
        except (json.JSONDecodeError, TypeError):
            return {}
    
    def set_encrypted_data(self, data_dict):
        """Set encrypted data from dictionary"""
        self.encrypted_data = json.dumps(data_dict)
    
    def get_allowed_ips(self):
        """Get allowed IPs as list"""
        try:
            return json.loads(self.allowed_ips) if self.allowed_ips else []
        except (json.JSONDecodeError, TypeError):
            return []
    
    def set_allowed_ips(self, ips_list):
        """Set allowed IPs from list"""
        self.allowed_ips = json.dumps(ips_list)
    
    def get_allowed_countries(self):
        """Get allowed countries as list"""
        try:
            return json.loads(self.allowed_countries) if self.allowed_countries else []
        except (json.JSONDecodeError, TypeError):
            return []
    
    def set_allowed_countries(self, countries_list):
        """Set allowed countries from list"""
        self.allowed_countries = json.dumps(countries_list)
    
    def get_security_violations(self):
        """Get security violations as list"""
        try:
            return json.loads(self.security_violations) if self.security_violations else []
        except (json.JSONDecodeError, TypeError):
            return []
    
    def add_security_violation(self, violation_type, details=None):
        """Add a security violation"""
        violations = self.get_security_violations()
        violations.append({
            'type': violation_type,
            'timestamp': datetime.utcnow().isoformat(),
            'details': details or {}
        })
        self.security_violations = json.dumps(violations)
    
    def get_client_info(self, show_encrypted_key=False):
        """Get license info for client"""
        return {
            'id': self.id,
            'licenseKey': self.license_key if not show_encrypted_key else (self.encrypted_license_key or self.license_key),
            'clientId': self.client_id,
            'clientName': self.client_name,
            'clientEmail': self.client_email,
            'productName': self.product_name,
            'version': self.version,
            'licenseType': self.license_type,
            'status': self.status,
            'issuedDate': self.issued_date.isoformat(),
            'expiryDate': self.expiry_date.isoformat(),
            'maxUsers': self.max_users,
            'maxConnections': self.max_connections,
            'features': self.get_features(),
            'daysUntilExpiry': self.days_until_expiry,
            'isValid': self.is_valid(),
            'securityLevel': 'military',
            'militaryGrade': True,
            'hardwareBinding': True,
            'lastChecked': self.last_checked.isoformat() if self.last_checked else None,
            'checkCount': self.check_count,
            'lastAccessIP': self.last_access_ip,
            'lastAccessUserAgent': self.last_access_user_agent,
            'notes': self.notes,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }
    
    def to_dict(self):
        """Convert license to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'license_key': self.license_key,
            'client_id': self.client_id,
            'client_name': self.client_name,
            'client_email': self.client_email,
            'product_name': self.product_name,
            'version': self.version,
            'license_type': self.license_type,
            'status': self.status,
            'issued_date': self.issued_date.isoformat(),
            'expiry_date': self.expiry_date.isoformat(),
            'max_users': self.max_users,
            'max_connections': self.max_connections,
            'features': self.get_features(),
            'days_until_expiry': self.days_until_expiry,
            'is_valid': self.is_valid(),
            'military_grade': self.military_grade,
            'hardware_binding': self.hardware_binding,
            'security_level': self.security_level,
            'risk_score': self.risk_score,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<License {self.client_id}:{self.license_type}>'
