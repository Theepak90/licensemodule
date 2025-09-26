const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const DynamicConfig = require('./utils/dynamicConfig');

// Load dynamic configuration
const config = new DynamicConfig();

const authRoutes = require('./routes/auth');
const licenseRoutes = require('./routes/licenses');
const securityRoutes = require('./routes/security');
const { checkExpiredLicenses, cleanupExpiredLicenses } = require('./services/licenseExpirationService');

// FORCE DAEMON SYSTEM TO START WITH ALL LICENSES
const EnhancedDaemonManager = require('./services/daemons/enhancedDaemonManager');

const app = express();

// Get server configuration
const serverConfig = config.getServerConfig();
const databaseConfig = config.getDatabaseConfig();
const networkConfig = config.getNetworkSecurityConfig();
const cronConfig = config.getCronConfig();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: serverConfig.corsOrigin,
  credentials: serverConfig.corsCredentials,
  methods: serverConfig.corsMethods,
  allowedHeaders: serverConfig.corsHeaders
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: networkConfig.rateLimitWindowMs,
  max: networkConfig.rateLimitMaxRequests,
  message: networkConfig.rateLimitMessage
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: serverConfig.jsonLimit }));
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(databaseConfig.uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/secure-licenses', require('./routes/secureLicenses'));
app.use('/api/daemon', require('./routes/daemon'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Torro License Manager API is running',
    uptime: process.uptime(),
    config: {
      nodeEnv: serverConfig.nodeEnv,
      port: serverConfig.port,
      host: serverConfig.host
    }
  });
});

// License expiration cron job - runs every minute
cron.schedule(cronConfig.licenseCheck, async () => {
  try {
    console.log('🔍 Checking for expired licenses...');
    await checkExpiredLicenses();
  } catch (error) {
    console.error('❌ Error checking expired licenses:', error);
  }
});

// Cleanup expired licenses - runs daily at configurable time
cron.schedule(cronConfig.licenseCleanup, async () => {
  try {
    console.log('🧹 Cleaning up expired licenses...');
    await cleanupExpiredLicenses();
  } catch (error) {
    console.error('❌ Error cleaning up expired licenses:', error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// START DAEMON SYSTEM FOR ALL LICENSES
let daemonManager = null;

app.listen(serverConfig.port, serverConfig.host, async () => {
  console.log(`🚀 Torro License Manager running on ${serverConfig.host}:${serverConfig.port}`);
  console.log(`📊 Dashboard: http://${serverConfig.host}:${serverConfig.port}`);
  console.log(`🔗 API: http://${serverConfig.host}:${serverConfig.port}/api`);
  console.log(`🌍 Environment: ${serverConfig.nodeEnv}`);
  
  // FORCE START DAEMON SYSTEM
  try {
    console.log('🔒 STARTING ENHANCED DAEMON SYSTEM FOR ALL LICENSES...');
    daemonManager = new EnhancedDaemonManager();
    await daemonManager.startAllDaemons();
    console.log('✅ ENHANCED DAEMON SYSTEM STARTED - ALL LICENSES NOW USE MILITARY-GRADE SECURITY + DAEMON');
  } catch (error) {
    console.error('❌ Failed to start daemon system:', error.message);
  }
});
