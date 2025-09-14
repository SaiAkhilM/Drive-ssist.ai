# Drivesist.ai - Real-Time Following Distance Safety System

## Project Overview

Drivesist.ai is a web application designed to provide real-time voice feedback on safe following distances while driving. It connects to an ultrasonic sensor via Bluetooth to measure the distance to the vehicle ahead and provides audio and visual alerts based on the current speed and safe following distance requirements.

## Features

- **Bluetooth Connectivity**: Connects to an HC-SR04 ultrasonic sensor via XIAO ESP32C3 microcontroller
- **Real-time Distance Monitoring**: Converts sensor readings from centimeters to feet with data smoothing
- **Speed-Based Safety Calculations**: Determines safe following distances based on current speed
- **Voice Feedback System**: Provides audio alerts using Web Speech API
- **Visual Safety Dashboard**: Speedometer-style UI with color-coded safety zones
- **Responsive Design**: Optimized for mobile/tablet use in a vehicle

## Technical Implementation

### Bluetooth Connection

The application connects to a Bluetooth device named "DriveCoach" with the following specifications:
- Service UUID: "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
- Characteristic UUID: "6e400003-b5a3-f393-e0a9-e50e24dcca9e"

The sensor sends JSON data in the format: `{"cm": 45}` which is then converted to feet.

### Safe Distance Calculation

The application uses the following safe following distance chart:

| Speed (mph) | Safe Distance (feet) | Time (seconds) |
|-------------|----------------------|----------------|
| 25          | 110                  | 3.0            |
| 30          | 132                  | 3.0            |
| 35          | 154                  | 3.0            |
| 40          | 176                  | 3.0            |
| 45          | 220                  | 3.5            |
| 50          | 245                  | 3.5            |
| 55          | 270                  | 3.5            |
| 60          | 290                  | 3.5            |
| 65          | 315                  | 4.0            |
| 70          | 340                  | 4.0            |
| 75          | 365                  | 4.0            |
| 80          | 390                  | 4.0            |

### Safety Zones

The application classifies the current following distance into four safety zones:

1. **DANGER** (Red): Less than 40% of the safe distance
2. **WARNING** (Yellow/Orange): Between 40% and 70% of the safe distance
3. **SAFE** (Green): Between 70% and 150% of the safe distance
4. **VERY SAFE** (Dark Green): More than 150% of the safe distance

### Voice Feedback

The application provides voice alerts based on the current safety zone:

- **DANGER**: "DANGER! Slow down immediately! You're only [X] feet from the car ahead. Safe distance at [speed] mph is [safe_distance] feet."
- **WARNING**: "Caution! Please slow down. You're [X] feet from the car ahead. Increase distance to [safe_distance] feet for safety."
- **SAFE**: "Good job! You're maintaining a safe following distance."
- **VERY SAFE**: "Excellent! You're driving very safely."

Voice alerts have a 4-second cooldown between messages (except for DANGER alerts, which are immediate).

## Setup Instructions

### Hardware Requirements

- XIAO ESP32C3 microcontroller
- HC-SR04 ultrasonic sensor
- Power source for the microcontroller (battery or USB)

### Software Requirements

- Modern web browser with Web Bluetooth API support (Chrome, Edge, or Opera)
- Web server for hosting the application (or run locally)

### Installation

1. Clone this repository to your local machine or web server
2. Open `index.html` in a compatible web browser
3. Click the "Connect to DriveCoach" button to establish a Bluetooth connection
4. Set your current speed using the input field or +/- buttons
5. Mount the sensor in your vehicle facing forward to measure the distance to the vehicle ahead

## Usage

1. Start the application and connect to the DriveCoach sensor
2. Set your current speed (25-80 mph)
3. The application will display the current distance to the vehicle ahead and provide voice alerts based on the safety zone
4. Adjust your following distance according to the feedback

## Browser Compatibility

The Web Bluetooth API is required for this application to function. Currently supported browsers include:

- Google Chrome (desktop and Android)
- Microsoft Edge
- Opera

Note: Safari and Firefox do not currently support the Web Bluetooth API.

## License

This project is created for demonstration purposes only.

## Disclaimer

This application is intended as a supplementary safety tool and should not replace attentive driving practices. Always maintain focus on the road and follow all traffic laws and safety guidelines.