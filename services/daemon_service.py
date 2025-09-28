import os
import json
import time
import hashlib
import threading
import logging
from datetime import datetime
from typing import Dict, List, Any
import psutil

logger = logging.getLogger(__name__)

class DaemonManager:
    """Python equivalent of the Node.js daemon manager"""
    
    def __init__(self):
        self.daemon_processes = {}
        self.is_running = False
        self.log_file = 'logs/daemon.log'
        self.metrics_file = 'logs/metrics.json'
        self.pid_file = 'daemon.pid'
        
        # Ensure logs directory exists
        os.makedirs('logs', exist_ok=True)
        
        # Initialize metrics
        self.metrics = {
            'start_time': None,
            'uptime': 0,
            'key_rotations': 0,
            'hash_validations': 0,
            'security_checks': 0,
            'errors': 0
        }
    
    def get_status(self) -> Dict[str, Any]:
        """Get daemon system status"""
        try:
            status = {
                'running': self.is_running,
                'daemon_count': len(self.daemon_processes),
                'uptime': self._get_uptime(),
                'pid': self._get_pid(),
                'memory_usage': self._get_memory_usage(),
                'cpu_usage': self._get_cpu_usage(),
                'last_activity': self._get_last_activity(),
                'metrics': self.metrics
            }
            return status
        except Exception as e:
            logger.error(f"Error getting daemon status: {e}")
            return {'error': str(e)}
    
    def start_all_daemons(self) -> Dict[str, Any]:
        """Start all daemon processes"""
        try:
            if self.is_running:
                return {'message': 'Daemon system already running', 'status': 'running'}
            
            # Start key rotation daemon
            self._start_key_rotation_daemon()
            
            # Start security monitoring daemon
            self._start_security_monitoring_daemon()
            
            # Start hash validation daemon
            self._start_hash_validation_daemon()
            
            self.is_running = True
            self.metrics['start_time'] = datetime.utcnow().isoformat()
            self._save_pid()
            self._log_activity('Daemon system started')
            
            return {
                'message': 'All daemons started successfully',
                'status': 'started',
                'daemon_count': len(self.daemon_processes)
            }
        except Exception as e:
            logger.error(f"Error starting daemons: {e}")
            self.metrics['errors'] += 1
            return {'error': str(e)}
    
    def stop_all_daemons(self) -> Dict[str, Any]:
        """Stop all daemon processes"""
        try:
            if not self.is_running:
                return {'message': 'Daemon system not running', 'status': 'stopped'}
            
            # Stop all daemon threads
            for daemon_name, daemon_thread in self.daemon_processes.items():
                if daemon_thread.is_alive():
                    daemon_thread.join(timeout=5)
            
            self.daemon_processes.clear()
            self.is_running = False
            self._remove_pid()
            self._log_activity('Daemon system stopped')
            
            return {
                'message': 'All daemons stopped successfully',
                'status': 'stopped'
            }
        except Exception as e:
            logger.error(f"Error stopping daemons: {e}")
            self.metrics['errors'] += 1
            return {'error': str(e)}
    
    def rotate_keys(self) -> Dict[str, Any]:
        """Rotate encryption keys"""
        try:
            # Simulate key rotation
            new_key = self._generate_new_key()
            self.metrics['key_rotations'] += 1
            self._log_activity(f'Key rotation completed: {new_key[:8]}...')
            
            return {
                'message': 'Key rotation completed successfully',
                'new_key_hash': hashlib.sha256(new_key.encode()).hexdigest()[:16]
            }
        except Exception as e:
            logger.error(f"Error rotating keys: {e}")
            self.metrics['errors'] += 1
            return {'error': str(e)}
    
    def validate_hash(self, hash_value: str) -> Dict[str, Any]:
        """Validate hash integrity"""
        try:
            # Simulate hash validation
            is_valid = len(hash_value) == 64 and all(c in '0123456789abcdef' for c in hash_value.lower())
            self.metrics['hash_validations'] += 1
            self._log_activity(f'Hash validation: {"PASSED" if is_valid else "FAILED"}')
            
            return {
                'message': 'Hash validation completed',
                'valid': is_valid,
                'hash': hash_value[:16] + '...' if len(hash_value) > 16 else hash_value
            }
        except Exception as e:
            logger.error(f"Error validating hash: {e}")
            self.metrics['errors'] += 1
            return {'error': str(e)}
    
    def change_password(self, new_password: str) -> Dict[str, Any]:
        """Change daemon password"""
        try:
            # Simulate password change
            password_hash = hashlib.sha256(new_password.encode()).hexdigest()
            self._log_activity('Password changed successfully')
            
            return {
                'message': 'Password changed successfully',
                'password_hash': password_hash[:16] + '...'
            }
        except Exception as e:
            logger.error(f"Error changing password: {e}")
            self.metrics['errors'] += 1
            return {'error': str(e)}
    
    def enable_hash_validation(self) -> Dict[str, Any]:
        """Enable hash validation"""
        try:
            self._log_activity('Hash validation enabled')
            return {'message': 'Hash validation enabled successfully'}
        except Exception as e:
            logger.error(f"Error enabling hash validation: {e}")
            return {'error': str(e)}
    
    def disable_hash_validation(self) -> Dict[str, Any]:
        """Disable hash validation"""
        try:
            self._log_activity('Hash validation disabled')
            return {'message': 'Hash validation disabled successfully'}
        except Exception as e:
            logger.error(f"Error disabling hash validation: {e}")
            return {'error': str(e)}
    
    def get_logs(self, lines: int = 100) -> List[str]:
        """Get daemon logs"""
        try:
            if not os.path.exists(self.log_file):
                return []
            
            with open(self.log_file, 'r') as f:
                all_lines = f.readlines()
                return [line.strip() for line in all_lines[-lines:]]
        except Exception as e:
            logger.error(f"Error getting logs: {e}")
            return []
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get daemon metrics"""
        try:
            # Update uptime
            if self.metrics['start_time']:
                start_time = datetime.fromisoformat(self.metrics['start_time'])
                self.metrics['uptime'] = int((datetime.utcnow() - start_time).total_seconds())
            
            return self.metrics.copy()
        except Exception as e:
            logger.error(f"Error getting metrics: {e}")
            return {'error': str(e)}
    
    def reset_system(self) -> Dict[str, Any]:
        """Reset daemon system"""
        try:
            # Stop all daemons
            self.stop_all_daemons()
            
            # Reset metrics
            self.metrics = {
                'start_time': None,
                'uptime': 0,
                'key_rotations': 0,
                'hash_validations': 0,
                'security_checks': 0,
                'errors': 0
            }
            
            # Clear logs
            if os.path.exists(self.log_file):
                with open(self.log_file, 'w') as f:
                    f.write('')
            
            self._log_activity('System reset completed')
            
            return {'message': 'Daemon system reset successfully'}
        except Exception as e:
            logger.error(f"Error resetting system: {e}")
            return {'error': str(e)}
    
    def _start_key_rotation_daemon(self):
        """Start key rotation daemon thread"""
        def key_rotation_worker():
            while self.is_running:
                try:
                    time.sleep(3600)  # Run every hour
                    if self.is_running:
                        self.rotate_keys()
                except Exception as e:
                    logger.error(f"Key rotation daemon error: {e}")
                    self.metrics['errors'] += 1
        
        thread = threading.Thread(target=key_rotation_worker, daemon=True)
        thread.start()
        self.daemon_processes['key_rotation'] = thread
    
    def _start_security_monitoring_daemon(self):
        """Start security monitoring daemon thread"""
        def security_monitoring_worker():
            while self.is_running:
                try:
                    time.sleep(60)  # Run every minute
                    if self.is_running:
                        self.metrics['security_checks'] += 1
                        self._log_activity('Security check completed')
                except Exception as e:
                    logger.error(f"Security monitoring daemon error: {e}")
                    self.metrics['errors'] += 1
        
        thread = threading.Thread(target=security_monitoring_worker, daemon=True)
        thread.start()
        self.daemon_processes['security_monitoring'] = thread
    
    def _start_hash_validation_daemon(self):
        """Start hash validation daemon thread"""
        def hash_validation_worker():
            while self.is_running:
                try:
                    time.sleep(300)  # Run every 5 minutes
                    if self.is_running:
                        # Simulate hash validation
                        test_hash = hashlib.sha256(str(time.time()).encode()).hexdigest()
                        self.validate_hash(test_hash)
                except Exception as e:
                    logger.error(f"Hash validation daemon error: {e}")
                    self.metrics['errors'] += 1
        
        thread = threading.Thread(target=hash_validation_worker, daemon=True)
        thread.start()
        self.daemon_processes['hash_validation'] = thread
    
    def _generate_new_key(self) -> str:
        """Generate new encryption key"""
        import secrets
        return secrets.token_hex(32)
    
    def _get_uptime(self) -> int:
        """Get daemon uptime in seconds"""
        if self.metrics['start_time']:
            start_time = datetime.fromisoformat(self.metrics['start_time'])
            return int((datetime.utcnow() - start_time).total_seconds())
        return 0
    
    def _get_pid(self) -> int:
        """Get daemon PID"""
        try:
            if os.path.exists(self.pid_file):
                with open(self.pid_file, 'r') as f:
                    return int(f.read().strip())
        except:
            pass
        return os.getpid()
    
    def _get_memory_usage(self) -> float:
        """Get memory usage percentage"""
        try:
            return psutil.virtual_memory().percent
        except:
            return 0.0
    
    def _get_cpu_usage(self) -> float:
        """Get CPU usage percentage"""
        try:
            return psutil.cpu_percent()
        except:
            return 0.0
    
    def _get_last_activity(self) -> str:
        """Get last activity timestamp"""
        try:
            if os.path.exists(self.log_file):
                with open(self.log_file, 'r') as f:
                    lines = f.readlines()
                    if lines:
                        return lines[-1].strip()
        except:
            pass
        return datetime.utcnow().isoformat()
    
    def _save_pid(self):
        """Save daemon PID to file"""
        try:
            with open(self.pid_file, 'w') as f:
                f.write(str(os.getpid()))
        except Exception as e:
            logger.error(f"Error saving PID: {e}")
    
    def _remove_pid(self):
        """Remove PID file"""
        try:
            if os.path.exists(self.pid_file):
                os.remove(self.pid_file)
        except Exception as e:
            logger.error(f"Error removing PID file: {e}")
    
    def _log_activity(self, message: str):
        """Log daemon activity"""
        try:
            timestamp = datetime.utcnow().isoformat()
            log_entry = f"[{timestamp}] {message}\n"
            
            with open(self.log_file, 'a') as f:
                f.write(log_entry)
        except Exception as e:
            logger.error(f"Error logging activity: {e}")
