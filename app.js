/**
 * Drivesist.ai - Real-Time Following Distance Safety System
 * JavaScript implementation for the web application
 */

class DriverCoach {
    constructor() {
        this.currentSpeed = 35; // Default mph
        this.currentDistance = 0; // feet
        this.safetyZone = 'SAFE';
        this.bluetoothDevice = null;
        this.bluetoothCharacteristic = null;
        this.lastVoiceAlert = 0;
        this.distanceBuffer = [];
        this.isConnected = false;
        this.speechSynthesis = window.speechSynthesis;
        
        // Initialize UI elements
        this.initializeUI();
        
        // Initialize event listeners
        this.initializeEventListeners();
    }
    
    /**
     * Initialize UI elements and references
     */
    initializeUI() {
        // Speed controls
        this.speedInput = document.getElementById('speed-input');
        this.speedValue = document.getElementById('speed-value');
        this.decreaseSpeedBtn = document.getElementById('decrease-speed');
        this.increaseSpeedBtn = document.getElementById('increase-speed');
        
        // Distance display
        this.distanceValue = document.getElementById('distance-value');
        this.safeDistanceValue = document.getElementById('safe-distance-value');
        
        // Status indicators
        this.statusIndicator = document.getElementById('status-indicator');
        this.statusText = document.getElementById('status-text');
        this.safetyMeterFill = document.getElementById('safety-meter-fill');
        this.speedometer = document.getElementById('speedometer');
        
        // Connection status
        this.connectionIcon = document.getElementById('connection-icon');
        this.connectionText = document.getElementById('connection-text');
        this.connectButton = document.getElementById('connect-button');
        
        // Sensor status
        this.sensorStatusText = document.getElementById('sensor-status-text');
        this.lastReadingTime = document.getElementById('last-reading-time');
    }
    
    /**
     * Initialize event listeners for UI interactions
     */
    initializeEventListeners() {
        // Speed control events
        this.decreaseSpeedBtn.addEventListener('click', () => this.adjustSpeed(-5));
        this.increaseSpeedBtn.addEventListener('click', () => this.adjustSpeed(5));
        this.speedInput.addEventListener('change', () => this.updateSpeedFromInput());
        
        // Connect button event
        this.connectButton.addEventListener('click', () => this.connectToSensor());
    }
    
    /**
     * Adjust the current speed by the given amount
     * @param {number} amount - Amount to adjust speed by
     */
    adjustSpeed(amount) {
        const newSpeed = this.currentSpeed + amount;
        if (newSpeed >= 25 && newSpeed <= 80) {
            this.currentSpeed = newSpeed;
            this.speedInput.value = this.currentSpeed;
            this.speedValue.textContent = this.currentSpeed;
            this.updateSafeDistance();
            this.calculateSafetyStatus();
        }
    }
    
    /**
     * Update speed from input field
     */
    updateSpeedFromInput() {
        let newSpeed = parseInt(this.speedInput.value);
        
        // Validate input
        if (isNaN(newSpeed)) {
            newSpeed = 35; // Default if invalid
        } else if (newSpeed < 25) {
            newSpeed = 25; // Minimum speed
        } else if (newSpeed > 80) {
            newSpeed = 80; // Maximum speed
        }
        
        this.currentSpeed = newSpeed;
        this.speedInput.value = this.currentSpeed;
        this.speedValue.textContent = this.currentSpeed;
        this.updateSafeDistance();
        this.calculateSafetyStatus();
    }
    
    /**
     * Connect to Bluetooth sensor
     */
    async connectToSensor() {
        if (this.isConnected) {
            this.disconnectSensor();
            return;
        }
        
        if (!navigator.bluetooth) {
            alert('Web Bluetooth API is not supported in your browser. Please use Chrome, Edge, or Opera.');
            return;
        }
        
        try {
            this.updateConnectionStatus('Connecting...', 'connecting');
            
            // Request Bluetooth device with specified service
            this.bluetoothDevice = await navigator.bluetooth.requestDevice({
                filters: [{ name: 'DriveCoach' }],
                optionalServices: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e']
            });
            
            // Add event listener for disconnection
            this.bluetoothDevice.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));
            
            // Connect to GATT server
            const server = await this.bluetoothDevice.gatt.connect();
            
            // Get the service
            const service = await server.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e');
            
            // Get the characteristic
            this.bluetoothCharacteristic = await service.getCharacteristic('6e400003-b5a3-f393-e0a9-e50e24dcca9e');
            
            // Start notifications
            await this.bluetoothCharacteristic.startNotifications();
            
            // Add event listener for characteristic value changes
            this.bluetoothCharacteristic.addEventListener('characteristicvaluechanged', this.handleCharacteristicValueChanged.bind(this));
            
            this.isConnected = true;
            this.updateConnectionStatus('Connected to DriveCoach', 'connected');
            this.connectButton.textContent = 'Disconnect';
            this.sensorStatusText.textContent = 'Sensor Status: Connected';
            this.statusText.textContent = 'CONNECTED';
        } catch (error) {
            console.error('Bluetooth connection error:', error);
            this.updateConnectionStatus('Connection failed', 'error');
            this.sensorStatusText.textContent = 'Sensor Status: Connection failed';
        }
    }
    
    /**
     * Disconnect from Bluetooth sensor
     */
    disconnectSensor() {
        if (this.bluetoothDevice && this.bluetoothDevice.gatt.connected) {
            this.bluetoothDevice.gatt.disconnect();
        }
        this.onDisconnected();
    }
    
    /**
     * Handle disconnection event
     */
    onDisconnected() {
        this.isConnected = false;
        this.bluetoothCharacteristic = null;
        this.updateConnectionStatus('Not Connected', 'disconnected');
        this.connectButton.textContent = 'Connect to DriveCoach';
        this.sensorStatusText.textContent = 'Sensor Status: Disconnected';
        this.statusText.textContent = 'DISCONNECTED';
        this.distanceValue.textContent = '--';
        this.safetyMeterFill.style.width = '0%';
        this.safetyMeterFill.className = 'safety-meter-fill';
        this.statusIndicator.className = 'status-indicator';
        this.speedometer.className = 'speedometer';
    }
    
    /**
     * Update connection status UI
     * @param {string} text - Status text
     * @param {string} status - Status type
     */
    updateConnectionStatus(text, status) {
        this.connectionText.textContent = text;
        
        if (status === 'connected') {
            this.connectionIcon.className = 'fas fa-bluetooth-b connected';
        } else {
            this.connectionIcon.className = 'fas fa-bluetooth-b';
        }
    }
    
    /**
     * Handle characteristic value changes from Bluetooth
     * @param {Event} event - Characteristic value changed event
     */
    handleCharacteristicValueChanged(event) {
        const value = event.target.value;
        const decoder = new TextDecoder('utf-8');
        const data = decoder.decode(value);
        
        try {
            const jsonData = JSON.parse(data);
            if (jsonData.cm !== undefined) {
                const cmReading = jsonData.cm;
                const feet = this.processDistanceReading(cmReading);
                this.currentDistance = feet;
                this.distanceValue.textContent = Math.round(feet);
                this.lastReadingTime.textContent = `Last Reading: ${new Date().toLocaleTimeString()}`;
                this.calculateSafetyStatus();
            }
        } catch (error) {
            console.error('Error parsing sensor data:', error);
        }
    }
    
    /**
     * Process distance reading with smoothing
     * @param {number} cmReading - Distance reading in centimeters
     * @returns {number} - Smoothed distance in feet
     */
    processDistanceReading(cmReading) {
        const feet = cmReading * 0.0328084;
        return this.smoothDistance(feet);
    }
    
    /**
     * Smooth distance readings with moving average
     * @param {number} newReading - New distance reading
     * @returns {number} - Smoothed distance
     */
    smoothDistance(newReading) {
        this.distanceBuffer.push(newReading);
        if (this.distanceBuffer.length > 5) {
            this.distanceBuffer.shift();
        }
        return this.distanceBuffer.reduce((a, b) => a + b) / this.distanceBuffer.length;
    }
    
    /**
     * Get safe distance for current speed
     * @returns {number} - Safe distance in feet
     */
    getSafeDistanceForSpeed() {
        // Safe Following Distance Chart (in feet)
        const safeDistances = {
            25: 110, // 3 seconds
            30: 132, // 3 seconds
            35: 154, // 3 seconds
            40: 176, // 3 seconds
            45: 220, // 3.5 seconds
            50: 245, // 3.5 seconds
            55: 270, // 3.5 seconds
            60: 290, // 3.5 seconds
            65: 315, // 4 seconds
            70: 340, // 4 seconds
            75: 365, // 4 seconds
            80: 390  // 4 seconds
        };
        
        // Find the closest speed in the chart
        const speeds = Object.keys(safeDistances).map(Number);
        const closestSpeed = speeds.reduce((prev, curr) => {
            return (Math.abs(curr - this.currentSpeed) < Math.abs(prev - this.currentSpeed) ? curr : prev);
        });
        
        return safeDistances[closestSpeed];
    }
    
    /**
     * Update safe distance display
     */
    updateSafeDistance() {
        const safeDistance = this.getSafeDistanceForSpeed();
        this.safeDistanceValue.textContent = safeDistance;
    }
    
    /**
     * Calculate safety status based on current distance and speed
     */
    calculateSafetyStatus() {
        if (!this.isConnected || this.currentDistance === 0) {
            return;
        }
        
        const safeDistance = this.getSafeDistanceForSpeed();
        const warningDistance = safeDistance * 0.7; // 70% of safe distance
        const dangerDistance = safeDistance * 0.4;  // 40% of safe distance
        const verySafeDistance = safeDistance * 1.5; // 150% of safe distance
        
        let zone;
        if (this.currentDistance < dangerDistance) {
            zone = 'DANGER';
            this.statusIndicator.className = 'status-indicator danger';
            this.speedometer.className = 'speedometer danger';
            this.safetyMeterFill.className = 'safety-meter-fill danger';
        } else if (this.currentDistance < warningDistance) {
            zone = 'WARNING';
            this.statusIndicator.className = 'status-indicator warning';
            this.speedometer.className = 'speedometer warning';
            this.safetyMeterFill.className = 'safety-meter-fill warning';
        } else if (this.currentDistance >= verySafeDistance) {
            zone = 'VERY SAFE';
            this.statusIndicator.className = 'status-indicator very-safe';
            this.speedometer.className = 'speedometer very-safe';
            this.safetyMeterFill.className = 'safety-meter-fill very-safe';
        } else {
            zone = 'SAFE';
            this.statusIndicator.className = 'status-indicator safe';
            this.speedometer.className = 'speedometer safe';
            this.safetyMeterFill.className = 'safety-meter-fill safe';
        }
        
        // Update status text
        this.statusText.textContent = zone;
        
        // Update safety meter fill
        const fillPercentage = Math.min(100, (this.currentDistance / safeDistance) * 100);
        this.safetyMeterFill.style.width = `${fillPercentage}%`;
        
        // Speak alert if zone changed or if in danger zone
        if (this.safetyZone !== zone || zone === 'DANGER') {
            this.speakAlert(zone, this.currentDistance, safeDistance);
        }
        
        this.safetyZone = zone;
    }
    
    /**
     * Speak alert message based on safety zone
     * @param {string} zone - Safety zone
     * @param {number} currentDistance - Current distance in feet
     * @param {number} safeDistance - Safe distance in feet
     */
    speakAlert(zone, currentDistance, safeDistance) {
        const now = Date.now();
        const currentDistanceRounded = Math.round(currentDistance);
        
        // Check cooldown (4 seconds between alerts, except for DANGER)
        if (zone !== 'DANGER' && now - this.lastVoiceAlert < 4000) {
            return;
        }
        
        this.lastVoiceAlert = now;
        
        // Cancel any ongoing speech
        this.speechSynthesis.cancel();
        
        let message = '';
        
        switch (zone) {
            case 'DANGER':
                message = `DANGER! Slow down immediately! You're only ${currentDistanceRounded} feet from the car ahead. Safe distance at ${this.currentSpeed} mph is ${safeDistance} feet.`;
                break;
            case 'WARNING':
                message = `Caution! Please slow down. You're ${currentDistanceRounded} feet from the car ahead. Increase distance to ${safeDistance} feet for safety.`;
                break;
            case 'SAFE':
                message = 'Good job! You\'re maintaining a safe following distance.';
                break;
            case 'VERY SAFE':
                message = 'Excellent! You\'re driving very safely.';
                break;
        }
        
        // Use Web Speech API
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Set voice to be more authoritative if available
        const voices = this.speechSynthesis.getVoices();
        if (voices.length > 0) {
            // Try to find a male voice for authority
            const preferredVoice = voices.find(voice => 
                voice.name.includes('Male') || 
                voice.name.includes('Daniel') || 
                voice.name.includes('Google US English Male'));
            
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
        }
        
        this.speechSynthesis.speak(utterance);
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new DriverCoach();
});