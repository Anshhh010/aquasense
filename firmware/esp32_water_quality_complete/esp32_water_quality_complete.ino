#include <WiFi.h>
#include <WebServer.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <TensorFlowLite_ESP32.h>
#include "tensorflow/lite/micro/all_ops_resolver.h"
#include "tensorflow/lite/micro/micro_interpreter.h"
#include "tensorflow/lite/schema/schema_generated.h"
#include "water_model.h"  // Your TFLite model header file

// ========== WiFi Configuration ==========
const char* ssid = "YOUR_WIFI_SSID";         // <-- Change this
const char* password = "YOUR_WIFI_PASSWORD"; // <-- Change this

// ========== Sensor Pin Configuration ==========
#define ONE_WIRE_BUS 4    // DS18B20 Temperature sensor
#define PH_PIN 32         // pH sensor analog pin
#define TDS_PIN 33        // TDS sensor analog pin
#define TURBIDITY_PIN 35  // Turbidity sensor analog pin

// ========== Sensor Objects ==========
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensor(&oneWire);
WebServer server(80);

// ========== TensorFlow Lite Setup ==========
constexpr int kTensorArenaSize = 8 * 1024;
uint8_t tensor_arena[kTensorArenaSize];
tflite::AllOpsResolver resolver;
const tflite::Model* model = nullptr;
tflite::MicroInterpreter* interpreter = nullptr;
TfLiteTensor* input = nullptr;
TfLiteTensor* output = nullptr;

// ========== Sensor Data ==========
float pH = 0;
float tds = 0;
float turbidity = 0;
float temperature = 0;
String prediction = "UNKNOWN";
float confidence = 0;

// ========== Sensor Reading Function ==========
void readWaterSensors() {
  // Read pH Sensor (calibrate these values for your sensor)
  int pHraw = analogRead(PH_PIN);
  float voltage = pHraw * (3.3 / 4095.0);
  pH = 3.5 * voltage;  // Adjust calibration factor as needed
  
  // Read TDS Sensor
  int TDSraw = analogRead(TDS_PIN);
  float tdsVoltage = TDSraw * (3.3 / 4095.0);
  tds = tdsVoltage * 0.5 * 1000;
  
  // Read Turbidity Sensor
  int turbRaw = analogRead(TURBIDITY_PIN);
  float turbVoltage = turbRaw * (3.3 / 4095.0);
  turbidity = (2.5 - turbVoltage) * 1000;
  if (turbidity < 0) turbidity = 0;
  
  // Read Temperature
  tempSensor.requestTemperatures();
  temperature = tempSensor.getTempCByIndex(0);
  if (temperature == -127.0) temperature = 25.0; // Default if sensor error
}

// ========== ML Prediction & Safety Evaluation Function ==========
void evaluateWaterSafety() {
  if (interpreter == nullptr) {
    prediction = "MODEL_ERROR";
    confidence = 0;
    return;
  }
  
  // Normalize inputs (adjust based on your training data normalization)
  // Example: MinMax scaling - adjust min/max values based on your dataset
  float ph_normalized = (pH - 0) / (14 - 0);           // pH range 0-14
  float tds_normalized = (tds - 0) / (1000 - 0);       // TDS range 0-1000
  float turb_normalized = (turbidity - 0) / (1000 - 0); // Turbidity range 0-1000
  float temp_normalized = (temperature - 0) / (50 - 0); // Temp range 0-50
  
  // Set input tensor values
  input->data.f[0] = ph_normalized;
  input->data.f[1] = tds_normalized;
  input->data.f[2] = turb_normalized;
  input->data.f[3] = temp_normalized;
  
  // Run inference
  TfLiteStatus invoke_status = interpreter->Invoke();
  
  if (invoke_status != kTfLiteOk) {
    prediction = "INFERENCE_ERROR";
    confidence = 0;
    return;
  }
  
  // Get output (assuming binary classification: 0=UNSAFE, 1=SAFE)
  float output_value = output->data.f[0];
  
  if (output_value >= 0.5) {
    prediction = "SAFE";
    confidence = output_value * 100;
  } else {
    prediction = "UNSAFE";
    confidence = (1 - output_value) * 100;
  }
}

// ========== API Endpoint Handlers ==========
void handleSensorDataRequest() {
  // CORS headers for web browser access
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  
  // Build JSON response
  String json = "{";
  json += "\"pH\":" + String(pH, 2) + ",";
  json += "\"tds\":" + String(tds, 0) + ",";
  json += "\"turbidity\":" + String(turbidity, 1) + ",";
  json += "\"temperature\":" + String(temperature, 1) + ",";
  json += "\"prediction\":\"" + prediction + "\",";
  json += "\"confidence\":" + String(confidence, 1);
  json += "}";
  
  server.send(200, "application/json", json);
}

void handleCorsPreflight() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(204);
}

void handleRootDashboard() {
  String html = "<html><head><title>Water Quality Monitor</title></head>";
  html += "<body style='font-family:Arial;padding:20px;'>";
  html += "<h1>Water Quality Monitor - ESP32</h1>";
  html += "<p><strong>pH:</strong> " + String(pH, 2) + "</p>";
  html += "<p><strong>TDS:</strong> " + String(tds, 0) + " ppm</p>";
  html += "<p><strong>Turbidity:</strong> " + String(turbidity, 1) + " NTU</p>";
  html += "<p><strong>Temperature:</strong> " + String(temperature, 1) + " C</p>";
  html += "<p><strong>Prediction:</strong> " + prediction + " (" + String(confidence, 1) + "%)</p>";
  html += "<p><a href='/api/sensors'>View JSON API</a></p>";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

// ========== Setup ==========
void setup() {
  Serial.begin(115200);
  Serial.println("\n=== WATER QUALITY MONITOR ===");
  
  // Initialize temperature sensor
  tempSensor.begin();
  
  // Initialize TensorFlow Lite model
  Serial.println("Loading TensorFlow Lite model...");
  model = tflite::GetModel(water_model);  // 'water_model' from water_model.h
  
  if (model->version() != TFLITE_SCHEMA_VERSION) {
    Serial.println("Model schema version mismatch!");
  } else {
    static tflite::MicroInterpreter static_interpreter(
      model, resolver, tensor_arena, kTensorArenaSize);
    interpreter = &static_interpreter;
    
    if (interpreter->AllocateTensors() != kTfLiteOk) {
      Serial.println("Failed to allocate tensors!");
    } else {
      input = interpreter->input(0);
      output = interpreter->output(0);
      Serial.println("TensorFlow Lite model loaded successfully!");
    }
  }
  
  // Connect to WiFi
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.println("Use this IP in your web dashboard!");
  } else {
    Serial.println("\nWiFi Connection Failed! Continuing without network...");
  }
  
  // Setup web server routes
  server.on("/", HTTP_GET, handleRootDashboard);
  server.on("/api/sensors", HTTP_GET, handleSensorDataRequest);
  server.on("/api/sensors", HTTP_OPTIONS, handleCorsPreflight);
  server.begin();
  Serial.println("HTTP server started on port 80");
}

// ========== Main Loop ==========
void loop() {
  // Read all sensors
  readWaterSensors();
  
  // Run ML prediction & evaluate water safety
  evaluateWaterSafety();
  
  // Handle web requests
  server.handleClient();
  
  // Print to Serial Monitor
  Serial.print("pH: "); Serial.print(pH, 2);
  Serial.print(" | TDS: "); Serial.print(tds, 0); Serial.print(" ppm");
  Serial.print(" | Turb: "); Serial.print(turbidity, 1); Serial.print(" NTU");
  Serial.print(" | Temp: "); Serial.print(temperature, 1); Serial.print(" C");
  Serial.print(" | Pred: "); Serial.print(prediction);
  Serial.print(" ("); Serial.print(confidence, 1); Serial.println("%)");
  
  delay(1000);
}
