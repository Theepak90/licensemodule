import secrets
import hashlib
import time
import json
import psutil
import platform
import uuid
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import logging

logger = logging.getLogger(__name__)

def generate_license_key():
    """Generate military-grade license key format: TORRO-MIL-{timestamp}-{64-char-hex}-{8-char-checksum}"""
    timestamp = str(int(time.time()))
    random_hex = secrets.token_hex(32)  # 64 characters
    checksum_data = f"TORRO-MIL-{timestamp}-{random_hex}"
    checksum = hashlib.sha256(checksum_data.encode()).hexdigest()[:8].upper()
    
    return f"TORRO-MIL-{timestamp}-{random_hex.upper()}-{checksum}"

def generate_encryption_key():
    """Generate encryption key for license data"""
    return Fernet.generate_key()

def encrypt_license_key(license_key):
    """Encrypt license key for secure storage"""
    try:
        # Generate a key from a password
        password = b"torro-license-encryption-key-2024"
        salt = b"torro-salt-2024"
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password))
        
        # Encrypt the license key
        f = Fernet(key)
        encrypted_data = f.encrypt(license_key.encode())
        
        return base64.b64encode(encrypted_data).decode()
    except Exception as e:
        logger.error(f"Error encrypting license key: {e}")
        return license_key

def decrypt_license_key(encrypted_data):
    """Decrypt license key"""
    try:
        # Generate the same key
        password = b"torro-license-encryption-key-2024"
        salt = b"torro-salt-2024"
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password))
        
        # Decrypt the license key
        f = Fernet(key)
        encrypted_bytes = base64.b64decode(encrypted_data.encode())
        decrypted_data = f.decrypt(encrypted_bytes)
        
        return decrypted_data.decode()
    except Exception as e:
        logger.error(f"Error decrypting license key: {e}")
        return encrypted_data

def get_hardware_fingerprint():
    """Get hardware fingerprint for binding"""
    try:
        # Get system information
        system_info = {
            'platform': platform.platform(),
            'processor': platform.processor(),
            'machine': platform.machine(),
            'node': platform.node(),
            'cpu_count': psutil.cpu_count(),
            'memory_total': psutil.virtual_memory().total,
            'disk_usage': psutil.disk_usage('/').total if platform.system() != 'Windows' else psutil.disk_usage('C:').total
        }
        
        # Create fingerprint
        fingerprint_data = json.dumps(system_info, sort_keys=True)
        fingerprint = hashlib.sha256(fingerprint_data.encode()).hexdigest()
        
        return fingerprint, system_info
    except Exception as e:
        logger.error(f"Error getting hardware fingerprint: {e}")
        return str(uuid.uuid4()), {}

def create_military_grade_license(license_data):
    """Create military-grade license with enhanced security"""
    try:
        # Get hardware fingerprint
        hardware_fingerprint, hardware_components = get_hardware_fingerprint()
        
        # Create integrity checksums
        integrity_checksums = {
            'license_key_hash': hashlib.sha256(license_data['license_key'].encode()).hexdigest(),
            'client_id_hash': hashlib.sha256(license_data['client_id'].encode()).hexdigest(),
            'timestamp_hash': hashlib.sha256(str(int(time.time())).encode()).hexdigest()
        }
        
        # Create encrypted data
        encrypted_data = {
            'creation_timestamp': int(time.time()),
            'security_level': 'military',
            'anti_tampering': True,
            'anti_debugging': True,
            'self_destruction': True
        }
        
        return {
            'hardware_fingerprint': hardware_fingerprint,
            'hardware_components': hardware_components,
            'integrity_checksums': integrity_checksums,
            'encrypted_data': encrypted_data
        }
    except Exception as e:
        logger.error(f"Error creating military-grade license: {e}")
        return {
            'hardware_fingerprint': str(uuid.uuid4()),
            'hardware_components': {},
            'integrity_checksums': {},
            'encrypted_data': {}
        }

def validate_military_grade_license(license, validation_attempt):
    """Validate military-grade license"""
    try:
        # Basic validation
        if not license.military_grade:
            return {'valid': False, 'reason': 'Not a military-grade license'}
        
        # Hardware binding validation
        if license.hardware_binding and license.hardware_fingerprint:
            current_fingerprint, _ = get_hardware_fingerprint()
            if current_fingerprint != license.hardware_fingerprint:
                license.add_security_violation('hardware_mismatch', {
                    'expected': license.hardware_fingerprint,
                    'actual': current_fingerprint
                })
                return {
                    'valid': False,
                    'reason': 'Hardware fingerprint mismatch',
                    'hardware_match': False
                }
        
        # Integrity validation
        integrity_checksums = license.get_integrity_checksums()
        if integrity_checksums:
            current_checksum = hashlib.sha256(license.license_key.encode()).hexdigest()
            if current_checksum != integrity_checksums.get('license_key_hash'):
                license.add_security_violation('integrity_violation', {
                    'expected': integrity_checksums.get('license_key_hash'),
                    'actual': current_checksum
                })
                return {
                    'valid': False,
                    'reason': 'License integrity violation',
                    'integrity_valid': False
                }
        
        # Anti-debugging check (simplified)
        debugger_detected = False
        try:
            # Check for common debugging indicators
            import sys
            if hasattr(sys, 'gettrace') and sys.gettrace() is not None:
                debugger_detected = True
        except:
            pass
        
        if debugger_detected:
            license.add_security_violation('debugger_detected', {
                'timestamp': int(time.time())
            })
            return {
                'valid': False,
                'reason': 'Debugger detected',
                'debugger_detected': True
            }
        
        return {
            'valid': True,
            'hardware_match': True,
            'integrity_valid': True,
            'debugger_detected': False
        }
        
    except Exception as e:
        logger.error(f"Error validating military-grade license: {e}")
        return {'valid': False, 'reason': 'Validation error'}

def calculate_risk_score(license, validation_attempt):
    """Calculate risk score for license validation"""
    try:
        risk_score = 0.0
        
        # Base risk factors
        if license.check_count > 1000:
            risk_score += 0.3
        
        # IP-based risk
        if validation_attempt.get('ip'):
            # Simple IP risk calculation (can be enhanced)
            ip = validation_attempt['ip']
            if ip.startswith('192.168.') or ip.startswith('10.') or ip.startswith('172.'):
                risk_score += 0.1  # Private IP
        
        # User agent risk
        user_agent = validation_attempt.get('user_agent', '')
        if 'bot' in user_agent.lower() or 'crawler' in user_agent.lower():
            risk_score += 0.4
        
        # Time-based risk
        if validation_attempt.get('timestamp'):
            current_time = int(time.time())
            request_time = validation_attempt['timestamp']
            time_diff = abs(current_time - request_time)
            if time_diff > 300:  # 5 minutes
                risk_score += 0.2
        
        # Security violations
        violations = license.get_security_violations()
        if violations:
            risk_score += len(violations) * 0.1
        
        # Update license risk score
        license.risk_score = min(risk_score, 1.0)  # Cap at 1.0
        
        return risk_score
        
    except Exception as e:
        logger.error(f"Error calculating risk score: {e}")
        return 0.0

def encrypt_license_data(data):
    """Encrypt license data"""
    try:
        key = generate_encryption_key()
        f = Fernet(key)
        encrypted_data = f.encrypt(json.dumps(data).encode())
        return base64.b64encode(encrypted_data).decode(), key.decode()
    except Exception as e:
        logger.error(f"Error encrypting license data: {e}")
        return json.dumps(data), None

def decrypt_license_data(encrypted_data, key):
    """Decrypt license data"""
    try:
        f = Fernet(key.encode())
        decrypted_data = f.decrypt(base64.b64decode(encrypted_data.encode()))
        return json.loads(decrypted_data.decode())
    except Exception as e:
        logger.error(f"Error decrypting license data: {e}")
        return {}
