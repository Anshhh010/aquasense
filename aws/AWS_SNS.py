"""
AquaSense - Amazon SNS Notification Module
===========================================
Independent, reusable notification service for the AquaSense IoT water quality monitoring system.
Invoked by AWS Lambda or downstream telemetry workers when water quality is evaluated as UNSAFE.

Architecture Context:
    ESP32 / Sensors -> AWS IoT Core -> AWS Lambda -> [AWS_SNS Module] -> Amazon SNS -> Subscribers (SMS/Email)

Security & Credentials:
    - Never hardcode credentials, secret keys, or topic ARNs.
    - Utilizes standard AWS SDK (boto3) credential provider chain (e.g., Lambda execution role).
    - Reads configuration from environment variables: SNS_TOPIC_ARN and AWS_REGION.
    - Sanitizes logs to prevent accidental exposure of sensitive telemetry or secrets.
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, Optional, Tuple, Union

# Set up dedicated, structured logger
logger = logging.getLogger("AquaSense.AWS_SNS")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] [AquaSense.SNS] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)


def validate_alert_payload(payload: Any) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Validates the structure, types, and prediction state of the input telemetry payload.

    Conditions & Rules:
    - Must be a dictionary.
    - Must contain a valid, non-empty 'device_id'.
    - Must contain an explicit 'prediction' field.
    - Must explicitly distinguish between 'UNSAFE' (alertable) and 'SAFE' (suppressed).
    - Ambiguous, missing, or unrecognized predictions are rejected.
    - Normalizes field naming differences (e.g., handles 'pH' vs 'ph').

    Args:
        payload: Telemetry payload dictionary from IoT Core or Lambda event.

    Returns:
        Tuple[bool, str, Dict[str, Any]]:
            - is_valid_unsafe (bool): True ONLY if payload is valid AND prediction is 'UNSAFE'.
            - reason (str): Explanatory status code or error reason.
            - normalized (dict): Standardized payload data dictionary.
    """
    if not isinstance(payload, dict):
        logger.warning("Rejected payload: Input must be a dictionary, got %s", type(payload).__name__)
        return False, "PAYLOAD_NOT_A_DICT", {}

    # Extract & validate device_id
    raw_device_id = payload.get("device_id")
    if not raw_device_id or not str(raw_device_id).strip():
        logger.warning("Rejected payload: Missing or empty 'device_id'")
        return False, "MISSING_DEVICE_ID", {}
    device_id = str(raw_device_id).strip()

    # Extract & validate prediction
    raw_prediction = payload.get("prediction")
    if raw_prediction is None or not str(raw_prediction).strip():
        logger.warning("Rejected payload: Missing or empty 'prediction' status")
        return False, "MISSING_PREDICTION", {}

    prediction = str(raw_prediction).strip().upper()

    # Extract timestamp (optional fallback to current ISO string if omitted)
    timestamp = payload.get("timestamp")
    if timestamp is not None:
        timestamp_str = str(timestamp).strip()
    else:
        timestamp_str = "N/A"

    # Normalize sensor metrics (handle 'pH' vs 'ph' naming discrepancy explicitly)
    # The ESP32 sketch outputs "pH", while legacy API mappings may provide "ph".
    ph_value = payload.get("pH")
    if ph_value is None:
        ph_value = payload.get("ph")

    tds_value = payload.get("tds")
    turbidity_value = payload.get("turbidity")
    temp_value = payload.get("temperature")
    confidence_value = payload.get("confidence")

    def _safe_float(val: Any) -> Optional[float]:
        if val is None:
            return None
        try:
            return float(val)
        except (ValueError, TypeError):
            return None

    normalized: Dict[str, Any] = {
        "device_id": device_id,
        "timestamp": timestamp_str,
        "prediction": prediction,
        "ph": _safe_float(ph_value),
        "pH": _safe_float(ph_value),  # Available under both keys for caller convenience
        "tds": _safe_float(tds_value),
        "turbidity": _safe_float(turbidity_value),
        "temperature": _safe_float(temp_value),
        "confidence": _safe_float(confidence_value),
    }

    # Evaluate prediction condition
    if prediction == "SAFE":
        logger.info(
            "Water quality reading for device '%s' is classified as SAFE. No alert required.",
            device_id,
        )
        return False, "STATUS_SAFE", normalized

    if prediction == "UNSAFE":
        return True, "VALID_UNSAFE", normalized

    # Ambiguous or unexpected prediction value (e.g. "UNKNOWN", "ERROR", etc.)
    logger.warning(
        "Rejected payload: Invalid or ambiguous prediction value '%s' for device '%s'",
        prediction,
        device_id,
    )
    return False, f"AMBIGUOUS_PREDICTION_{prediction}", normalized


def build_unsafe_water_alert_message(
    payload: Dict[str, Any],
    custom_subject: Optional[str] = None,
) -> Tuple[str, str]:
    """
    Constructs human-readable email/SMS notification subject and body.

    Args:
        payload: Normalized payload dictionary.
        custom_subject: Optional custom subject override.

    Returns:
        Tuple[str, str]: (subject, message_body)
    """
    device_id = payload.get("device_id", "UNKNOWN_DEVICE")
    timestamp = payload.get("timestamp", "N/A")
    prediction = payload.get("prediction", "UNSAFE")
    confidence = payload.get("confidence")

    ph_val = payload.get("pH") if payload.get("pH") is not None else payload.get("ph")
    tds_val = payload.get("tds")
    turb_val = payload.get("turbidity")
    temp_val = payload.get("temperature")

    # Format values gracefully
    ph_str = f"{ph_val:.2f}" if ph_val is not None else "N/A"
    tds_str = f"{tds_val:.1f} ppm" if tds_val is not None else "N/A"
    turb_str = f"{turb_val:.1f} NTU" if turb_val is not None else "N/A"
    temp_str = f"{temp_val:.1f} °C" if temp_val is not None else "N/A"
    conf_str = f"{confidence:.1f}%" if confidence is not None else "N/A"

    if custom_subject and custom_subject.strip():
        subject = custom_subject.strip()
    else:
        subject = f"[CRITICAL ALERT] AquaSense: Unsafe Water Detected ({device_id})"

    # Ensure SNS subject line length does not exceed AWS 100 character limit
    if len(subject) > 100:
        subject = subject[:97] + "..."

    message_body = f"""==================================================
AQUASENSE WATER QUALITY WARNING - IMMEDIATE ACTION REQUIRED
==================================================

Safety Status:      {prediction}
ML Confidence:      {conf_str}
Monitoring Node:    {device_id}
Recorded At:        {timestamp}

--------------------------------------------------
Observed Sensor Metrics:
--------------------------------------------------
  • pH Level:       {ph_str}   [WHO standard: 6.5 - 8.5]
  • Total Solids:   {tds_str}   [WHO standard: < 500 ppm]
  • Turbidity:      {turb_str}   [WHO standard: < 5 NTU]
  • Temperature:    {temp_str}

--------------------------------------------------
Safety Notice:
--------------------------------------------------
The AquaSense monitoring system has evaluated this water source
as UNSAFE for direct consumption. 

Please halt water usage from this node until further purification,
boiling, or secondary laboratory testing is conducted.

==================================================
AquaSense Automated IoT Water Monitoring System
"""
    return subject, message_body


def publish_unsafe_water_alert(
    payload: Dict[str, Any],
    topic_arn: Optional[str] = None,
    region_name: Optional[str] = None,
    sns_client: Optional[Any] = None,
    custom_subject: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Publishes an alert notification to Amazon SNS if water quality is UNSAFE.

    Follows AWS security best practices:
    - Resolves credentials via the default AWS SDK credential chain.
    - Resolves topic ARN from the argument or SNS_TOPIC_ARN environment variable.
    - Strictly avoids hardcoded credentials or secrets.
    - Validates data before executing AWS network calls.

    Args:
        payload: Input telemetry record with sensor metrics and prediction.
        topic_arn: Target SNS topic ARN (defaults to SNS_TOPIC_ARN env var).
        region_name: Target AWS region (defaults to AWS_REGION env var or client default).
        sns_client: Optional pre-configured boto3 SNS client (ideal for dependency injection and mocking).
        custom_subject: Optional custom subject override.

    Returns:
        Dict[str, Any]: Execution result dictionary:
            - success (bool): True if message published, False otherwise.
            - status (str): Descriptive status code:
                * 'PUBLISHED'
                * 'SKIPPED_SAFE'
                * 'INVALID_PAYLOAD'
                * 'CONFIGURATION_ERROR'
                * 'PUBLISH_FAILED'
            - message_id (Optional[str]): SNS MessageId if published.
            - device_id (Optional[str]): Target device ID if known.
            - error (Optional[str]): Error description if failed.
    """
    # 1. Resolve SNS Topic ARN
    target_arn = (topic_arn or os.environ.get("SNS_TOPIC_ARN", "")).strip()
    if not target_arn:
        error_msg = "SNS_TOPIC_ARN is not configured. Provide it via argument or environment variable."
        logger.error(error_msg)
        return {
            "success": False,
            "status": "CONFIGURATION_ERROR",
            "message_id": None,
            "device_id": payload.get("device_id") if isinstance(payload, dict) else None,
            "error": error_msg,
        }

    # 2. Validate payload and verify prediction status
    is_valid_unsafe, validation_reason, normalized = validate_alert_payload(payload)

    # 2a. If SAFE, suppress publication without error
    if validation_reason == "STATUS_SAFE":
        return {
            "success": False,
            "status": "SKIPPED_SAFE",
            "message_id": None,
            "device_id": normalized.get("device_id"),
            "reason": "Water quality reading is SAFE. Alert notification suppressed.",
        }

    # 2b. If invalid, reject immediately without touching AWS SNS
    if not is_valid_unsafe:
        error_msg = f"Payload validation failed: {validation_reason}"
        logger.warning(error_msg)
        return {
            "success": False,
            "status": "INVALID_PAYLOAD",
            "message_id": None,
            "device_id": normalized.get("device_id") if normalized else None,
            "error": error_msg,
        }

    # 3. Build alert notification message
    subject, message_body = build_unsafe_water_alert_message(normalized, custom_subject=custom_subject)

    # 4. Initialize boto3 SNS client if not injected
    client = sns_client
    if client is None:
        try:
            import boto3
            resolved_region = (region_name or os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION", "")).strip()
            if resolved_region:
                client = boto3.client("sns", region_name=resolved_region)
            else:
                client = boto3.client("sns")
        except Exception as exc:
            logger.error("Failed to initialize boto3 SNS client: %s", exc)
            return {
                "success": False,
                "status": "CONFIGURATION_ERROR",
                "message_id": None,
                "device_id": normalized.get("device_id"),
                "error": f"Failed to initialize AWS SNS client: {exc}",
            }

    # 5. Publish to Amazon SNS
    try:
        device_id = normalized.get("device_id", "UNKNOWN")
        logger.info("Publishing UNSAFE water alert to SNS topic for device '%s'...", device_id)

        response = client.publish(
            TopicArn=target_arn,
            Subject=subject,
            Message=message_body,
            MessageAttributes={
                "device_id": {
                    "DataType": "String",
                    "StringValue": device_id,
                },
                "prediction": {
                    "DataType": "String",
                    "StringValue": "UNSAFE",
                },
                "alert_type": {
                    "DataType": "String",
                    "StringValue": "WATER_QUALITY_WARNING",
                },
            },
        )

        message_id = response.get("MessageId")
        logger.info(
            "Successfully published SNS alert for device '%s'. SNS MessageId: %s",
            device_id,
            message_id,
        )

        return {
            "success": True,
            "status": "PUBLISHED",
            "message_id": message_id,
            "device_id": device_id,
            "error": None,
        }

    except Exception as exc:
        # Catch botocore.exceptions.ClientError or general communication failures
        logger.error(
            "Failed to publish SNS notification for device '%s': %s",
            normalized.get("device_id", "UNKNOWN"),
            exc,
            exc_info=False,  # Avoid dumping sensitive stack frames in production logs
        )
        return {
            "success": False,
            "status": "PUBLISH_FAILED",
            "message_id": None,
            "device_id": normalized.get("device_id"),
            "error": str(exc),
        }
