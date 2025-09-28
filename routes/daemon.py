from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from middleware.auth import auth_required, admin_required
from models import License, db
from services.daemon_service import DaemonManager
from datetime import datetime
import logging
import os

daemon_bp = Blueprint('daemon', __name__)
logger = logging.getLogger(__name__)

# Initialize daemon manager
daemon_manager = DaemonManager()

@daemon_bp.route('/status', methods=['GET'])
@admin_required
def get_daemon_status():
    """Get daemon system status (admin only)"""
    try:
        status = daemon_manager.get_status()
        return jsonify(status)
    except Exception as error:
        logger.error(f'Get daemon status error: {error}')
        return jsonify({'error': 'Failed to get daemon status'}), 500

@daemon_bp.route('/start', methods=['POST'])
@admin_required
def start_daemon():
    """Start daemon system (admin only)"""
    try:
        result = daemon_manager.start_all_daemons()
        return jsonify({
            'message': 'Daemon system started successfully',
            'result': result
        })
    except Exception as error:
        logger.error(f'Start daemon error: {error}')
        return jsonify({'error': 'Failed to start daemon system'}), 500

@daemon_bp.route('/stop', methods=['POST'])
@admin_required
def stop_daemon():
    """Stop daemon system (admin only)"""
    try:
        result = daemon_manager.stop_all_daemons()
        return jsonify({
            'message': 'Daemon system stopped successfully',
            'result': result
        })
    except Exception as error:
        logger.error(f'Stop daemon error: {error}')
        return jsonify({'error': 'Failed to stop daemon system'}), 500

@daemon_bp.route('/restart', methods=['POST'])
@admin_required
def restart_daemon():
    """Restart daemon system (admin only)"""
    try:
        # Stop first
        daemon_manager.stop_all_daemons()
        # Then start
        result = daemon_manager.start_all_daemons()
        return jsonify({
            'message': 'Daemon system restarted successfully',
            'result': result
        })
    except Exception as error:
        logger.error(f'Restart daemon error: {error}')
        return jsonify({'error': 'Failed to restart daemon system'}), 500

@daemon_bp.route('/rotate-keys', methods=['POST'])
@admin_required
def rotate_keys():
    """Rotate encryption keys (admin only)"""
    try:
        result = daemon_manager.rotate_keys()
        return jsonify({
            'message': 'Key rotation completed successfully',
            'result': result
        })
    except Exception as error:
        logger.error(f'Rotate keys error: {error}')
        return jsonify({'error': 'Failed to rotate keys'}), 500

@daemon_bp.route('/validate-hash', methods=['POST'])
@admin_required
def validate_hash():
    """Validate hash integrity (admin only)"""
    try:
        data = request.get_json()
        hash_value = data.get('hash')
        
        if not hash_value:
            return jsonify({'error': 'Hash value is required'}), 400
        
        result = daemon_manager.validate_hash(hash_value)
        return jsonify({
            'message': 'Hash validation completed',
            'result': result
        })
    except Exception as error:
        logger.error(f'Validate hash error: {error}')
        return jsonify({'error': 'Failed to validate hash'}), 500

@daemon_bp.route('/change-password', methods=['POST'])
@admin_required
def change_password():
    """Change daemon password (admin only)"""
    try:
        data = request.get_json()
        new_password = data.get('newPassword')
        
        if not new_password:
            return jsonify({'error': 'New password is required'}), 400
        
        result = daemon_manager.change_password(new_password)
        return jsonify({
            'message': 'Password changed successfully',
            'result': result
        })
    except Exception as error:
        logger.error(f'Change password error: {error}')
        return jsonify({'error': 'Failed to change password'}), 500

@daemon_bp.route('/enable-hash', methods=['POST'])
@admin_required
def enable_hash():
    """Enable hash validation (admin only)"""
    try:
        result = daemon_manager.enable_hash_validation()
        return jsonify({
            'message': 'Hash validation enabled successfully',
            'result': result
        })
    except Exception as error:
        logger.error(f'Enable hash error: {error}')
        return jsonify({'error': 'Failed to enable hash validation'}), 500

@daemon_bp.route('/disable-hash', methods=['POST'])
@admin_required
def disable_hash():
    """Disable hash validation (admin only)"""
    try:
        result = daemon_manager.disable_hash_validation()
        return jsonify({
            'message': 'Hash validation disabled successfully',
            'result': result
        })
    except Exception as error:
        logger.error(f'Disable hash error: {error}')
        return jsonify({'error': 'Failed to disable hash validation'}), 500

@daemon_bp.route('/logs', methods=['GET'])
@admin_required
def get_daemon_logs():
    """Get daemon logs (admin only)"""
    try:
        lines = int(request.args.get('lines', 100))
        logs = daemon_manager.get_logs(lines)
        return jsonify({
            'logs': logs,
            'lines': lines
        })
    except Exception as error:
        logger.error(f'Get daemon logs error: {error}')
        return jsonify({'error': 'Failed to get daemon logs'}), 500

@daemon_bp.route('/metrics', methods=['GET'])
@admin_required
def get_daemon_metrics():
    """Get daemon metrics (admin only)"""
    try:
        metrics = daemon_manager.get_metrics()
        return jsonify(metrics)
    except Exception as error:
        logger.error(f'Get daemon metrics error: {error}')
        return jsonify({'error': 'Failed to get daemon metrics'}), 500

@daemon_bp.route('/reset', methods=['POST'])
@admin_required
def reset_daemon():
    """Reset daemon system (admin only)"""
    try:
        result = daemon_manager.reset_system()
        return jsonify({
            'message': 'Daemon system reset successfully',
            'result': result
        })
    except Exception as error:
        logger.error(f'Reset daemon error: {error}')
        return jsonify({'error': 'Failed to reset daemon system'}), 500
