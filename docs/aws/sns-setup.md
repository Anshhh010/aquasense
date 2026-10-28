# Amazon SNS Setup & Integration Guide for AquaSense

This guide explains how to manually configure **Amazon Simple Notification Service (Amazon SNS)** in the AWS Management Console and integrate it with the AquaSense IoT water quality monitoring pipeline.

---

## 1. Architecture & Alert Workflow

```
[ESP32 Water Sensors] 
       │ (MQTT Telemetry)
       ▼
[AWS IoT Core] 
       │ (Topic Rule: 'aquasense/sensors')
       ▼
[AWS Lambda Ingestion Function] 
       │ 
       ├── Evaluates Safety Status (SAFE vs UNSAFE)
       ├── Persists Reading to Amazon DynamoDB
       │
       └── If UNSAFE ──► [aws/AWS_SNS.py Module]
                                │
                                ▼
                       [Amazon SNS Topic]
                    (AquaSenseWaterQualityAlerts)
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
            [Email Notification]    [SMS Alert / Mobile]
```

---

## 2. Step-by-Step AWS Console Configuration

### Step 1: Open Amazon SNS Console
1. Log in to the [AWS Management Console](https://console.aws.amazon.com/).
2. Select your target deployment Region (e.g., `ap-south-1` Asia Pacific (Mumbai) or `us-east-1` US East (N. Virginia)).
3. In the search bar at the top, enter **SNS** and select **Simple Notification Service**.

### Step 2: Create a Standard SNS Topic
1. In the left navigation pane, choose **Topics**.
2. Click the orange **Create topic** button.
3. Under **Details**:
   - **Type:** Select **Standard** (Standard topics support high throughput and SMS/Email subscribers).
   - **Name:** Enter `AquaSenseWaterQualityAlerts`.
   - **Display name (optional):** Enter `AquaSense`. *(This appears as the sender name in SMS alerts and email prefixes).*
4. Under **Encryption** (optional, recommended):
   - Leave default SSE or enable AWS KMS key encryption.
5. Click **Create topic** at the bottom of the page.

### Step 3: Copy the Topic ARN
1. Once created, view the **Topic details** page.
2. Locate the **ARN** (Amazon Resource Name). It follows this pattern:
   ```text
   arn:aws:sns:<your-region>:<your-account-id>:AquaSenseWaterQualityAlerts
   ```
3. Copy this ARN. You will provide it as the `SNS_TOPIC_ARN` environment variable to your AWS Lambda function.

### Step 4: Create Subscriptions (Email & SMS)
Subscribers must register to receive alerts when an unsafe water condition occurs:

1. On the topic details page, select the **Subscriptions** tab and click **Create subscription**.
2. **For Email Alerts:**
   - **Protocol:** Select `Email`.
   - **Endpoint:** Enter the operational recipient email address (e.g., `water-ops@example.com`).
   - Click **Create subscription**.
   - **Confirmation Required:** AWS will immediately send an email titled *"AWS Notification - Subscription Confirmation"*. The recipient **must click the "Confirm subscription" link** inside that email. The subscription status in the console will update from `PendingConfirmation` to `Confirmed`.
3. **For SMS Alerts (Optional):**
   - Click **Create subscription**.
   - **Protocol:** Select `SMS`.
   - **Endpoint:** Enter the mobile phone number in E.164 international format (e.g., `+12025550199` or `+919876543210`).
   - Click **Create subscription** (SMS subscriptions are immediately confirmed).

---

## 3. IAM Permissions for AWS Lambda

The AWS Lambda function that processes IoT sensor readings must have explicit permission to publish messages to your SNS topic.

### Least-Privilege IAM Policy
Attach the following inline policy to your AWS Lambda execution role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AquaSenseAllowSNSPublish",
      "Effect": "Allow",
      "Action": "sns:Publish",
      "Resource": "arn:aws:sns:<REGION>:<ACCOUNT_ID>:AquaSenseWaterQualityAlerts"
    }
  ]
}
```

> **Security Note:** Replace `<REGION>` and `<ACCOUNT_ID>` with your actual AWS region and account ID. Never use `"Resource": "*"` in production.

---

## 4. Lambda Environment Variables

In the AWS Lambda Console, navigate to your function > **Configuration** > **Environment variables**, and add the following keys:

| Environment Variable | Description | Example Value |
| :--- | :--- | :--- |
| `SNS_TOPIC_ARN` | Full ARN of the SNS topic | `arn:aws:sns:ap-south-1:123456789012:AquaSenseWaterQualityAlerts` |
| `AWS_REGION` | Target AWS region | `ap-south-1` |

---

## 5. Lambda Integration Example

Include `AWS_SNS.py` directly in your Lambda function deployment package (or Lambda Layer).

Here is a reference `lambda_function.py` demonstrating how to invoke the publisher:

```python
import json
import logging
import os
from AWS_SNS import publish_unsafe_water_alert

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Triggered by AWS IoT Core rule (topic: 'aquasense/sensors').
    """
    logger.info("Received IoT sensor event: %s", event)

    # 1. Parse payload
    payload = event if isinstance(event, dict) else json.loads(event)

    # 2. Persist record to DynamoDB (your existing database logic here)
    # ...

    # 3. Publish alert if water is classified as UNSAFE
    # The module automatically verifies whether prediction == 'UNSAFE'.
    # If prediction == 'SAFE', it cleanly skips publishing with zero SNS charges.
    result = publish_unsafe_water_alert(payload)

    logger.info("SNS Alert evaluation result: %s", result)

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Processed sensor telemetry",
            "alert_status": result.get("status"),
            "sns_message_id": result.get("message_id")
        })
    }
```

---

## 6. Testing the Notification Module

### A. Local Offline Unit Tests (Zero Cost, No AWS Credentials)
You can run the full test suite locally without network access or AWS credentials:

```bash
python -m unittest aws/tests/test_aws_sns.py
```

Expected output:
```text
.......
----------------------------------------------------------------------
Ran 7 tests in 0.015s

OK
```

### B. Cloud Smoke Test via AWS Lambda Console
Once deployed to Lambda, create a **Test Event** in the Lambda console:

**Test 1: Unsafe Water Reading (Triggers Notification)**
```json
{
  "device_id": "TEST_NODE_01",
  "timestamp": "2026-10-24T06:00:00Z",
  "pH": 4.8,
  "tds": 720.0,
  "turbidity": 16.5,
  "temperature": 28.0,
  "prediction": "UNSAFE",
  "confidence": 95.0
}
```
*Expected Result:* Lambda logs report `"status": "PUBLISHED"` and subscribers receive the alert email/SMS.

**Test 2: Safe Water Reading (Suppressed Notification)**
```json
{
  "device_id": "TEST_NODE_01",
  "timestamp": "2026-10-24T06:00:00Z",
  "pH": 7.2,
  "tds": 220.0,
  "turbidity": 1.5,
  "temperature": 22.0,
  "prediction": "SAFE",
  "confidence": 99.0
}
```
*Expected Result:* Lambda logs report `"status": "SKIPPED_SAFE"`. No email or SMS is sent.
