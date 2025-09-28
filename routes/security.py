from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from middleware.auth import auth_required, admin_required
from models import License, db
from datetime import datetime, timedelta
import logging

security_bp = Blueprint('security', __name__)
logger = logging.getLogger(__name__)

@security_bp.route('/violations', methods=['GET'])
@admin_required
def get_security_violations():
    """Get security violations (admin only)"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        # Get all licenses with security violations
        licenses_with_violations = License.query.filter(
            License.security_violations.isnot(None)
        ).all()
        
        violations = []
        for license in licenses_with_violations:
            license_violations = license.get_security_violations()
            for violation in license_violations:
                violations.append({
                    'license_id': license.id,
                    'client_id': license.client_id,
                    'client_name': license.client_name,
                    'violation_type': violation['type'],
                    'timestamp': violation['timestamp'],
                    'details': violation['details']
                })
        
        # Sort by timestamp (newest first)
        violations.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Apply pagination
        total = len(violations)
        start = (page - 1) * limit
        end = start + limit
        paginated_violations = violations[start:end]
        
        return jsonify({
            'violations': paginated_violations,
            'totalPages': (total + limit - 1) // limit,
            'currentPage': page,
            'total': total
        })
        
    except Exception as error:
        logger.error(f'Get security violations error: {error}')
        return jsonify({'error': 'Failed to fetch security violations'}), 500

@security_bp.route('/risk-scores', methods=['GET'])
@admin_required
def get_risk_scores():
    """Get license risk scores (admin only)"""
    try:
        # Get licenses with risk scores
        licenses = License.query.filter(
            License.risk_score > 0
        ).order_by(License.risk_score.desc()).all()
        
        risk_data = []
        for license in licenses:
            risk_data.append({
                'license_id': license.id,
                'client_id': license.client_id,
                'client_name': license.client_name,
                'risk_score': license.risk_score,
                'check_count': license.check_count,
                'last_checked': license.last_checked.isoformat() if license.last_checked else None,
                'last_access_ip': license.last_access_ip,
                'violations_count': len(license.get_security_violations())
            })
        
        return jsonify({
            'risk_scores': risk_data,
            'total': len(risk_data)
        })
        
    except Exception as error:
        logger.error(f'Get risk scores error: {error}')
        return jsonify({'error': 'Failed to fetch risk scores'}), 500

@security_bp.route('/monitoring', methods=['GET'])
@admin_required
def get_security_monitoring():
    """Get security monitoring data (admin only)"""
    try:
        # Get recent activity
        recent_licenses = License.query.filter(
            License.last_checked >= datetime.utcnow() - timedelta(hours=24)
        ).order_by(License.last_checked.desc()).limit(50).all()
        
        # Get high-risk licenses
        high_risk_licenses = License.query.filter(
            License.risk_score >= 0.7
        ).all()
        
        # Get licenses with violations
        violation_licenses = License.query.filter(
            License.security_violations.isnot(None)
        ).all()
        
        monitoring_data = {
            'recent_activity': [
                {
                    'license_id': license.id,
                    'client_id': license.client_id,
                    'client_name': license.client_name,
                    'last_checked': license.last_checked.isoformat() if license.last_checked else None,
                    'check_count': license.check_count,
                    'risk_score': license.risk_score,
                    'last_access_ip': license.last_access_ip
                }
                for license in recent_licenses
            ],
            'high_risk_licenses': [
                {
                    'license_id': license.id,
                    'client_id': license.client_id,
                    'client_name': license.client_name,
                    'risk_score': license.risk_score,
                    'violations_count': len(license.get_security_violations())
                }
                for license in high_risk_licenses
            ],
            'violation_summary': {
                'total_violations': sum(len(license.get_security_violations()) for license in violation_licenses),
                'licenses_with_violations': len(violation_licenses),
                'violation_types': {}
            }
        }
        
        # Count violation types
        for license in violation_licenses:
            violations = license.get_security_violations()
            for violation in violations:
                violation_type = violation['type']
                monitoring_data['violation_summary']['violation_types'][violation_type] = \
                    monitoring_data['violation_summary']['violation_types'].get(violation_type, 0) + 1
        
        return jsonify(monitoring_data)
        
    except Exception as error:
        logger.error(f'Get security monitoring error: {error}')
        return jsonify({'error': 'Failed to fetch security monitoring data'}), 500

@security_bp.route('/clear-violations/<license_id>', methods=['POST'])
@admin_required
def clear_security_violations(license_id):
    """Clear security violations for a license (admin only)"""
    try:
        license = License.query.get(license_id)
        if not license:
            return jsonify({'error': 'License not found'}), 404
        
        # Clear violations
        license.security_violations = None
        license.risk_score = 0.0
        license.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Security violations cleared successfully',
            'license_id': license_id
        })
        
    except Exception as error:
        logger.error(f'Clear security violations error: {error}')
        db.session.rollback()
        return jsonify({'error': 'Failed to clear security violations'}), 500

@security_bp.route('/suspend/<license_id>', methods=['POST'])
@admin_required
def suspend_license(license_id):
    """Suspend a license due to security concerns (admin only)"""
    try:
        data = request.get_json()
        reason = data.get('reason', 'Security violation')
        
        license = License.query.get(license_id)
        if not license:
            return jsonify({'error': 'License not found'}), 404
        
        # Suspend license
        license.status = 'suspended'
        license.add_security_violation('license_suspended', {
            'reason': reason,
            'suspended_by': get_jwt_identity()['user_id'],
            'timestamp': datetime.utcnow().isoformat()
        })
        license.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'License suspended successfully',
            'license_id': license_id,
            'reason': reason
        })
        
    except Exception as error:
        logger.error(f'Suspend license error: {error}')
        db.session.rollback()
        return jsonify({'error': 'Failed to suspend license'}), 500

@security_bp.route('/reactivate/<license_id>', methods=['POST'])
@admin_required
def reactivate_license(license_id):
    """Reactivate a suspended license (admin only)"""
    try:
        license = License.query.get(license_id)
        if not license:
            return jsonify({'error': 'License not found'}), 404
        
        if license.status != 'suspended':
            return jsonify({'error': 'License is not suspended'}), 400
        
        # Reactivate license
        license.status = 'active'
        license.add_security_violation('license_reactivated', {
            'reactivated_by': get_jwt_identity()['user_id'],
            'timestamp': datetime.utcnow().isoformat()
        })
        license.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'License reactivated successfully',
            'license_id': license_id
        })
        
    except Exception as error:
        logger.error(f'Reactivate license error: {error}')
        db.session.rollback()
        return jsonify({'error': 'Failed to reactivate license'}), 500
