# AquaSense 💧

> **Real-Time IoT Water Quality Monitoring & Predictive Safety System**

[![Next.js](https://img.shields.io/badge/Next.js-16.2.2-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-yellow?logo=python)](https://www.python.org/)
[![AWS SNS Status](https://img.shields.io/badge/Amazon_SNS_Alerts-Under_Implementation-orange?logo=amazon-aws)](#-implementation-status)
[![Protocol: MQTT](https://img.shields.io/badge/Cloud_Protocol-MQTT-purple?logo=mqtt)](https://mqtt.org/)
[![Protocol: HTTP REST](https://img.shields.io/badge/Local_Protocol-HTTP_REST-green)](#-verified-api-endpoints)
[![ESP32](https://img.shields.io/badge/Hardware-ESP32%20%7C%20TFLite%20Micro-red?logo=espressif)](https://www.espressif.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Implementation & Communication Status](#-implementation--communication-status)
- [Problem Statement & Objectives](#-problem-statement--objectives)
- [System Architecture](#-system-architecture)
- [Communication Pathways: MQTT & Local HTTP REST](#-communication-pathways-mqtt--local-http-rest)
- [Verified Features vs. In-Progress Features](#-verified-features-vs-in-progress-features)
- [Technology Stack](#-technology-stack)
- [Directory Structure](#-directory-structure)
- [Hardware & Sensor Wiring](#-hardware--sensor-wiring)
- [Prerequisites](#-prerequisites)
- [Installation & Local Setup](#-installation--local-setup)
- [Environment Variables](#-environment-variables)
- [Verified API Endpoints](#-verified-api-endpoints)
- [Running & Building](#-running--building)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Deployment Options](#-deployment-options)
- [Security Audit & Best Practices](#-security-audit--best-practices)
- [Screenshots](#-screenshots)
- [Roadmap & Future Work](#-roadmap--future-work)
- [Author & Acknowledgments](#-author--acknowledgments)

---

## 🌊 Overview

**AquaSense** is an IoT water quality monitoring system engineered to bridge physical environmental telemetry, edge machine learning, and cloud-based automated safety alerting. The platform captures physical and chemical indicators of water potability (pH, Total Dissolved Solids, Turbidity, and Temperature) using an ESP32 microcontroller, evaluates safety against World Health Organization (WHO) standards, and visualizes live readings through a modern Next.js web application.

AquaSense is designed with **dual communication channels**:
1. **Local Network HTTP REST Server:** Hosted directly on the ESP32 (`:80/api/sensors`) providing low-latency, offline-capable telemetry access for the web dashboard.
2. **Cloud MQTT Telemetry Pipeline:** Streaming sensor payloads to **AWS IoT Core** over the `aquasense/sensors` topic, triggering **AWS IoT Rules** and serverless processing.

An automated **Amazon SNS notification service** is currently **under implementation** to deliver push warnings to subscribers via SMS and Email when unsafe water conditions are detected.

---

## 🚦 Implementation & Communication Status

The following matrix provides an evidence-based breakdown of all components and protocols in the repository:

| Component / Protocol | Status | Code Evidence & Verification Details |
| :--- | :---: | :--- |
| **Next.js Web Dashboard** | ✅ **Implemented** | [app/page.tsx](app/page.tsx), [components/dashboard.tsx](components/dashboard.tsx): Next.js 16 App Router with Tri-Mode source switching (Demo simulation, local ESP32 HTTP fetch, AWS Cloud endpoint). |
| **Local HTTP REST Server** | ✅ **Implemented** | [firmware/.../esp32_water_quality_complete.ino](firmware/esp32_water_quality_complete/esp32_water_quality_complete.ino#L24): ESP32 runs `WebServer server(80)` handling `GET /api/sensors` and CORS preflight `OPTIONS` requests. |
| **Multi-Sensor Acquisition** | ✅ **Implemented** | [esp32_water_quality_complete.ino#L44](firmware/esp32_water_quality_complete/esp32_water_quality_complete.ino#L44): Analog ADC reading for pH (GPIO 32), TDS (GPIO 33), Turbidity (GPIO 35), and 1-Wire DS18B20 temp (GPIO 4). |
| **Edge ML Inference Loop** | ✅ **Implemented** | [esp32_water_quality_complete.ino#L68](firmware/esp32_water_quality_complete/esp32_water_quality_complete.ino#L68): TensorFlow Lite Micro runtime with tensor arena allocation and MinMax normalization. *(Requires `water_model.h` binary array).* |
| **Cloud Protocol: MQTT** | 🟡 **Target Cloud Protocol** | [docs/aws/sns-setup.md#L10](docs/aws/sns-setup.md#L10), [aws/AWS_SNS.py#L8](aws/AWS_SNS.py#L8): Designated cloud ingestion protocol targeting AWS IoT Core topic `aquasense/sensors` and AWS IoT Rules. |
| **AWS SNS Alert Module (`AWS_SNS.py`)** | ✅ **Implemented (Module Level)** | [aws/AWS_SNS.py](aws/AWS_SNS.py): Standalone Python module with payload validation, `pH`/`ph` field normalization, `SAFE` status alert suppression, and Boto3 SNS publish wrapper. Tested with 100% passing offline unit tests. |
| **AWS IoT Rule & Lambda Persistence** | 🟡 **Documented / Reference** | [docs/aws/sns-setup.md#L113](docs/aws/sns-setup.md#L113): Reference `lambda_handler` for processing MQTT event payloads, DynamoDB persistence, and SNS trigger. |
| **Amazon SNS Live Delivery (SMS/Email)** | 🚧 **Under Implementation** | Production topic creation, subscriber email/phone confirmation, and live end-to-end alert verification are actively in progress. |

> [!IMPORTANT]
> **Amazon SNS Notification Integration is Under Implementation.** While the Python alert formatting and publishing logic (`aws/AWS_SNS.py`) is written and unit-tested offline with mocked AWS SDK calls, live end-to-end message delivery to email inboxes and mobile numbers requires completing active cloud topic provisioning and Lambda execution wiring.

---

## 🎯 Problem Statement & Objectives

### The Problem
Traditional laboratory water quality testing involves manual sample transport, lab backlogs, and multi-day delays. Water contamination—caused by pipeline corrosion, industrial runoff, or tank stagnation—can emerge abruptly. Without continuous monitoring, unsafe water may be consumed long before manual sampling detects contamination.

### System Objectives
1. **Continuous Real-Time Telemetry:** Collect live chemical and physical indicators (pH, TDS, turbidity, temperature) using accessible IoT hardware.
2. **Local Edge Availability:** Serve live readings directly over the local network via the ESP32 embedded web server, allowing monitoring even during internet outages.
3. **Edge Machine Learning:** Evaluate water potability on-device using a lightweight embedded model to classify readings into `SAFE` or `UNSAFE`.
4. **Cloud Telemetry via MQTT:** Transmit sensor records to AWS IoT Core over MQTT for scalable ingestion and serverless cloud storage.
5. **Cloud Incident Alerting (In Progress):** Dispatch instant push alerts via Amazon SNS to notify designated personnel when water quality deviates from safety limits.
6. **Accessible Web Visualization:** Provide an intuitive dashboard that categorizes complex sensor readings into clear health statuses based on WHO standards.

---

## 🏗️ System Architecture

The following diagram illustrates both the **implemented communication channels** (Local HTTP REST) and the **AWS Cloud MQTT pipeline** with Amazon SNS notifications labeled as **Under Implementation**:

```mermaid
flowchart TD
    subgraph Edge ["Hardware & Edge Layer (Implemented)"]
        S1["pH Sensor (GPIO 32)"] --> MCU["ESP32 Microcontroller"]
        S2["TDS Sensor (GPIO 33)"] --> MCU
        S3["Turbidity Sensor (GPIO 35)"] --> MCU
        S4["DS18B20 Temp Sensor (GPIO 4)"] --> MCU
        MCU --> TFLite["TensorFlow Lite Micro (Edge ML Loop)"]
        TFLite --> SafetyStatus{"Safety Evaluation (SAFE / UNSAFE)"}
        MCU --> WebServer["Local HTTP REST Server (:80/api/sensors)"]
    end

    subgraph Cloud ["AWS Cloud Pipeline (Target Architecture)"]
        MCU -.->|MQTT Telemetry Stream| IoTCore["AWS IoT Core"]
        IoTCore --> IoTRule["AWS IoT Topic Rule: 'aquasense/sensors'"]
        IoTRule --> Lambda["AWS Lambda Ingestion Function"]
        Lambda --> DynamoDB[("Amazon DynamoDB")]
        
        %% Notification path labeled Under Implementation
        Lambda -.->|Under Implementation: Unsafe Event| SNSModule["aws/AWS_SNS.py Module"]
        SNSModule -.->|Under Implementation: Publish Alert| SNS["Amazon SNS Topic"]
        SNS -.->|Under Implementation: SMS / Email| Subs["Subscribers (SMS & Email)"]
        
        DynamoDB -.-> APIGateway["AWS API Gateway"]
    end

    subgraph Client ["Frontend Web Dashboard (Implemented)"]
        UI["AquaSense Web App (Next.js 16)"]
        WebServer ==>|Local Network REST /api/sensors (Implemented)| UI
        APIGateway -.->|Cloud REST Endpoint| UI
        Mock["Demo Mode Simulation Engine"] -.->|Simulated Feed| UI
    end

    classDef inProgress fill:#fff3cd,stroke:#e0a800,stroke-width:2px,stroke-dasharray: 5 5;
    class SNSModule,SNS,Subs inProgress;
```

---

## 🔄 Communication Pathways: MQTT & Local HTTP REST

AquaSense is designed to support two distinct communication channels:

```
                          ┌────────────────────────┐
                          │   ESP32 Microcontroller │
                          └───────────┬────────────┘
                                      │
            ┌─────────────────────────┴─────────────────────────┐
            │                                                   │
            ▼                                                   ▼
   [Path A: Local HTTP REST]                           [Path B: Cloud MQTT]
   • Protocol: HTTP/1.1 on Port 80                     • Protocol: MQTT on Port 8883 (MQTTS)
   • Endpoint: GET /api/sensors                        • Target: AWS IoT Core
   • Scope: Local Wi-Fi Network                        • Topic: aquasense/sensors
   • Format: JSON with CORS Headers                    • Format: JSON Telemetry Payload
   • Status: Implemented in Firmware                   • Trigger: AWS IoT Topic Rule -> Lambda
   • Consumer: Next.js Dashboard ("Live ESP32")        • Status: Target Cloud Architecture
```

### Path A: Local HTTP REST Server (Implemented)
- The ESP32 hosts a lightweight `WebServer` on port 80.
- Serves real-time readings directly to browsers on the same local subnet without requiring internet access or cloud infrastructure.
- Endpoint includes full CORS support (`Access-Control-Allow-Origin: *`).

### Path B: Cloud MQTT Telemetry Stream (Cloud Architecture)
- Designed to publish telemetry to **AWS IoT Core** over MQTT.
- Telemetry published to the topic `aquasense/sensors` is processed by an **AWS IoT Topic Rule**.
- The IoT Rule triggers an **AWS Lambda function** that persists records to DynamoDB and evaluates whether to call `AWS_SNS.py` for alert dispatch.

---

## ✨ Verified Features vs. In-Progress Features

### Implemented & Verified in Code
- **Multi-Sensor Acquisition:**
  - **pH Level:** Analog reading converted to a 0–14 pH scale with linear voltage mapping.
  - **Total Dissolved Solids (TDS):** Analog measurement converted to ppm (parts per million).
  - **Turbidity:** Analog clarity sensor measuring suspended particles in NTU.
  - **Water Temperature:** Waterproof 1-Wire DS18B20 probe measuring °C (-55°C to 125°C).
- **Embedded Web Server:**
  - Serves JSON telemetry at `/api/sensors` with full CORS preflight headers.
  - Serves an embedded HTML diagnostic status page at `/`.
- **Tri-Mode Next.js Web Dashboard:**
  - **Demo Mode:** Simulates realistic sensor metrics with variance for instant evaluation without hardware.
  - **Live ESP32 Mode:** Polls the local ESP32 IP address over HTTP at 5-second intervals.
  - **AWS Cloud Mode:** Configurable to fetch telemetry aggregated through an AWS API Gateway endpoint.
- **Metric Health Classification:**
  - Color-coded badges evaluate readings against WHO standards:
    - **pH:** 6.5–8.5 (Safe), 6.0–6.5 / 8.5–9.0 (Warning), Outside (Danger).
    - **TDS:** ≤ 300 ppm (Safe), ≤ 500 ppm (Warning), > 500 ppm (Danger).
    - **Turbidity:** ≤ 5 NTU (Safe), ≤ 10 NTU (Warning), > 10 NTU (Danger).
    - **Temperature:** 10–30°C (Safe), 5–10°C / 30–35°C (Warning), Outside (Danger).
- **Educational Pages:**
  - `/about`: Sensor physics, measurement ranges, and WHO drinking water criteria.
  - `/cleaning-guide`: Tank cleaning and chlorination procedures.
  - `/contact`: Inquiry and feedback interface.
- **AWS SNS Python Service Module (`aws/AWS_SNS.py`):**
  - Modular implementation of payload validation, casing normalization (`pH` vs `ph`), suppression on `SAFE`, and alert body formatting.
  - Fully covered by 9 offline unit tests using `unittest.mock`.

### In-Progress / Under Implementation
- 🚧 **Firmware MQTT Client:** Implementing `PubSubClient` / `WiFiClientSecure` on the ESP32 to publish MQTT telemetry directly to AWS IoT Core topic `aquasense/sensors`.
- 🚧 **AWS IoT Rule & Lambda Deployment:** Provisioning the cloud SQL rule and deploying the Lambda function that invokes `AWS_SNS.py`.
- 🚧 **DynamoDB Telemetry Storage:** Persisting incoming sensor records to Amazon DynamoDB for historical tracking.
- 🚧 **Live Amazon SNS Alerts:** Creating production SNS topics, subscribing operational emails/phone numbers, confirming subscriptions, and conducting live alert verification.

---

## 💻 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [Next.js 16.2.2](https://nextjs.org/) (App Router), [React 19.2.0](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling & UI** | [Tailwind CSS 4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/), [Sonner](https://sonner.emilkowal.ski/) |
| **Edge Hardware / Firmware** | ESP32 MCU, C++/Arduino, [TensorFlow Lite Micro](https://www.tensorflow.org/lite/microcontrollers), [DallasTemperature](https://github.com/milesburton/Arduino-Temperature-Control-Library), [OneWire](https://www.pjrc.com/teensy/td_libs_OneWire.html) |
| **Communication Protocols** | **HTTP/1.1 REST** (Local WebServer, Implemented), **MQTT** (AWS IoT Core Ingestion, Target Architecture) |
| **Cloud Microservices** | AWS Lambda (Python 3.10+), Amazon SNS *(Under Implementation)*, AWS IoT Core *(Target)*, AWS API Gateway, [Boto3](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html) |
| **Containerization** | Docker (Multi-stage Alpine Node build) |
| **Testing** | Python `unittest`, `unittest.mock` |

---

## 📁 Directory Structure

```text
AquaSense-main/
├── .env.example                     # Sanitized configuration template with placeholders
├── .gitignore                       # Multi-stack Git exclusions (Node, Python, C++, secrets)
├── components.json                  # Shadcn UI configuration
├── next.config.mjs                  # Next.js configuration
├── package.json                     # Node.js dependencies and build scripts
├── tsconfig.json                    # TypeScript compiler configuration
├── app/                             # Next.js App Router
│   ├── layout.tsx                   # Root layout with ThemeProvider and Navbar
│   ├── page.tsx                     # Main page rendering the Dashboard
│   ├── globals.css                  # Theme tokens, styles, and animation utilities
│   ├── about/                       # Sensor specifications and WHO standards
│   │   └── page.tsx
│   ├── cleaning-guide/              # Water storage tank cleaning guide
│   │   └── page.tsx
│   └── contact/                     # Contact and feedback page
│       └── page.tsx
├── aws/                             # AWS Notification Service Module
│   ├── AWS_SNS.py                   # Standalone SNS publishing logic & input validator
│   ├── requirements.txt             # Python dependencies (boto3)
│   └── tests/                       # SNS Unit Test Suite
│       └── test_aws_sns.py          # 9 Mocked test cases (100% offline verification)
├── components/                      # UI Components
│   ├── dashboard.tsx                # Central dashboard with tri-mode data source selector
│   ├── sensor-card.tsx              # Metric cards with threshold evaluation
│   ├── prediction-card.tsx          # ML potability badge & confidence indicator
│   ├── navbar.tsx                   # Responsive navigation bar
│   ├── footer.tsx                   # Application footer
│   ├── theme-provider.tsx           # Dark/Light mode theme provider
│   ├── docker/                      # Container configuration
│   │   ├── .dockerignore
│   │   └── Dockerfile               # Multi-stage production container build
│   └── ui/                          # Radix UI primitives
├── docs/                            # Architectural documentation & deployment guides
│   └── aws/
│       └── sns-setup.md             # AWS Console configuration guide for Amazon SNS
├── firmware/                        # Microcontroller source code
│   └── esp32_water_quality_complete/
│       └── esp32_water_quality_complete.ino # ESP32 Arduino sketch with REST server
├── hooks/                           # Custom React hooks (use-mobile, use-toast)
├── lib/                             # Shared utility functions (utils.ts)
├── public/                          # Static brand assets, icons, and svgs
└── tests/                           # Ad-hoc integration tests
    └── test-fetch.js                # AWS API Gateway endpoint ping utility
```

---

## 🔌 Hardware & Sensor Wiring

The firmware targets an **ESP32 DevKit** board with the following pin assignments:

| Sensor Module | Physical Interface | ESP32 GPIO | Description |
| :--- | :--- | :--- | :--- |
| **DS18B20 Temperature** | Data (with 4.7kΩ pull-up) | **GPIO 4** | 1-Wire Digital interface |
| **Analog pH Sensor** | Analog Output (Po) | **GPIO 32** | ADC1 input (0–3.3V) |
| **Analog TDS Meter** | Analog Output | **GPIO 33** | ADC1 input (0–3.3V) |
| **Turbidity Sensor** | Analog Output | **GPIO 35** | ADC1 input (0–3.3V) |
| **Power Supply** | VCC / GND | **3.3V / 5V / GND** | Common ground with ESP32 |

---

## ⚙️ Prerequisites

- **Web Dashboard:** [Node.js](https://nodejs.org/) v20.x or v22.x LTS and `npm`
- **Cloud Notification Module & Tests:** [Python 3.10+](https://www.python.org/)
- **Microcontroller Firmware:** [Arduino IDE](https://www.arduino.cc/en/software) with the ESP32 board package
- **Containerization (Optional):** [Docker Desktop](https://www.docker.com/)

---

## 🚀 Installation & Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/AquaSense.git
cd AquaSense
```

### 2. Configure Environment Variables
Copy the template configuration file:
```powershell
# On Windows PowerShell
copy .env.example .env.local
```

### 3. Setup & Run the Next.js Web Dashboard
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables

The project includes [.env.example](.env.example) as a template. Do not commit `.env` or `.env.local` files containing real secrets.

| Variable Name | Required | Default / Fallback | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_AWS_API_URL` | No | `https://xkf4jza5ob.execute-api.ap-south-1.amazonaws.com` | AWS API Gateway endpoint for cloud telemetry. |
| `NEXT_PUBLIC_DEFAULT_ESP32_URL` | No | `http://192.168.1.100/api/sensors` | Local network IP of the ESP32 HTTP server. |
| `SNS_TOPIC_ARN` | Yes (for SNS) | *None* | Target Amazon SNS Topic ARN *(Under implementation)*. |
| `AWS_REGION` | Yes (for SNS) | `ap-south-1` | Target AWS deployment region. |
| `AWS_ACCESS_KEY_ID` | Local testing only | *None* | AWS Access Key ID (only needed for local CLI tests). |
| `AWS_SECRET_ACCESS_KEY` | Local testing only | *None* | AWS Secret Access Key (only needed for local CLI tests). |

---

## 📡 Verified API Endpoints

### 1. Local ESP32 Embedded HTTP Server (Path A)
Hosted directly by the ESP32 microcontroller when connected to local Wi-Fi:

- **`GET /api/sensors`**
  - **Headers:** `Accept: application/json`
  - **Response Status:** `200 OK`
  - **Payload Structure:**
    ```json
    {
      "pH": 7.35,
      "tds": 240,
      "turbidity": 2.1,
      "temperature": 23.4,
      "prediction": "SAFE",
      "confidence": 95.2
    }
    ```
- **`OPTIONS /api/sensors`**
  - Returns CORS headers (`Access-Control-Allow-Origin: *`) allowing browser fetch from any host.
- **`GET /`**
  - Serves an embedded lightweight HTML diagnostic page.

### 2. AWS Cloud Telemetry API Gateway
- **`GET https://<api-id>.execute-api.<region>.amazonaws.com`**
  - Endpoint for retrieving latest or aggregated sensor records.

---

## 🛠️ Running & Building

### Web Application Commands
```bash
# Start Next.js development server
npm run dev

# Run ESLint validation
npm run lint

# Build optimized production bundle
npm run build

# Start production server
npm start
```

### Docker Container Build
```bash
# Build the Docker image
docker build -t aquasense:latest -f components/docker/Dockerfile .

# Run the container locally on port 3000
docker run -p 3000:3000 aquasense:latest
```

---

## 🧪 Testing & Quality Assurance

### AWS SNS Module Unit Tests
The notification utility in `aws/AWS_SNS.py` is accompanied by an offline unit test suite:

```powershell
# Run the test suite via Python unittest
python -m unittest discover -s aws/tests -p "test_*.py"
```

**Verified Test Scenarios (9/9 Passing):**
- ✅ `test_valid_unsafe_payload_publishes_notification`: Verifies that a valid `UNSAFE` payload triggers an SNS publish call with correct attributes.
- ✅ `test_safe_payload_does_not_publish_notification`: Verifies that `SAFE` readings suppress publication (zero SNS network calls).
- ✅ `test_missing_device_id_fails_validation`: Rejects payloads without a valid `device_id`.
- ✅ `test_missing_prediction_fails_validation`: Rejects payloads missing prediction values or containing ambiguous statuses.
- ✅ `test_non_dict_payload_fails_gracefully`: Gracefully handles malformed input structures.
- ✅ `test_ph_field_name_normalization`: Normalizes both `pH` and `ph` field naming conventions.
- ✅ `test_missing_topic_arn_returns_configuration_error`: Returns `CONFIGURATION_ERROR` when no topic ARN is provided.
- ✅ `test_boto3_client_exception_returns_publish_failed`: Handles AWS SDK exceptions gracefully without raising unhandled errors.
- ✅ `test_environment_variable_fallback_for_topic_arn`: Validates topic ARN resolution from the `SNS_TOPIC_ARN` environment variable.

---

## 🚢 Deployment Options

### 1. Vercel (Next.js Frontend)
1. Import the repository into [Vercel](https://vercel.com).
2. Configure environment variables if using custom endpoints (`NEXT_PUBLIC_AWS_API_URL`).
3. Deploy with standard Next.js build presets.

### 2. Containerized Deployment (Docker)
Build and run the production image using the multi-stage Alpine build under `components/docker/Dockerfile`.

### 3. AWS Lambda & Amazon SNS (Planned / In-Progress)
Detailed manual AWS Console setup instructions are provided in [`docs/aws/sns-setup.md`](docs/aws/sns-setup.md) for configuring topics, IAM policies, and Lambda environment variables once cloud deployment commences.

---

## 🔒 Security Audit & Best Practices

1. **Zero Hardcoded Credentials:**
   - No AWS access keys, secret keys, or private tokens are hardcoded in the codebase.
   - The Python SNS module relies on standard Boto3 SDK credential resolution (e.g., IAM roles in Lambda).
2. **Sanitized Configuration:**
   - ESP32 Wi-Fi configuration uses placeholders (`YOUR_WIFI_SSID`, `YOUR_WIFI_PASSWORD`).
   - A sanitized [.env.example](.env.example) template is provided for local setup.
3. **Structured Logging:**
   - `AWS_SNS.py` avoids logging sensitive runtime memory or dumping production stack traces.
4. **Input Validation:**
   - Strict validation rejects malformed sensor payloads before making AWS API calls.
5. **Robust `.gitignore` Exclusions:**
   - Prevents accidental tracking of `.env` files, `.pem` keys, Python `__pycache__`, and firmware build artifacts.

---

## 📸 Screenshots

| Live Sensor Dashboard | Water Potability Classification |
| :---: | :---: |
| ![Dashboard Screenshot](public/placeholder.svg) | ![Prediction Card Screenshot](public/placeholder.svg) |

| Cleaning & Sanitation Guide | Mobile Responsive View |
| :---: | :---: |
| ![Cleaning Guide Screenshot](public/placeholder.svg) | ![Mobile View Screenshot](public/placeholder.svg) |

---

## 🔮 Roadmap & Future Work

- [ ] **Firmware MQTT Integration:** Complete `PubSubClient` integration on the ESP32 to publish live telemetry to AWS IoT Core topic `aquasense/sensors` over port 8883 (MQTTS).
- [ ] **Complete Amazon SNS Integration:**
  - Create and configure the production Amazon SNS Topic (`AquaSenseWaterQualityAlerts`).
  - Configure operational email and SMS subscriber endpoints with subscription confirmation.
  - Deploy the AWS Lambda ingestion function and connect it to `AWS_SNS.py`.
  - Conduct end-to-end integration testing from sensor event to email/SMS inbox delivery.
- [ ] **DynamoDB Telemetry Persistence:** Store historical sensor time-series records in DynamoDB.
- [ ] **Historical Charts:** Add interactive time-series charts using Recharts for 24-hour and 7-day water quality trends.
- [ ] **Automated CI/CD:** GitHub Actions workflow to run linting, Next.js build, and Python unit tests on every pull request.

---

## 👤 Author & Acknowledgments

- **Lead Developer:** [Your Name / Organization](https://github.com/)
- **Contact:** [your-email@example.com](mailto:your-email@example.com)
- **LinkedIn:** [Your LinkedIn Profile](https://linkedin.com/in/)

### Standards & References
- Water Quality Standards referenced from the [World Health Organization (WHO) Guidelines for Drinking-water Quality](https://www.who.int/publications/i/item/9789241549950).
- Embedded machine learning inference powered by [TensorFlow Lite for Microcontrollers](https://www.tensorflow.org/lite/microcontrollers).
- Cloud alerting architecture designed for [Amazon Simple Notification Service](https://aws.amazon.com/sns/).

---

<p align="center">
  Made with ❤️ for safe drinking water accessibility.
</p>
