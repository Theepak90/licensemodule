# Torro License Management System

A comprehensive license management dashboard for the Torro platform with automatic license expiration and self-destruction capabilities.

## 🚀 Features

- **License Management Dashboard**: Create, view, edit, and delete licenses
- **Automatic Expiration**: Licenses automatically expire and become invalid
- **Self-Destruction**: Client applications can self-destruct when licenses expire
- **Real-time Validation**: License validation API for client applications
- **Security**: Encrypted license data and secure authentication
- **Monitoring**: Automatic monitoring and cleanup of expired licenses
- **Multi-tier Licenses**: Support for Trial, Standard, Premium, and Enterprise licenses

## 🏗️ Architecture

### Backend (Node.js + Express)
- RESTful API for license operations
- MongoDB for data persistence
- JWT authentication
- Automatic cron jobs for license monitoring
- License encryption and validation services

### Frontend (React)
- Modern dashboard with Tailwind CSS
- Real-time license status updates
- Responsive design for all devices
- Intuitive license management interface

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### 1. Clone and Install Dependencies

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/torro_licenses
DB_NAME=torro_licenses

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# License Configuration
LICENSE_ENCRYPTION_KEY=your-32-character-encryption-key
LICENSE_CHECK_INTERVAL=60000

# Security
ADMIN_EMAIL=admin@torro.com
ADMIN_PASSWORD=secure-admin-password
```

### 3. Start the Application

```bash
# Development mode (runs both server and client)
npm run dev

# Or run separately:
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

### 4. Access the Dashboard

- **Dashboard**: http://localhost:3000
- **API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## 🔧 API Documentation

### Authentication

#### Register Admin User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "admin@torro.com",
  "password": "secure-password",
  "role": "admin"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@torro.com",
  "password": "secure-password"
}
```

### License Management

#### Create License
```http
POST /api/licenses
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "clientName": "Acme Corp",
  "clientEmail": "contact@acme.com",
  "licenseType": "premium",
  "expiryDays": 365,
  "maxUsers": 10,
  "maxConnections": 100,
  "features": {
    "database_access": true,
    "api_access": true,
    "analytics": true,
    "support": true
  }
}
```

#### Validate License (Client Applications)
```http
POST /api/licenses/validate
Content-Type: application/json

{
  "licenseKey": "TORRO-abc123...",
  "clientId": "TORRO-123456789-ABC123"
}
```

#### Get All Licenses
```http
GET /api/licenses?page=1&limit=10&status=active&licenseType=premium
Authorization: Bearer <jwt-token>
```

#### Update License
```http
PUT /api/licenses/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "status": "suspended",
  "maxUsers": 20
}
```

#### Delete License
```http
DELETE /api/licenses/:id
Authorization: Bearer <jwt-token>
```

## 🔌 Client Integration

### Node.js Integration

```javascript
const axios = require('axios');

class TorroLicenseValidator {
  constructor(licenseKey, clientId, apiUrl = 'http://localhost:5000/api') {
    this.licenseKey = licenseKey;
    this.clientId = clientId;
    this.apiUrl = apiUrl;
    this.isValid = false;
  }

  async validateLicense() {
    try {
      const response = await axios.post(`${this.apiUrl}/licenses/validate`, {
        licenseKey: this.licenseKey,
        clientId: this.clientId
      });

      this.isValid = response.data.valid;
      return this.isValid;
    } catch (error) {
      console.error('License validation failed:', error.response?.data || error.message);
      this.isValid = false;
      return false;
    }
  }

  startPeriodicValidation(intervalMinutes = 60) {
    // Initial validation
    this.validateLicense();

    // Periodic validation
    setInterval(() => {
      this.validateLicense();
    }, intervalMinutes * 60 * 1000);
  }
}

// Usage
const validator = new TorroLicenseValidator('YOUR_LICENSE_KEY', 'YOUR_CLIENT_ID');
validator.startPeriodicValidation();
```

### Self-Destruction Implementation

```javascript
// Include this in your application startup
const fs = require('fs');
const path = require('path');

class LicenseManager {
  constructor(licenseData) {
    this.licenseData = licenseData;
    this.startLicenseCheck();
  }

  startLicenseCheck() {
    // Check license every minute
    setInterval(() => {
      this.validateLicense();
    }, 60000);

    // Initial check
    this.validateLicense();
  }

  validateLicense() {
    const now = new Date();
    const expiryDate = new Date(this.licenseData.expiryDate);

    if (now > expiryDate) {
      this.selfDestruct();
    }
  }

  selfDestruct() {
    console.log('🚨 License has expired. Application will self-destruct...');
    
    // Create lock file to prevent startup
    const lockFile = path.join(__dirname, '.license_expired');
    fs.writeFileSync(lockFile, JSON.stringify({
      expired: true,
      expiryDate: this.licenseData.expiryDate,
      timestamp: new Date().toISOString()
    }));

    // Remove critical files
    const criticalFiles = ['config.json', 'database.json'];
    criticalFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    // Exit application
    process.exit(1);
  }

  // Check if application should start
  static shouldStart() {
    const lockFile = path.join(__dirname, '.license_expired');
    return !fs.existsSync(lockFile);
  }
}

// Usage in your main application
if (!LicenseManager.shouldStart()) {
  console.log('Application cannot start - license expired');
  process.exit(1);
}

const licenseManager = new LicenseManager(licenseData);
```

## 🔒 Security Features

- **JWT Authentication**: Secure API access with JSON Web Tokens
- **Password Hashing**: Bcrypt with salt rounds for secure password storage
- **License Encryption**: AES-256 encryption for sensitive license data
- **Rate Limiting**: Protection against brute force attacks
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet Security**: HTTP security headers

## 📊 Monitoring & Automation

### Automatic License Monitoring
- **Expiration Check**: Runs every minute to identify expired licenses
- **Status Updates**: Automatically updates license status to 'expired'
- **Cleanup Job**: Daily cleanup of old expired licenses (30-day grace period)
- **Audit Logging**: Comprehensive logging of all license operations

### Dashboard Features
- **Real-time Statistics**: License counts and status overview
- **Expiration Alerts**: Visual indicators for expiring licenses
- **Activity Tracking**: License usage and validation history
- **Bulk Operations**: Mass license management capabilities

## 🚀 Deployment

### Production Environment

1. **Set Environment Variables**:
```bash
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db:27017/torro_licenses
JWT_SECRET=your-production-jwt-secret
LICENSE_ENCRYPTION_KEY=your-production-encryption-key
```

2. **Build Frontend**:
```bash
cd client
npm run build
```

3. **Start Production Server**:
```bash
npm start
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:16-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build client
WORKDIR /app/client
RUN npm ci && npm run build

# Return to root
WORKDIR /app

EXPOSE 5000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  torro-license:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/torro_licenses
      - JWT_SECRET=your-jwt-secret
      - LICENSE_ENCRYPTION_KEY=your-encryption-key
    depends_on:
      - mongo

  mongo:
    image: mongo:4.4
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## 🔧 Configuration Options

### License Types
- **Trial**: Limited time evaluation (default: 30 days)
- **Standard**: Basic features with standard limits
- **Premium**: Advanced features with higher limits
- **Enterprise**: Full feature set with maximum limits

### Features
- **database_access**: Full database read/write access
- **api_access**: Access to REST API endpoints
- **analytics**: Advanced analytics and reporting
- **support**: Priority customer support

### Monitoring Intervals
- **License Check**: Every minute (configurable)
- **Cleanup Job**: Daily at 2 AM
- **Grace Period**: 30 days for expired license cleanup

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity

2. **JWT Token Invalid**
   - Check JWT_SECRET in environment
   - Ensure token is not expired
   - Verify token format in Authorization header

3. **License Validation Fails**
   - Verify license key and client ID format
   - Check if license is expired
   - Ensure license status is 'active'

4. **Frontend Build Errors**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all dependencies are installed

### Logs and Debugging

```bash
# Enable debug logging
DEBUG=* npm run dev

# Check application logs
tail -f logs/app.log

# Monitor MongoDB queries
# Add debug: true to MongoDB connection options
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact: support@torro.com
- Documentation: https://docs.torro.com/license-manager

---

**Built with ❤️ for the Torro Platform**

