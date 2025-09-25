const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const SecurityMonitoring = require('../services/securityMonitoring');

const router = express.Router();
const securityMonitoring = new SecurityMonitoring();

// Get security dashboard data (admin only)
router.get('/dashboard', auth, adminOnly, async (req, res) => {
  try {
    const dashboardData = securityMonitoring.getDashboardData();
    res.json(dashboardData);
  } catch (error) {
    console.error('Security dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch security dashboard data' });
  }
});

// Get security metrics (admin only)
router.get('/metrics', auth, adminOnly, async (req, res) => {
  try {
    const metrics = securityMonitoring.getMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Security metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch security metrics' });
  }
});

// Get security status (admin only)
router.get('/status', auth, adminOnly, async (req, res) => {
  try {
    const status = securityMonitoring.getSecurityStatus();
    res.json(status);
  } catch (error) {
    console.error('Security status error:', error);
    res.status(500).json({ error: 'Failed to fetch security status' });
  }
});

// Get recent security events (admin only)
router.get('/events', auth, adminOnly, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const events = securityMonitoring.getRecentEvents(limit);
    res.json(events);
  } catch (error) {
    console.error('Security events error:', error);
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
});

// Get security violations (admin only)
router.get('/violations', auth, adminOnly, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const violations = securityMonitoring.getViolations(limit);
    res.json(violations);
  } catch (error) {
    console.error('Security violations error:', error);
    res.status(500).json({ error: 'Failed to fetch security violations' });
  }
});

// Export security logs (admin only)
router.get('/export', auth, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate parameters are required' 
      });
    }
    
    const logs = securityMonitoring.exportLogs(startDate, endDate);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="security-logs-${startDate}-to-${endDate}.json"`);
    res.json(logs);
  } catch (error) {
    console.error('Security export error:', error);
    res.status(500).json({ error: 'Failed to export security logs' });
  }
});

// Force cleanup (admin only)
router.post('/cleanup', auth, adminOnly, async (req, res) => {
  try {
    securityMonitoring.forceCleanup();
    res.json({ message: 'Security logs cleanup completed' });
  } catch (error) {
    console.error('Security cleanup error:', error);
    res.status(500).json({ error: 'Failed to cleanup security logs' });
  }
});

// Get risk analysis (admin only)
router.get('/risk-analysis', auth, adminOnly, async (req, res) => {
  try {
    const metrics = securityMonitoring.getMetrics();
    const riskLevel = securityMonitoring.getRiskLevel();
    const riskTrend = securityMonitoring.calculateRiskTrend();
    
    const analysis = {
      currentRiskLevel: riskLevel,
      riskTrend,
      averageRiskScore: metrics.riskScores.length > 0 
        ? metrics.riskScores.reduce((sum, s) => sum + s.score, 0) / metrics.riskScores.length 
        : 0,
      totalViolations: metrics.violations,
      violationRate: metrics.totalEvents > 0 
        ? (metrics.violations / metrics.totalEvents) * 100 
        : 0,
      recommendations: generateRecommendations(riskLevel, metrics)
    };
    
    res.json(analysis);
  } catch (error) {
    console.error('Risk analysis error:', error);
    res.status(500).json({ error: 'Failed to generate risk analysis' });
  }
});

// Generate security recommendations
function generateRecommendations(riskLevel, metrics) {
  const recommendations = [];
  
  if (riskLevel === 'CRITICAL') {
    recommendations.push('Immediate action required - review all security violations');
    recommendations.push('Consider suspending high-risk licenses');
    recommendations.push('Implement additional monitoring and alerting');
  } else if (riskLevel === 'HIGH') {
    recommendations.push('Review recent security violations');
    recommendations.push('Consider implementing additional security measures');
    recommendations.push('Monitor license usage patterns more closely');
  } else if (riskLevel === 'MEDIUM') {
    recommendations.push('Continue monitoring security metrics');
    recommendations.push('Review security policies and procedures');
  } else {
    recommendations.push('Maintain current security posture');
    recommendations.push('Continue regular security monitoring');
  }
  
  if (metrics.hardwareMismatches > 0) {
    recommendations.push('Review hardware fingerprint mismatches');
  }
  
  if (metrics.integrityViolations > 0) {
    recommendations.push('Investigate integrity violations');
  }
  
  if (metrics.debuggerDetections > 0) {
    recommendations.push('Review debugger detection events');
  }
  
  if (metrics.selfDestructions > 0) {
    recommendations.push('Review self-destruction triggers');
  }
  
  return recommendations;
}

module.exports = router;
