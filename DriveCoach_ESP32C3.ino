/*
  DriveCoach - XIAO ESP32C3 Firmware
  
  This sketch configures the XIAO ESP32C3 to read distance from an HC-SR04 ultrasonic sensor
  and transmit the data via Bluetooth LE to the Drivesist.ai web application.
  
  Hardware:
  - XIAO ESP32C3
 - HC-SR04 Ultrasonic Sensor
  
  Connections:
  - HC-SR04 VCC -> 5V
  - HC-SR04 GND -> GND
  - HC-SR04 TRIG -> D2 (GPIO2)
  - HC-SR04 ECHO -> D3 (GPIO3)
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// HC-SR04 Pins - Using GPIO pin numbers for ESP32C3
const int TRIG_PIN = 2;  // D2 (GPIO2) on XIAO ESP32C3
const int ECHO_PIN = 3;  // D3 (GPIO3) on XIAO ESP32C3

// Bluetooth LE UUIDs
#define SERVICE_UUID        "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define CHARACTERISTIC_UUID "6e400003-b5a3-f393-e0a9-e50e24dcca9e"

// Global variables
BLEServer *pServer = NULL;
BLECharacteristic *pCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;
unsigned long previousMillis = 0;
const long interval = 100;  // Interval between readings (100ms = 10 readings per second)

// Server callbacks
class ServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    Serial.println("Device connected");
  };

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    Serial.println("Device disconnected");
  }
};

void setup() {
  // Initialize serial communication
  Serial.begin(115200);
  Serial.println("DriveCoach - Distance Sensor Starting...");
  
  // Configure HC-SR04 pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  // Initialize Bluetooth LE
  BLEDevice::init("DriveCoach");
  
  // Create the BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());
  
  // Create the BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);
  
  // Create a BLE Characteristic
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_NOTIFY | BLECharacteristic::PROPERTY_READ
                    );
                      
  // Create a BLE Descriptor
  pCharacteristic->addDescriptor(new BLE2902());
  
  // Start the service
  pService->start();
  
  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);  // Functions that help with iPhone connections issue
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  
  Serial.println("DriveCoach is ready! Waiting for connections...");
}

void loop() {
  unsigned long currentMillis = millis();
  
  // Check if it's time to read the sensor
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    
    // Read distance from HC-SR04
    int distance = readDistance();
    
    // If connected, send the distance
    if (deviceConnected) {
      // Create JSON string with distance in cm
      String jsonData = "{\"cm\":";
      jsonData += distance;
      jsonData += "}";
      
      // Send the data
      pCharacteristic->setValue(jsonData.c_str());
      pCharacteristic->notify();
      
      // Debug output
      Serial.print("Distance: ");
      Serial.print(distance);
      Serial.println(" cm");
    }
  }
  
  // Disconnection handling
  if (!deviceConnected && oldDeviceConnected) {
    delay(500); // Give the Bluetooth stack time to get ready
    pServer->startAdvertising(); // Restart advertising
    Serial.println("Started advertising again");
    oldDeviceConnected = deviceConnected;
  }
  
  // Connection handling
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }
}

/**
 * Read distance from HC-SR04 ultrasonic sensor
 * 
 * @return Distance in centimeters
 */
int readDistance() {
  // Clear the trigger pin
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  
  // Set the trigger pin HIGH for 10 microseconds
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Read the echo pin, returns the sound wave travel time in microseconds
  // Add 30ms timeout to prevent blocking if no echo is received
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  
  // Calculate the distance
  int distance = duration * 0.034 / 2;
  
  // Limit the range to avoid erratic readings
  if (distance > 400) {
    distance = 400;  // HC-SR04 max reliable range is about 4 meters
  }
  if (distance <= 0) {
    distance = 1;    // Avoid zero or negative values
  }
  
  return distance;
}