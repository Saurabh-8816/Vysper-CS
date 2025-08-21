# 🛡️ Proctoring Detection System

## ⚠️ **IMPORTANT ETHICAL NOTICE**

This feature is designed for **educational and research purposes only**. Using this during actual proctored exams or assessments would constitute **academic dishonesty** and could result in serious consequences including:

- Exam disqualification
- Academic disciplinary action
- Permanent academic record notation
- Legal consequences in some jurisdictions

**This feature should only be used for legitimate purposes such as:**
- Testing the app's functionality
- Understanding proctoring detection mechanisms
- Interview preparation (where AI assistance is acceptable)
- Personal coding practice

## 🔍 **How Proctoring Detection Works**

The system continuously monitors your computer for signs of proctoring software using multiple detection methods:

### **Detection Methods:**

1. **🖥️ Process Scanning**
   - Monitors running processes for known proctoring software names
   - Detects: Mercer Mettl, Respondus, ProctorU, ExamSoft, HackerEarth, etc.
   - Frequency: Every 2 seconds

2. **🪟 Window Title Analysis**
   - Scans active window titles for proctoring-related keywords
   - Detects: "proctoring", "secure exam", "lockdown", etc.

3. **🌐 Network Connection Monitoring**
   - Checks network connections to known proctoring service domains
   - Detects connections to: mettl.com, proctoru.com, respondus.com, etc.

4. **📝 Registry Key Detection (Windows)**
   - Scans Windows registry for proctoring software installations
   - Detects installed proctoring software even when not running

### **Monitored Proctoring Software:**

**Major Platforms:**
- **Mercer | Mettl** - AI-powered proctoring with behavioral analysis
- **Respondus LockDown Browser** - Browser-based exam lockdown
- **ProctorU** - Live human + AI proctoring
- **ExamSoft/Examplify** - Secure exam delivery platform
- **HackerEarth/HackerRank** - Coding assessment platforms

**Other Detected Software:**
- Proctorio, Honorlock, Examity
- RemoteInvigilator, SecureExam, TestGuard
- Custom proctoring solutions

## 🚨 **Emergency Shutdown Process**

When proctoring software is detected:

1. **⚡ Immediate Detection** (within 2 seconds)
2. **🚨 Warning Display** (3-second countdown)
3. **🧹 Data Cleanup** (clears session memory)
4. **💥 Force Shutdown** (terminates application)

### **Warning Window:**
- Shows detected threats
- 3-second countdown
- Cannot be closed or bypassed
- Appears on top of all windows

## ⚙️ **Configuration & Settings**

### **Settings Panel Access:**
1. Open Vysper Settings (`Cmd/Ctrl + ,`)
2. Navigate to "Proctoring Detection" section
3. View status and control monitoring

### **Available Controls:**

**📊 Status Display:**
- Real-time monitoring status
- Detection statistics (processes, window titles, registry keys)
- Current configuration details

**🎮 Manual Controls:**
- **Start Monitoring** - Begin proctoring detection
- **Stop Monitoring** - Disable detection (not recommended)
- **Test Emergency Shutdown** - Trigger test shutdown

### **Global Shortcuts:**
- No specific shortcuts (runs automatically on startup)
- Detection cannot be disabled via shortcuts (for safety)

## 🧪 **Testing the System**

### **Safe Testing:**
1. Open Settings window
2. Go to "Proctoring Detection" section
3. Click "Test Emergency Shutdown"
4. Observe warning window and app shutdown

### **Testing with Fake Process:**
You can test by temporarily renaming any executable to a proctoring software name (e.g., rename `notepad.exe` to `mettl.exe` temporarily).

## 📊 **Detection Statistics**

The system monitors:
- **27 Process Names** (mettl, respondus, proctoru, etc.)
- **11 Window Title Keywords** (proctoring, secure exam, etc.)
- **7 Registry Keys** (Windows installation signatures)
- **8 Network Domains** (proctoring service endpoints)

## 🔧 **Technical Implementation**

### **Service Architecture:**
- **Service**: `proctoring-detection.service.js`
- **Detection Frequency**: Every 2 seconds
- **Methods**: Process scan, window analysis, network monitoring, registry check
- **Shutdown Time**: ~3 seconds from detection to termination

### **Platform Support:**
- **Windows**: Full detection (processes, windows, registry, network)
- **macOS**: Partial detection (processes, network)
- **Linux**: Basic detection (processes, network)

### **Error Handling:**
- Graceful degradation if detection methods fail
- Logging of all detection attempts
- Fallback shutdown mechanisms

## 🛠️ **Customization**

### **Adding New Signatures:**
You can update the detection signatures by modifying `proctoring-detection.service.js`:

```javascript
// Add new process names to monitor
this.proctoringSignatures.processes.push('new-proctoring-software');

// Add new window title keywords
this.proctoringSignatures.windowTitles.push('new exam platform');
```

### **Detection Sensitivity:**
- **Current**: 2-second polling interval
- **Conservative**: Increase to 5 seconds (less CPU usage)
- **Aggressive**: Decrease to 1 second (more responsive)

## 📝 **Logs & Debugging**

### **Log Locations:**
- Detection events logged to console
- Emergency shutdowns logged with threat details
- All detection attempts recorded for analysis

### **Debug Information:**
```javascript
// Check detection status
await window.api.invoke('get-proctoring-detection-status');

// View detection statistics
console.log(proctoringDetectionService.getDetectionStats());
```

## ❓ **Frequently Asked Questions**

### **Q: Can I disable proctoring detection?**
A: Yes, through settings, but this defeats the purpose of stealth protection.

### **Q: What if I get false positives?**
A: The system errs on the side of caution. Review detected process names and update signatures if needed.

### **Q: Does this work with all proctoring software?**
A: It covers major platforms, but new or custom solutions might not be detected.

### **Q: How fast is the detection?**
A: Detection occurs within 2 seconds of proctoring software starting.

### **Q: What data is cleared during shutdown?**
A: All session memory, conversation history, and temporary data is cleared.

## 🔒 **Security & Privacy**

- **No Data Transmission**: Detection runs locally only
- **No Persistent Storage**: No detection data saved to disk
- **Memory Cleanup**: All sensitive data cleared on shutdown
- **Process Masking**: Continues to disguise as system processes

## 📞 **Support & Issues**

If you experience issues with proctoring detection:

1. Check console logs for error messages
2. Verify detection statistics in settings
3. Test with the manual test function
4. Review detected threats in emergency shutdown window

---

**Remember**: This feature exists to protect the stealth capabilities of Vysper. Use it responsibly and only in appropriate contexts where AI assistance is permitted.
