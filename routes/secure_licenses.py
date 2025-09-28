from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from middleware.auth import auth_required, admin_required
from models import License, db
from services.license_service import validate_military_grade_license, calculate_risk_score
from datetime import datetime
import logging

secure_licenses_bp = Blueprint('secure_licenses', __name__)
logger = logging.getLogger(__name__)

@secure_licenses_bp.route('/validate', methods=['POST'])
def validate_secure_license():
    """Validate secure license with enhanced security checks"""
    try:
        data = request.get_json()
        license_key = data.get('licenseKey')
        client_id = data.get('clientId')
        hardware_fingerprint = data.get('hardwareFingerprint')
        timestamp = data.get('timestamp')
        user_agent = data.get('userAgent')
        
        if not license_key or not client_id:
            return jsonify({'error': 'License key and client ID are required'}), 400
        
        # Find license
        license = License.query.filter_by(license_key=license_key, client_id=client_id).first()
        
        if not license:
            return jsonify({
                'error': 'Invalid license',
                'valid': False
            }), 404
        
        # Update access tracking
        license.last_checked = datetime.utcnow()
        license.check_count += 1
        license.last_access_ip = request.remote_addr
        license.last_access_user_agent = request.headers.get('User-Agent', user_agent)
        
        # Check basic validity
        if not license.is_valid():
            return jsonify({
                'error': 'License has expired or is inactive',
                'valid': False,
                'expiryDate': license.expiry_date.isoformat(),
                'status': license.status
            }), 403
        
        # Enhanced security validation
        validation_attempt = {
            'license_key': license_key,
            'client_id': client_id,
            'hardware_fingerprint': hardware_fingerprint,
            'ip': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', user_agent),
            'timestamp': timestamp or int(datetime.utcnow().timestamp()),
            'request_count': license.check_count
        }
        
        # Military-grade validation
        military_validation = validate_military_grade_license(license, validation_attempt)
        risk_score = calculate_risk_score(license, validation_attempt)
        
        if not military_validation.get('valid', True):
            db.session.commit()  # Save the violation
            return jsonify({
                'error': 'Enhanced security validation failed',
                'valid': False,
                'reason': military_validation.get('reason', 'Security violation detected'),
                'riskScore': military_validation.get('risk_score', risk_score)
            }), 403
        
        # Save updated license
        db.session.commit()
        
        # Prepare enhanced response
        response = {
            'valid': True,
            'license': license.get_client_info(show_encrypted_key=True),
            'riskScore': risk_score,
            'securityLevel': 'military',
            'militaryGrade': True,
            'hardwareMatch': military_validation.get('hardware_match', True),
            'integrityValid': military_validation.get('integrity_valid', True),
            'debuggerDetected': military_validation.get('debugger_detected', False),
            'securityFeatures': {
                'hardwareBinding': license.hardware_binding,
                'antiTampering': True,
                'antiDebugging': True,
                'selfDestruction': True,
                'integrityChecking': True,
                'riskScoring': True,
                'secureDeletion': True,
                'daemonSystem': True
            },
            'validationDetails': {
                'timestamp': datetime.utcnow().isoformat(),
                'ip': request.remote_addr,
                'userAgent': request.headers.get('User-Agent', user_agent),
                'checkCount': license.check_count
            }
        }
        
        return jsonify(response)
        
    except Exception as error:
        logger.error(f'Validate secure license error: {error}')
        return jsonify({'error': 'Secure license validation failed'}), 500

@secure_licenses_bp.route('/hardware-binding/<license_id>', methods=['POST'])
@admin_required
def update_hardware_binding(license_id):
    """Update hardware binding for a license (admin only)"""
    try:
        data = request.get_json()
        hardware_fingerprint = data.get('hardwareFingerprint')
        hardware_components = data.get('hardwareComponents', {})
        
        license = License.query.get(license_id)
        if not license:
            return jsonify({'error': 'License not found'}), 404
        
        # Update hardware binding
        license.hardware_fingerprint = hardware_fingerprint
        license.set_hardware_components(hardware_components)
        license.hardware_binding = True
        license.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Hardware binding updated successfully',
            'license_id': license_id,
            'hardware_fingerprint': hardware_fingerprint
        })
        
    except Exception as error:
        logger.error(f'Update hardware binding error: {error}')
        db.session.rollback()
        return jsonify({'error': 'Failed to update hardware binding'}), 500

@secure_licenses_bp.route('/security-level/<license_id>', methods=['PUT'])
@admin_required
def update_security_level(license_id):
    """Update security level for a license (admin only)"""
    try:
        data = request.get_json()
        security_level = data.get('securityLevel')
        military_grade = data.get('militaryGrade', True)
        hardware_binding = data.get('hardwareBinding', True)
        
        if security_level not in ['basic', 'military']:
            return jsonify({'error': 'Invalid security level'}), 400
        
        license = License.query.get(license_id)
        if not license:
            return jsonify({'error': 'License not found'}), 404
        
        # Update security settings
        license.security_level = security_level
        license.military_grade = military_grade
        license.hardware_binding = hardware_binding
        license.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Security level updated successfully',
            'license_id': license_id,
            'security_level': security_level,
            'military_grade': military_grade,
            'hardware_binding': hardware_binding
        })
        
    except Exception as error:
        logger.error(f'Update security level error: {error}')
        db.session.rollback()
        return jsonify({'error': 'Failed to update security level'}), 500

@secure_licenses_bp.route('/integrity-check/<license_id>', methods=['POST'])
@admin_required
def perform_integrity_check(license_id):
    """Perform integrity check on a license (admin only)"""
    try:
        license = License.query.get(license_id)
        if not license:
            return jsonify({'error': 'License not found'}), 404
        
        # Perform integrity validation
        validation_attempt = {
            'license_key': license.license_key,
            'client_id': license.client_id,
            'timestamp': int(datetime.utcnow().timestamp())
        }
        
        military_validation = validate_military_grade_license(license, validation_attempt)
        
        integrity_result = {
            'license_id': license_id,
            'integrity_valid': military_validation.get('integrity_valid', True),
            'hardware_match': military_validation.get('hardware_match', True),
            'debugger_detected': military_validation.get('debugger_detected', False),
            'risk_score': license.risk_score,
            'violations_count': len(license.get_security_violations()),
            'check_timestamp': datetime.utcnow().isoformat()
        }
        
        return jsonify(integrity_result)
        
    except Exception as error:
        logger.error(f'Integrity check error: {error}')
        return jsonify({'error': 'Failed to perform integrity check'}), 500

@secure_licenses_bp.route('/security-report/<license_id>', methods=['GET'])
@admin_required
def get_security_report(license_id):
    """Get comprehensive security report for a license (admin only)"""
    try:
        license = License.query.get(license_id)
        if not license:
            return jsonify({'error': 'License not found'}), 404
        
        # Gather security information
        security_violations = license.get_security_violations()
        hardware_components = license.get_hardware_components()
        integrity_checksums = license.get_integrity_checksums()
        encrypted_data = license.get_encrypted_data()
        
        security_report = {
            'license_id': license_id,
            'client_id': license.client_id,
            'client_name': license.client_name,
            'security_level': license.security_level,
            'military_grade': license.military_grade,
            'hardware_binding': license.hardware_binding,
            'hardware_fingerprint': license.hardware_fingerprint,
            'hardware_components': hardware_components,
            'integrity_checksums': integrity_checksums,
            'encrypted_data': encrypted_data,
            'risk_score': license.risk_score,
            'security_violations': security_violations,
            'access_statistics': {
                'check_count': license.check_count,
                'last_checked': license.last_checked.isoformat() if license.last_checked else None,
                'last_access_ip': license.last_access_ip,
                'last_access_user_agent': license.last_access_user_agent
            },
            'report_timestamp': datetime.utcnow().isoformat()
        }
        
        return jsonify(security_report)
        
    except Exception as error:
        logger.error(f'Get security report error: {error}')
        return jsonify({'error': 'Failed to generate security report'}), 500
