const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecurityMonitoring {
  constructor() {
    this.logDirectory = process.env.SECURITY_LOG_DIR || path.join(__dirname, '..', 'logs');
    this.logFile = path.join(this.logDirectory, process.env.SECURITY_LOG_FILE || 'security.log');
    this.violationsFile = path.join(this.logDirectory, process.env.VIOLATIONS_LOG_FILE || 'violations.log');
    this.metricsFile = path.join(this.logDirectory, process.env.METRICS_FILE || 'metrics.json');
    
    // Ensure logs directory exists
    this.ensureLogDirectory();
    
    // Initialize metrics
    this.metrics = this.loadMetrics();
    
    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  // ==================== LOGGING ====================

  logSecurityEvent(event, data, level = 'INFO') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      level,
      data,
      id: crypto.randomUUID()
    };

    // Write to security log
    this.writeToLog(this.logFile, logEntry);
    
    // Update metrics
    this.updateMetrics(event, level);
    
    // Real-time monitoring
    this.sendToRealTimeMonitoring(logEntry);
  }

  logSecurityViolation(violation, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: 'SECURITY_VIOLATION',
      violation,
      level: 'CRITICAL',
      data,
      id: crypto.randomUUID()
    };

    // Write to violations log
    this.writeToLog(this.violationsFile, logEntry);
    
    // Update metrics
    this.updateMetrics('SECURITY_VIOLATION', 'CRITICAL');
    
    // Send alert
    this.sendSecurityAlert(logEntry);
    
    // Real-time monitoring
    this.sendToRealTimeMonitoring(logEntry);
  }

  writeToLog(filePath, logEntry) {
    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(filePath, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  // ==================== METRICS ====================

  loadMetrics() {
    try {
      if (fs.existsSync(this.metricsFile)) {
        const data = fs.readFileSync(this.metricsFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
    
    return {
      totalEvents: 0,
      violations: 0,
      riskScores: [],
      hardwareMismatches: 0,
      integrityViolations: 0,
      debuggerDetections: 0,
      selfDestructions: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  saveMetrics() {
    try {
      this.metrics.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.metricsFile, JSON.stringify(this.metrics, null, 2));
    } catch (error) {
      console.error('Failed to save metrics:', error);
    }
  }

  updateMetrics(event, level) {
    this.metrics.totalEvents++;
    
    if (level === 'CRITICAL') {
      this.metrics.violations++;
    }
    
    switch (event) {
      case 'HARDWARE_FINGERPRINT_MISMATCH':
        this.metrics.hardwareMismatches++;
        break;
      case 'INTEGRITY_VIOLATION':
        this.metrics.integrityViolations++;
        break;
      case 'DEBUGGER_DETECTED':
        this.metrics.debuggerDetections++;
        break;
      case 'SELF_DESTRUCTION_TRIGGERED':
        this.metrics.selfDestructions++;
        break;
    }
    
    this.saveMetrics();
  }

  updateRiskScore(riskScore) {
    this.metrics.riskScores.push({
      score: riskScore,
      timestamp: Date.now()
    });
    
    // Keep only last 1000 risk scores
    if (this.metrics.riskScores.length > 1000) {
      this.metrics.riskScores = this.metrics.riskScores.slice(-1000);
    }
    
    this.saveMetrics();
  }

  // ==================== RISK ASSESSMENT ====================

  calculateRiskTrend() {
    const scores = this.metrics.riskScores.slice(-100); // Last 100 scores
    if (scores.length < 2) return 'STABLE';
    
    const recent = scores.slice(-10);
    const older = scores.slice(-20, -10);
    
    const recentAvg = recent.reduce((sum, s) => sum + s.score, 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + s.score, 0) / older.length;
    
    const change = recentAvg - olderAvg;
    
    if (change > 10) return 'INCREASING';
    if (change < -10) return 'DECREASING';
    return 'STABLE';
  }

  getRiskLevel() {
    const recentScores = this.metrics.riskScores.slice(-10);
    if (recentScores.length === 0) return 'LOW';
    
    const avgScore = recentScores.reduce((sum, s) => sum + s.score, 0) / recentScores.length;
    
    if (avgScore >= 80) return 'CRITICAL';
    if (avgScore >= 60) return 'HIGH';
    if (avgScore >= 40) return 'MEDIUM';
    return 'LOW';
  }

  // ==================== ALERTS ====================

  sendSecurityAlert(logEntry) {
    const alert = {
      type: 'SECURITY_VIOLATION',
      severity: 'CRITICAL',
      timestamp: logEntry.timestamp,
      violation: logEntry.violation,
      data: logEntry.data,
      id: logEntry.id
    };
    
    // In production, integrate with alerting system
    console.error('🚨 SECURITY ALERT:', alert);
    
    // Send to external monitoring systems
    this.sendToExternalMonitoring(alert);
  }

  sendToRealTimeMonitoring(logEntry) {
    // In production, send to real-time monitoring dashboard
    console.log('📊 Real-time monitoring:', {
      event: logEntry.event,
      level: logEntry.level,
      timestamp: logEntry.timestamp
    });
  }

  sendToExternalMonitoring(alert) {
    // In production, integrate with external monitoring systems
    // Examples: DataDog, New Relic, Splunk, etc.
    console.log('📡 External monitoring:', alert);
  }

  // ==================== DASHBOARD DATA ====================

  getDashboardData() {
    const riskLevel = this.getRiskLevel();
    const riskTrend = this.calculateRiskTrend();
    
    return {
      overview: {
        totalEvents: this.metrics.totalEvents,
        violations: this.metrics.violations,
        riskLevel,
        riskTrend,
        lastUpdated: this.metrics.lastUpdated
      },
      security: {
        hardwareMismatches: this.metrics.hardwareMismatches,
        integrityViolations: this.metrics.integrityViolations,
        debuggerDetections: this.metrics.debuggerDetections,
        selfDestructions: this.metrics.selfDestructions
      },
      riskScores: this.metrics.riskScores.slice(-50), // Last 50 scores
      recentEvents: this.getRecentEvents(20)
    };
  }

  getRecentEvents(limit = 50) {
    try {
      if (!fs.existsSync(this.logFile)) return [];
      
      const data = fs.readFileSync(this.logFile, 'utf8');
      const lines = data.trim().split('\n').filter(line => line);
      const events = lines.map(line => JSON.parse(line));
      
      return events
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get recent events:', error);
      return [];
    }
  }

  getViolations(limit = 50) {
    try {
      if (!fs.existsSync(this.violationsFile)) return [];
      
      const data = fs.readFileSync(this.violationsFile, 'utf8');
      const lines = data.trim().split('\n').filter(line => line);
      const violations = lines.map(line => JSON.parse(line));
      
      return violations
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get violations:', error);
      return [];
    }
  }

  // ==================== CLEANUP ====================

  startPeriodicCleanup() {
    // Clean up old logs at configurable interval
    const cleanupInterval = parseInt(process.env.LOG_CLEANUP_INTERVAL) || 3600000; // 1 hour
    setInterval(() => {
      this.cleanupOldLogs();
    }, cleanupInterval);
  }

  cleanupOldLogs() {
    const maxAge = parseInt(process.env.LOG_RETENTION_DAYS) * 24 * 60 * 60 * 1000 || 7 * 24 * 60 * 60 * 1000; // 7 days default
    const now = Date.now();
    
    [this.logFile, this.violationsFile].forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          if (now - stats.mtime.getTime() > maxAge) {
            // Archive old log file
            const archivePath = filePath + '.' + new Date().toISOString().split('T')[0];
            fs.renameSync(filePath, archivePath);
            
            // Compress archived file (in production)
            this.compressLogFile(archivePath);
          }
        }
      } catch (error) {
        console.error('Failed to cleanup log file:', error);
      }
    });
  }

  compressLogFile(filePath) {
    // In production, compress the log file
    console.log('📦 Compressing log file:', filePath);
  }

  // ==================== UTILITIES ====================

  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  // ==================== PUBLIC API ====================

  getMetrics() {
    return this.metrics;
  }

  getSecurityStatus() {
    return {
      riskLevel: this.getRiskLevel(),
      riskTrend: this.calculateRiskTrend(),
      totalViolations: this.metrics.violations,
      lastViolation: this.getLastViolation()
    };
  }

  getLastViolation() {
    const violations = this.getViolations(1);
    return violations.length > 0 ? violations[0] : null;
  }

  // Force cleanup
  forceCleanup() {
    this.cleanupOldLogs();
  }

  // Export logs for analysis
  exportLogs(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const allEvents = this.getRecentEvents(10000); // Get more events
    const filteredEvents = allEvents.filter(event => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= start && eventDate <= end;
    });
    
    return filteredEvents;
  }
}

module.exports = SecurityMonitoring;
