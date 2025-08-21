const { exec, spawn } = require('child_process');
const logger = require('../core/logger').createServiceLogger('STEALTH_MODE');
const path = require('path');
const fs = require('fs');

class StealthService {
  constructor() {
    this.isStealthMode = false;
    this.originalProcessName = null;
    this.maskedProcessName = 'Windows Security Health Service';
    this.stealthPID = null;
  }

  async enableStealthMode() {
    try {
      logger.info('Enabling stealth mode...');
      
      // 1. Mask process name
      await this.maskProcessName();
      
      // 2. Disable Windows notifications
      await this.disableNotifications();
      
      // 3. Clear recent files/history
      await this.clearSystemTraces();
      
      // 4. Minimize system footprint
      await this.minimizeFootprint();
      
      this.isStealthMode = true;
      logger.info('Stealth mode enabled successfully');
      
      return { success: true, mode: 'stealth_active' };
      
    } catch (error) {
      logger.error('Failed to enable stealth mode', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async disableStealthMode() {
    try {
      logger.info('Disabling stealth mode...');
      
      // Restore original settings
      await this.restoreNotifications();
      
      this.isStealthMode = false;
      logger.info('Stealth mode disabled');
      
      return { success: true, mode: 'normal' };
      
    } catch (error) {
      logger.error('Failed to disable stealth mode', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async maskProcessName() {
    if (process.platform !== 'win32') return;
    
    try {
      // Create a symbolic link with a system-like name
      const currentExe = process.execPath;
      const maskedPath = path.join(path.dirname(currentExe), 'WindowsSecurityHealthService.exe');
      
      // This would require advanced Windows API manipulation
      // For now, we'll just log the attempt
      logger.info('Process masking initiated', {
        original: currentExe,
        masked: this.maskedProcessName
      });
      
    } catch (error) {
      logger.warn('Process masking failed', { error: error.message });
    }
  }

  async disableNotifications() {
    if (process.platform !== 'win32') return;
    
    try {
      // Temporarily disable Windows notifications that might expose the app
      const commands = [
        'reg add "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings" /v NOC_GLOBAL_SETTING_ALLOW_NOTIFICATION_SOUND /t REG_DWORD /d 0 /f',
        'reg add "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings" /v NOC_GLOBAL_SETTING_ALLOW_CRITICAL_TOASTS /t REG_DWORD /d 0 /f'
      ];
      
      for (const command of commands) {
        await this.executeCommand(command);
      }
      
      logger.info('System notifications temporarily disabled');
      
    } catch (error) {
      logger.warn('Failed to disable notifications', { error: error.message });
    }
  }

  async restoreNotifications() {
    if (process.platform !== 'win32') return;
    
    try {
      // Restore Windows notifications
      const commands = [
        'reg add "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings" /v NOC_GLOBAL_SETTING_ALLOW_NOTIFICATION_SOUND /t REG_DWORD /d 1 /f',
        'reg add "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings" /v NOC_GLOBAL_SETTING_ALLOW_CRITICAL_TOASTS /t REG_DWORD /d 1 /f'
      ];
      
      for (const command of commands) {
        await this.executeCommand(command);
      }
      
      logger.info('System notifications restored');
      
    } catch (error) {
      logger.warn('Failed to restore notifications', { error: error.message });
    }
  }

  async clearSystemTraces() {
    try {
      // Clear recent files, temp files, etc.
      const clearCommands = [
        'del /f /s /q "%temp%\\*.*" 2>nul',
        'del /f /s /q "%appdata%\\Microsoft\\Windows\\Recent\\*.*" 2>nul',
        'RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 8'  // Clear temporary internet files
      ];
      
      for (const command of clearCommands) {
        await this.executeCommand(command);
      }
      
      logger.info('System traces cleared');
      
    } catch (error) {
      logger.warn('Failed to clear system traces', { error: error.message });
    }
  }

  async minimizeFootprint() {
    try {
      // Reduce memory usage and CPU footprint
      if (global.gc) {
        global.gc(); // Force garbage collection
      }
      
      // Set lower process priority
      if (process.platform === 'win32') {
        await this.executeCommand(`wmic process where processid=${process.pid} CALL setpriority "below normal"`);
      }
      
      logger.info('System footprint minimized');
      
    } catch (error) {
      logger.warn('Failed to minimize footprint', { error: error.message });
    }
  }

  async executeCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  async detectScreenSharing() {
    return new Promise((resolve) => {
      if (process.platform !== 'win32') {
        resolve({ detected: false, reason: 'not_windows' });
        return;
      }

      // Check for screen sharing processes
      const command = 'powershell "Get-Process | Where-Object {$_.ProcessName -match \\"TeamViewer|AnyDesk|Chrome Remote Desktop|VNC|RDP|LogMeIn\\"} | Select-Object ProcessName"';
      
      exec(command, (error, stdout) => {
        if (error) {
          resolve({ detected: false, error: error.message });
          return;
        }

        const screenSharingApps = ['teamviewer', 'anydesk', 'chrome', 'vnc', 'rdp', 'logmein'];
        const processes = stdout.toLowerCase();
        
        const detectedApps = screenSharingApps.filter(app => processes.includes(app));
        
        if (detectedApps.length > 0) {
          resolve({
            detected: true,
            threats: detectedApps,
            severity: 'HIGH'
          });
        } else {
          resolve({ detected: false });
        }
      });
    });
  }

  async detectVirtualMachine() {
    return new Promise((resolve) => {
      if (process.platform !== 'win32') {
        resolve({ detected: false, reason: 'not_windows' });
        return;
      }

      // Check for VM indicators
      const command = 'wmic computersystem get manufacturer,model';
      
      exec(command, (error, stdout) => {
        if (error) {
          resolve({ detected: false, error: error.message });
          return;
        }

        const vmIndicators = ['vmware', 'virtualbox', 'hyper-v', 'parallels', 'qemu', 'xen'];
        const systemInfo = stdout.toLowerCase();
        
        const detectedVM = vmIndicators.filter(vm => systemInfo.includes(vm));
        
        if (detectedVM.length > 0) {
          resolve({
            detected: true,
            vm_type: detectedVM[0],
            severity: 'MEDIUM'
          });
        } else {
          resolve({ detected: false });
        }
      });
    });
  }

  getStealthStatus() {
    return {
      isStealthMode: this.isStealthMode,
      maskedProcessName: this.maskedProcessName,
      processId: process.pid,
      platform: process.platform
    };
  }

  async emergencyCleanup() {
    try {
      logger.warn('Emergency cleanup initiated');
      
      // Clear all traces
      await this.clearSystemTraces();
      
      // Clear memory
      if (global.gc) {
        global.gc();
      }
      
      // Clear session storage
      if (global.sessionStorage) {
        global.sessionStorage.clear();
      }
      
      logger.info('Emergency cleanup completed');
      
    } catch (error) {
      logger.error('Emergency cleanup failed', { error: error.message });
    }
  }
}

module.exports = new StealthService();
