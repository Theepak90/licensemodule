# Import db from app.py (will be imported after app initialization)
try:
    from app import db
except ImportError:
    from flask_sqlalchemy import SQLAlchemy
    db = SQLAlchemy()

from .user import User
from .license import License

__all__ = ['User', 'License', 'db']
