# Flask Migration Guide

This document explains how to migrate from the Node.js version to the Flask version of the Torro License Manager.

## 🚀 Quick Start

### 1. Install Python Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Or use a virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Set Up Environment

```bash
# Copy the environment template
cp flask.env.example .env

# Edit .env file with your configuration
nano .env
```

### 3. Run Migration

```bash
# Run the migration script
python migrate_to_flask.py
```

### 4. Start the Flask Application

```bash
# Start the Flask server
python run_flask.py

# Or use Flask directly
flask run --host=0.0.0.0 --port=3010
```

## 📁 Project Structure

```
├── app.py                 # Main Flask application
├── config.py             # Configuration classes
├── requirements.txt      # Python dependencies
├── run_flask.py         # Startup script
├── migrate_to_flask.py  # Migration script
├── models/              # SQLAlchemy models
│   ├── __init__.py
│   ├── user.py
│   └── license.py
├── routes/              # Flask blueprints
│   ├── __init__.py
│   ├── auth.py
│   ├── licenses.py
│   ├── security.py
│   ├── secure_licenses.py
│   └── daemon.py
├── services/            # Business logic
│   ├── __init__.py
│   ├── license_service.py
│   └── daemon_service.py
├── middleware/          # Authentication middleware
│   ├── __init__.py
│   └── auth.py
└── client/             # React frontend (unchanged)
```

## 🔄 Migration Details

### Database Changes

- **From**: MongoDB with Mongoose
- **To**: SQLite/PostgreSQL with SQLAlchemy
- **Migration**: Automatic via `migrate_to_flask.py`

### API Changes

The API endpoints remain the same, but the implementation has changed:

#### Authentication
- **JWT**: Still uses JWT tokens
- **Password Hashing**: Now uses Werkzeug's password hashing
- **Middleware**: Converted to Flask decorators

#### License Management
- **Models**: Converted from Mongoose schemas to SQLAlchemy models
- **Validation**: Enhanced with Python-specific validation
- **Military-Grade Security**: Maintained all security features

#### Daemon System
- **From**: Node.js child processes
- **To**: Python threading
- **Features**: All daemon features preserved

## 🔧 Configuration

### Environment Variables

```bash
# Flask Configuration
FLASK_ENV=development
FLASK_APP=app.py

# Security
SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here

# Database
DATABASE_URL=sqlite:///license_manager.db

# Server
HOST=0.0.0.0
PORT=3010
```

### Database Options

#### SQLite (Default)
```bash
DATABASE_URL=sqlite:///license_manager.db
```

#### PostgreSQL
```bash
DATABASE_URL=postgresql://username:password@localhost/license_manager
```

## 🚀 Deployment

### Development
```bash
python run_flask.py
```

### Production with Gunicorn
```bash
gunicorn -w 4 -b 0.0.0.0:3010 app:app
```

### Docker
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 3010

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:3010", "app:app"]
```

## 🔒 Security Features

All security features from the Node.js version are preserved:

- ✅ Military-grade license keys
- ✅ Hardware binding
- ✅ Anti-tampering
- ✅ Anti-debugging
- ✅ Integrity checking
- ✅ Risk scoring
- ✅ Daemon system
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ CORS protection

## 📊 API Endpoints

All existing API endpoints are maintained:

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Licenses
- `GET /api/licenses` - Get all licenses
- `POST /api/licenses` - Create license
- `GET /api/licenses/:id` - Get license by ID
- `PUT /api/licenses/:id` - Update license
- `DELETE /api/licenses/:id` - Delete license
- `POST /api/licenses/validate` - Validate license
- `GET /api/licenses/stats/overview` - Get statistics

### Security
- `GET /api/security/violations` - Get security violations
- `GET /api/security/risk-scores` - Get risk scores
- `GET /api/security/monitoring` - Get monitoring data

### Daemon
- `GET /api/daemon/status` - Get daemon status
- `POST /api/daemon/start` - Start daemon
- `POST /api/daemon/stop` - Stop daemon
- `POST /api/daemon/restart` - Restart daemon

## 🐛 Troubleshooting

### Common Issues

1. **Import Errors**
   ```bash
   # Make sure you're in the project directory
   cd /path/to/LicenseModule
   
   # Install dependencies
   pip install -r requirements.txt
   ```

2. **Database Issues**
   ```bash
   # Reset database
   rm license_manager.db
   python migrate_to_flask.py
   ```

3. **Port Already in Use**
   ```bash
   # Change port in .env file
   PORT=3011
   ```

4. **CORS Issues**
   ```bash
   # Update CORS_ORIGINS in .env file
   CORS_ORIGINS=http://localhost:3009
   ```

### Logs

Check the logs directory for detailed error information:
- `logs/daemon.log` - Daemon system logs
- `logs/metrics.json` - System metrics

## 🔄 Rollback

If you need to rollback to the Node.js version:

1. Stop the Flask application
2. Start the Node.js server: `npm start`
3. The frontend will automatically connect to the Node.js backend

## 📞 Support

For issues with the Flask migration:
1. Check the logs in the `logs/` directory
2. Verify your `.env` configuration
3. Ensure all dependencies are installed
4. Check that the database is properly initialized

## 🎉 Benefits of Flask Migration

- **Performance**: Better memory usage and faster startup
- **Maintainability**: Cleaner code structure with SQLAlchemy
- **Scalability**: Better support for horizontal scaling
- **Security**: Enhanced security with Flask-Security
- **Monitoring**: Better logging and monitoring capabilities
- **Deployment**: Easier deployment with Gunicorn
