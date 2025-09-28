from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
import logging
from models import License, User, db
from middleware.auth import auth_required, admin_required
from services.license_service import (
    generate_license_key,
    encrypt_license_key,
    decrypt_license_key,
    create_military_grade_license,
    validate_military_grade_license,
    get_hardware_fingerprint,
    calculate_risk_score
)
from datetime import datetime, timedelta

import uuid

licenses_bp = Blueprint('licenses', __name__)
logger = logging.getLogger(__name__)

@licenses_bp.route('/', methods=['GET'])
@admin_required
def get_all_licenses():
    """Get all licenses (admin only)"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        status = request.args.get('status')
        license_type = request.args.get('licenseType')
        
        query = License.query
        
        if status:
            query = query.filter_by(status=status)
        if license_type:
            query = query.filter_by(license_type=license_type)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        licenses = query.order_by(License.created_at.desc()).paginate(
            page=page, per_page=limit, error_out=False
        ).items
        
        return jsonify({
            'licenses': [license.get_client_info(show_encrypted_key=True) for license in licenses],
            'totalPages': (total + limit - 1) // limit,
            'currentPage': page,
            'total': total
        })
        
    except Exception as error:
        logger.error(f'Get licenses error: {error}')
        return jsonify({'error': 'Failed to fetch licenses'}), 500

@licenses_bp.route('/<license_id>', methods=['GET'])
@admin_required
def get_license(license_id):
    """Get license by ID or ClientID (admin only)"""
    try:
        # Try to find by UUID first
        license = License.query.get(license_id)
        
        # If not found by UUID, search by client_id
        if not license:
            license = License.query.filter_by(client_id=license_id).first()
        
        if not license:
            return jsonify({'error': 'License not found'}), 404
        
        return jsonify(license.get_client_info(show_encrypted_key=True))
        
    except Exception as error:
        logger.error(f'Get license error: {error}')
        return jsonify({'error': 'Failed to fetch license'}), 500

@licenses_bp.route('/', methods=['POST'])
@admin_required
def create_license():
    """Create new license (admin only)"""
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()['user_id']
        
        # Extract license data
        client_name = data.get('clientName')
        client_email = data.get('clientEmail')
        product_name = data.get('productName', 'Torro Platform')
        version = data.get('version', '1.0.0')
        license_type = data.get('licenseType', 'trial')
        expiry_days = int(data.get('expiryDays', 30))
        max_users = int(data.get('maxUsers', 1))
        max_connections = int(data.get('maxConnections', 10))
        features = data.get('features', {})
        notes = data.get('notes')
        
        # Force all licenses to use military-grade security
        military_grade = data.get('militaryGrade', True)
        hardware_binding = data.get('hardwareBinding', True)
        allowed_ips = data.get('allowedIPs', [])
        allowed_countries = data.get('allowedCountries', [])
        
        if not client_name or not client_email:
            return jsonify({'error': 'Client name and email are required'}), 400
        
        # Generate unique license key and client ID
        license_key = generate_license_key()
        
        # Encrypt license key for secure storage
        encrypted_key_data = encrypt_license_key(license_key)
        
        # Calculate expiry date
        expiry_date = datetime.utcnow() + timedelta(days=expiry_days)
        
        # Create license data
        license_data = {
            'license_key': license_key,
            'encrypted_license_key': encrypted_key_data,
            'client_name': client_name,
            'client_email': client_email,
            'product_name': product_name,
            'version': version,
            'license_type': license_type,
            'expiry_date': expiry_date,
            'max_users': max_users,
            'max_connections': max_connections,
            'notes': notes,
            'created_by': current_user_id,
            'military_grade': military_grade,
            'hardware_binding': hardware_binding
        }
        
        # Create license
        license = License(**license_data)
        license.set_features(features)
        license.set_allowed_ips(allowed_ips)
        license.set_allowed_countries(allowed_countries)
        
        # Force all licenses to use military-grade security
        logger.info('🔒 FORCING MILITARY-GRADE SECURITY FOR ALL LICENSES')
        military_license = create_military_grade_license(license_data)
        license.hardware_fingerprint = military_license.get('hardware_fingerprint')
        license.set_hardware_components(military_license.get('hardware_components', {}))
        license.set_integrity_checksums(military_license.get('integrity_checksums', {}))
        license.set_encrypted_data(military_license.get('encrypted_data', {}))
        license.security_level = 'military'
        license.military_grade = True
        license.hardware_binding = True
        
        db.session.add(license)
        db.session.commit()
        
        return jsonify({
            'message': 'License created successfully with MILITARY-GRADE SECURITY',
            'license': license.get_client_info(show_encrypted_key=True),
            'militaryGrade': True,
            'securityLevel': 'military',
            'features': {
                'hardwareBinding': True,
                'antiTampering': True,
                'antiDebugging': True,
                'selfDestruction': True,
                'integrityChecking': True,
                'riskScoring': True,
                'secureDeletion': True
            }
        }), 201
        
    except Exception as error:
        logger.error(f'Create license error: {error}')
        db.session.rollback()
        return jsonify({'error': 'Failed to create license', 'details': str(error)}), 500

@licenses_bp.route('/<license_id>', methods=['PUT'])
@admin_required
def update_license(license_id):
    """Update license (admin only)"""
    try:
        data = request.get_json()
        logger.info(f'Update request data: {data}')
        
        # Find license
        license = License.query.get(license_id)
        if not license:
            return jsonify({'error': 'License not found'}), 404
        
        # Handle expiry date specifically first
        if 'expiryDate' in data:
            expiry_value = data['expiryDate']
            logger.info(f'Processing expiryDate: {expiry_value}')
            
            if isinstance(expiry_value, str):
                try:
                    # Parse the datetime string
                    if expiry_value.endswith('Z'):
                        clean_value = expiry_value.replace('Z', '')
                        if '.' in clean_value:
                            parsed_date = datetime.strptime(clean_value, '%Y-%m-%dT%H:%M:%S.%f')
                        else:
                            parsed_date = datetime.strptime(clean_value, '%Y-%m-%dT%H:%M:%S')
                    else:
                        parsed_date = datetime.fromisoformat(expiry_value)
                    
                    license.expiry_date = parsed_date
                    license.updated_at = datetime.utcnow()
                    
                    logger.info(f'Successfully set expiry_date to: {parsed_date}')
                    
                    db.session.commit()
                    
                    return jsonify({
                        'message': 'License expiry date updated successfully',
                        'license': license.get_client_info(show_encrypted_key=True)
                    })
                    
                except Exception as e:
                    logger.error(f'Error parsing expiry date: {e}')
                    db.session.rollback()
                    return jsonify({'error': f'Invalid expiry date format: {str(e)}'})
        
        # Remove fields that shouldn't be updated for other updates
        data.pop('license_key', None)
        data.pop('client_id', None)
        data.pop('expiryDate', None)  # Already handled above
        
        # Field name mapping from frontend to database
        field_mapping = {
            'expiryDate': 'expiry_date',
            'clientName': 'client_name',
            'clientEmail': 'client_email',
            'productName': 'product_name',
            'licenseType': 'license_type',
            'maxUsers': 'max_users',
            'maxConnections': 'max_connections',
            'lastChecked': 'last_checked',
            'checkCount': 'check_count',
            'lastAccessIP': 'last_access_ip',
            'lastAccessUserAgent': 'last_access_user_agent',
            'createdBy': 'created_by',
            'createdAt': 'created_at',
            'updatedAt': 'updated_at',
            'militaryGrade': 'military_grade',
            'hardwareBinding': 'hardware_binding',
            'hardwareFingerprint': 'hardware_fingerprint',
            'hardwareComponents': 'hardware_components',
            'integrityChecksums': 'integrity_checksums',
            'encryptedData': 'encrypted_data',
            'securityLevel': 'security_level',
            'allowedIPs': 'allowed_ips',
            'allowedCountries': 'allowed_countries',
            'riskScore': 'risk_score',
            'securityViolations': 'security_violations'
        }
        
        # Update fields
        for key, value in data.items():
            # Map frontend field names to database field names
            db_field = field_mapping.get(key, key)
            
            if hasattr(license, db_field):
                # Handle special fields that need JSON serialization
                if key == 'features' and isinstance(value, dict):
                    setattr(license, db_field, json.dumps(value))
                elif key in ['allowedIPs', 'allowedCountries', 'securityViolations'] and isinstance(value, list):
                    setattr(license, db_field, json.dumps(value))
                # Handle datetime fields - simplified approach
                elif key == 'expiryDate' and isinstance(value, str):
                    try:
                        # Simple parsing for common ISO formats
                        if 'Z' in value:
                            # Remove Z and any timezone info, parse as UTC
                            clean_value = value.replace('Z', '').split('+')[0].split('-')[0] if '+' in value or '-' in value.split('T')[1] else value.replace('Z', '')
                            if '.' in clean_value:
                                parsed_date = datetime.strptime(clean_value, '%Y-%m-%dT%H:%M:%S.%f')
                            else:
                                parsed_date = datetime.strptime(clean_value, '%Y-%m-%dT%H:%M:%S')
                        else:
                            # Try direct parsing
                            if '.' in value and 'T' in value:
                                parsed_date = datetime.strptime(value, '%Y-%m-%dT%H:%M:%S.%f')
                            elif 'T' in value:
                                parsed_date = datetime.strptime(value, '%Y-%m-%dT%H:%M:%S')
                            else:
                                parsed_date = datetime.fromisoformat(value)
                        
                        setattr(license, db_field, parsed_date)
                        logger.info(f'Successfully parsed {key}: {value} -> {parsed_date}')
                    except Exception as e:
                        logger.error(f'Error parsing {key} with value {value}: {e}')
                        # Don't set the field if parsing fails
                        pass
                else:
                    setattr(license, db_field, value)
            else:
                logger.warning(f'Field {db_field} does not exist on License model')
        
        license.updated_at = datetime.utcnow()
        
        # Add detailed logging before commit
        logger.info(f'About to commit license update for {license.id}')
        logger.info(f'Updated fields: {list(data.keys())}')
        
        db.session.commit()
        
        return jsonify({
            'message': 'License updated successfully',
            'license': license.get_client_info(show_encrypted_key=True)
        })
        
    except Exception as error:
        import traceback
        logger.error(f'Update license error: {error}')
        logger.error(f'Full traceback: {traceback.format_exc()}')
        db.session.rollback()
        return jsonify({'error': f'Failed to update license: {str(error)}'})

@licenses_bp.route('/<license_id>', methods=['DELETE'])
@admin_required
def delete_license(license_id):
    """Delete license (admin only)"""
    try:
        # Try to find by UUID first
        license = License.query.get(license_id)
        
        # If not found by UUID, search by client_id
        if not license:
            license = License.query.filter_by(client_id=license_id).first()
        
        if not license:
            return jsonify({'error': 'License not found'}), 404
        
        db.session.delete(license)
        db.session.commit()
        
        return jsonify({'message': 'License deleted successfully'})
        
    except Exception as error:
        logger.error(f'Delete license error: {error}')
        db.session.rollback()
        return jsonify({'error': 'Failed to delete license'}), 500

@licenses_bp.route('/validate', methods=['POST'])
def validate_license():
    """Validate license (public endpoint for client applications)"""
    try:
        data = request.get_json()
        license_key = data.get('licenseKey')
        client_id = data.get('clientId')
        hardware_fingerprint = data.get('hardwareFingerprint')
        timestamp = data.get('timestamp')
        user_agent = data.get('userAgent')
        
        if not license_key or not client_id:
            return jsonify({'error': 'License key and client ID are required'}), 400
        
        # Find license by license key and client ID
        license = License.query.filter_by(license_key=license_key, client_id=client_id).first()
        
        # If not found, search through encrypted keys
        if not license:
            licenses = License.query.filter_by(client_id=client_id).all()
            for lic in licenses:
                if lic.encrypted_license_key:
                    try:
                        decrypted_key = decrypt_license_key(lic.encrypted_license_key)
                        if decrypted_key == license_key:
                            license = lic
                            break
                    except Exception as error:
                        logger.error(f'Error decrypting license key: {error}')
        
        if not license:
            return jsonify({
                'error': 'Invalid license',
                'valid': False
            }), 404
        
        # Update last checked time and increment check count
        license.last_checked = datetime.utcnow()
        license.check_count += 1
        license.last_access_ip = request.remote_addr
        license.last_access_user_agent = request.headers.get('User-Agent', user_agent)
        db.session.commit()
        
        # Check if license is valid
        if not license.is_valid():
            return jsonify({
                'error': 'License has expired or is inactive',
                'valid': False,
                'expiryDate': license.expiry_date.isoformat(),
                'status': license.status
            }), 403
        
        # Force military-grade validation for all licenses
        logger.info('🔒 FORCING MILITARY-GRADE VALIDATION FOR ALL LICENSES')
        validation_attempt = {
            'license_key': license_key,
            'client_id': client_id,
            'hardware_fingerprint': hardware_fingerprint,
            'ip': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', user_agent),
            'timestamp': timestamp or int(datetime.utcnow().timestamp()),
            'request_count': license.check_count
        }
        
        military_validation = validate_military_grade_license(license, validation_attempt)
        risk_score = calculate_risk_score(license, validation_attempt)
        
        if not military_validation.get('valid', True):
            return jsonify({
                'error': 'Military-grade validation failed',
                'valid': False,
                'reason': military_validation.get('reason', 'Security violation detected'),
                'riskScore': military_validation.get('risk_score', risk_score)
            }), 403
        
        # Prepare response
        response = {
            'valid': True,
            'license': license.get_client_info(show_encrypted_key=True),
            'riskScore': risk_score,
            'militaryGrade': True,
            'securityLevel': 'military',
            'hardwareMatch': military_validation.get('hardware_match', True),
            'integrityValid': military_validation.get('integrity_valid', True),
            'debuggerDetected': military_validation.get('debugger_detected', False),
            'allSecurityFeatures': {
                'hardwareBinding': True,
                'antiTampering': True,
                'antiDebugging': True,
                'selfDestruction': True,
                'integrityChecking': True,
                'riskScoring': True,
                'secureDeletion': True,
                'daemonSystem': True
            }
        }
        
        return jsonify(response)
        
    except Exception as error:
        logger.error(f'Validate license error: {error}')
        return jsonify({'error': 'License validation failed'}), 500

@licenses_bp.route('/stats/overview', methods=['GET'])
@admin_required
def get_license_stats():
    """Get license statistics (admin only)"""
    try:
        total = License.query.count()
        active = License.query.filter_by(status='active').count()
        expired = License.query.filter_by(status='expired').count()
        suspended = License.query.filter_by(status='suspended').count()
        revoked = License.query.filter_by(status='revoked').count()
        
        # Expiring soon (within 7 days)
        seven_days_from_now = datetime.utcnow() + timedelta(days=7)
        expiring_soon = License.query.filter(
            License.status == 'active',
            License.expiry_date <= seven_days_from_now,
            License.expiry_date >= datetime.utcnow()
        ).count()
        
        return jsonify({
            'total': total,
            'active': active,
            'expired': expired,
            'suspended': suspended,
            'revoked': revoked,
            'expiringSoon': expiring_soon
        })
        
    except Exception as error:
        logger.error(f'Get stats error: {error}')
        return jsonify({'error': 'Failed to fetch statistics'}), 500
