const { spawn, exec } = require('child_process');
const logger = require('../core/logger').createServiceLogger('PROCTORING_DETECTION');
const { EventEmitter } = require('events');

class ProctoringDetectionService extends EventEmitter {
  constructor() {
    super();
    this.isMonitoring = false;
    this.detectionInterval = null;
    this.detectionFrequency = 2000; // Check every 2 seconds
    this.shutdownCallback = null;
    
    // Known proctoring software signatures
    this.proctoringSignatures = {
      processes: [
        // Mercer | Mettl
        'mettl', 'mercer', 'mettlsecure', 'mettlproctoring',
        
        // Respondus
        'respondus', 'lockdownbrowser', 'respondusapp',
        
        // ProctorU
        'proctoru', 'proctoruapp', 'guardianapp',
        
        // ExamSoft
        'examsoft', 'examplify', 'exammonitor',
        
        // HackerEarth/HackerRank
        'hackerearth', 'hackerrank', 'codingtest',
        
        // Other common proctoring tools
        'proctorio', 'honorlock', 'examity', 'remoteinvigilator',
        'secureexam', 'testguard', 'examguard', 'procwatch',
        
        // Browser-based proctoring extensions (process names may vary)
        'chromedriver', 'geckodriver', 'edgedriver' // When used by proctoring
      ],
      
      windowTitles: [
        'secure exam mode', 'exam monitor', 'proctoring session',
        'lockdown browser', 'test environment', 'assessment platform', 
        'online examination', 'mercer mettl', 'respondus lockdown', 
        'proctoru session', 'examsoft secure'
      ],
      
      registryKeys: [
        // Windows registry keys that proctoring software might create
        'HKEY_LOCAL_MACHINE\\SOFTWARE\\Respondus',
        'HKEY_LOCAL_MACHINE\\SOFTWARE\\Mercer',
        'HKEY_LOCAL_MACHINE\\SOFTWARE\\ProctorU',
        'HKEY_LOCAL_MACHINE\\SOFTWARE\\ExamSoft'
      ],
      
      networkConnections: [
        // Common proctoring service domains
        'mettl.com', 'mercer.com', 'proctoru.com', 'respondus.com',
        'examsoft.com', 'hackerearth.com', 'hackerrank.com',
        'proctorio.com', 'honorlock.com', 'examity.com'
      ]
    };
  }

  startMonitoring(shutdownCallback) {
    if (this.isMonitoring) {
      logger.warn('Proctoring detection already running');
      return;
    }

    this.shutdownCallback = shutdownCallback;
    this.isMonitoring = true;

    logger.info('Starting proctoring software detection', {
      frequency: `${this.detectionFrequency}ms`,
      processCount: this.proctoringSignatures.processes.length,
      windowTitleCount: this.proctoringSignatures.windowTitles.length
    });

    // Add a 5-second delay before starting detection to prevent false positives during startup
    setTimeout(() => {
      if (this.isMonitoring) {
        // Initial scan
        this.performDetectionScan();

        // Set up periodic monitoring
        this.detectionInterval = setInterval(() => {
          this.performDetectionScan();
        }, this.detectionFrequency);
      }
    }, 5000);

    this.emit('monitoring-started');
  }

  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }

    logger.info('Proctoring detection monitoring stopped');
    this.emit('monitoring-stopped');
  }

  async performDetectionScan() {
    try {
      const detectionResults = await Promise.allSettled([
        this.scanRunningProcesses(),
        this.scanWindowTitles(),
        this.scanNetworkConnections(),
        this.scanRegistryKeys()
      ]);

      const threats = [];
      
      detectionResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.detected) {
          threats.push(result.value);
        }
      });

      if (threats.length > 0) {
        this.handleProctoringDetected(threats);
      }

    } catch (error) {
      logger.error('Error during proctoring detection scan', {
        error: error.message
      });
    }
  }

  async scanRunningProcesses() {
    return new Promise((resolve) => {
      const command = process.platform === 'win32' 
        ? 'tasklist /fo csv' 
        : 'ps aux';

      exec(command, (error, stdout) => {
        if (error) {
          resolve({ detected: false, method: 'process_scan', error: error.message });
          return;
        }

        const processes = stdout.toLowerCase();
        const detectedProcesses = this.proctoringSignatures.processes.filter(sig => 
          processes.includes(sig.toLowerCase())
        );

        if (detectedProcesses.length > 0) {
          resolve({
            detected: true,
            method: 'process_scan',
            threats: detectedProcesses,
            severity: 'HIGH'
          });
        } else {
          resolve({ detected: false, method: 'process_scan' });
        }
      });
    });
  }

  async scanWindowTitles() {
    return new Promise((resolve) => {
      if (process.platform !== 'win32') {
        resolve({ detected: false, method: 'window_scan', reason: 'not_windows' });
        return;
      }

      // Skip window scanning in development mode to prevent false positives
      if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
        resolve({ detected: false, method: 'window_scan', reason: 'development_mode' });
        return;
      }

      // PowerShell command to get window titles
      const command = 'powershell "Get-Process | Where-Object {$_.MainWindowTitle} | Select-Object MainWindowTitle"';
      
      exec(command, (error, stdout) => {
        if (error) {
          resolve({ detected: false, method: 'window_scan', error: error.message });
          return;
        }

        const windowTitles = stdout.toLowerCase();
        const detectedTitles = this.proctoringSignatures.windowTitles.filter(sig => 
          windowTitles.includes(sig.toLowerCase())
        );

        if (detectedTitles.length > 0) {
          resolve({
            detected: true,
            method: 'window_scan',
            threats: detectedTitles,
            severity: 'HIGH'
          });
        } else {
          resolve({ detected: false, method: 'window_scan' });
        }
      });
    });
  }

  async scanNetworkConnections() {
    return new Promise((resolve) => {
      const command = process.platform === 'win32' 
        ? 'netstat -an' 
        : 'netstat -an';

      exec(command, (error, stdout) => {
        if (error) {
          resolve({ detected: false, method: 'network_scan', error: error.message });
          return;
        }

        const connections = stdout.toLowerCase();
        const detectedConnections = this.proctoringSignatures.networkConnections.filter(domain => 
          connections.includes(domain.toLowerCase())
        );

        if (detectedConnections.length > 0) {
          resolve({
            detected: true,
            method: 'network_scan',
            threats: detectedConnections,
            severity: 'MEDIUM'
          });
        } else {
          resolve({ detected: false, method: 'network_scan' });
        }
      });
    });
  }

  async scanRegistryKeys() {
    return new Promise((resolve) => {
      if (process.platform !== 'win32') {
        resolve({ detected: false, method: 'registry_scan', reason: 'not_windows' });
        return;
      }

      // Check for proctoring software registry entries
      const registryChecks = this.proctoringSignatures.registryKeys.map(keyPath => {
        return new Promise((resolveKey) => {
          exec(`reg query "${keyPath}" 2>nul`, (error, stdout) => {
            if (!error && stdout.trim().length > 0) {
              resolveKey({ found: true, key: keyPath });
            } else {
              resolveKey({ found: false, key: keyPath });
            }
          });
        });
      });

      Promise.allSettled(registryChecks).then(results => {
        const foundKeys = results
          .filter(result => result.status === 'fulfilled' && result.value.found)
          .map(result => result.value.key);

        if (foundKeys.length > 0) {
          resolve({
            detected: true,
            method: 'registry_scan',
            threats: foundKeys,
            severity: 'HIGH'
          });
        } else {
          resolve({ detected: false, method: 'registry_scan' });
        }
      });
    });
  }

  handleProctoringDetected(threats) {
    const highSeverityThreats = threats.filter(threat => threat.severity === 'HIGH');
    
    logger.warn('PROCTORING SOFTWARE DETECTED!', {
      threatCount: threats.length,
      highSeverityCount: highSeverityThreats.length,
      threats: threats.map(t => ({
        method: t.method,
        threats: t.threats,
        severity: t.severity
      }))
    });

    // Emit detection event
    this.emit('proctoring-detected', {
      threats,
      timestamp: new Date().toISOString(),
      action: 'shutdown_initiated'
    });

    // Initiate emergency shutdown
    this.initiateEmergencyShutdown(threats);
  }

  async initiateEmergencyShutdown(threats) {
    logger.error('INITIATING EMERGENCY SHUTDOWN - Proctoring software detected', {
      reason: 'proctoring_detection',
      threatCount: threats.length,
      timestamp: new Date().toISOString()
    });

    try {
      // Stop monitoring first
      this.stopMonitoring();

      // Clear any sensitive data
      await this.clearSensitiveData();

      // Notify the main application
      if (this.shutdownCallback && typeof this.shutdownCallback === 'function') {
        this.shutdownCallback('proctoring_detected', threats);
      }

      // Emit shutdown event
      this.emit('emergency-shutdown', {
        reason: 'proctoring_detected',
        threats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error during emergency shutdown', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  async clearSensitiveData() {
    try {
      // Clear session memory
      const sessionManager = require('../managers/session.manager');
      if (sessionManager && typeof sessionManager.clear === 'function') {
        sessionManager.clear();
      }

      // Clear any cached data
      if (global.gc) {
        global.gc(); // Force garbage collection if available
      }

      logger.info('Sensitive data cleared during emergency shutdown');
    } catch (error) {
      logger.error('Error clearing sensitive data', { error: error.message });
    }
  }

  getDetectionStats() {
    return {
      isMonitoring: this.isMonitoring,
      detectionFrequency: this.detectionFrequency,
      signatures: {
        processCount: this.proctoringSignatures.processes.length,
        windowTitleCount: this.proctoringSignatures.windowTitles.length,
        registryKeyCount: this.proctoringSignatures.registryKeys.length,
        networkDomainCount: this.proctoringSignatures.networkConnections.length
      }
    };
  }

  updateSignatures(newSignatures) {
    if (newSignatures.processes) {
      this.proctoringSignatures.processes = [
        ...this.proctoringSignatures.processes,
        ...newSignatures.processes
      ];
    }
    
    if (newSignatures.windowTitles) {
      this.proctoringSignatures.windowTitles = [
        ...this.proctoringSignatures.windowTitles,
        ...newSignatures.windowTitles
      ];
    }

    logger.info('Proctoring signatures updated', {
      newProcesses: newSignatures.processes?.length || 0,
      newWindowTitles: newSignatures.windowTitles?.length || 0
    });
  }

  // Manual trigger for testing
  triggerTestDetection() {
    logger.warn('TEST: Manual proctoring detection triggered');
    this.handleProctoringDetected([{
      detected: true,
      method: 'manual_test',
      threats: ['test_proctoring_software'],
      severity: 'HIGH'
    }]);
  }
}

module.exports = new ProctoringDetectionService();
