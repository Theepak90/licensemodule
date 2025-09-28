from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User
import logging

logger = logging.getLogger(__name__)

def auth_required(f):
    """Decorator to require authentication"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        try:
            current_user_id = get_jwt_identity()['user_id']
            user = User.query.get(current_user_id)
            
            if not user or not user.is_active:
                return jsonify({'error': 'Invalid or inactive user'}), 401
            
            # Add user to request context
            request.current_user = user
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f'Auth error: {e}')
            return jsonify({'error': 'Authentication failed'}), 401
    
    return decorated_function

def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        try:
            current_user_id = get_jwt_identity()['user_id']
            user = User.query.get(current_user_id)
            
            if not user or not user.is_active:
                return jsonify({'error': 'Invalid or inactive user'}), 401
            
            if user.role != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            # Add user to request context
            request.current_user = user
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f'Auth error: {e}')
            return jsonify({'error': 'Authentication failed'}), 401
    
    return decorated_function

def get_current_user():
    """Get current user from JWT token"""
    try:
        current_user_id = get_jwt_identity()['user_id']
        return User.query.get(current_user_id)
    except Exception:
        return None
