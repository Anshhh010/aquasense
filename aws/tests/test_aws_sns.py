"""
Unit Test Suite for AquaSense Amazon SNS Notification Module
============================================================
Tests the SNS publishing logic, input validation, message formatting,
and error handling using Python's unittest and unittest.mock.

Guarantees:
- Tests run completely offline with mocked AWS SDK calls.
- No real SNS messages or emails are sent.
- Zero AWS charges or credentials required.
"""

import os
import unittest
from unittest.mock import MagicMock, patch

# Ensure aws module can be imported regardless of execution working directory
import sys
from pathlib import Path

AWS_DIR = Path(__file__).resolve().parent.parent
if str(AWS_DIR) not in sys.path:
    sys.path.insert(0, str(AWS_DIR))

import AWS_SNS


class TestAquaSenseSNS(unittest.TestCase):
    """Test cases covering validation, formatting, and publishing logic."""

    def setUp(self):
        """Prepare sample payloads and test environment for each test."""
        self.valid_unsafe_payload = {
            "device_id": "AQUASENSE_NODE_01",
            "timestamp": "2026-10-24T06:00:00Z",
            "pH": 5.2,
            "tds": 620.0,
            "turbidity": 14.5,
            "temperature": 26.8,
            "prediction": "UNSAFE",
            "confidence": 94.8,
        }

        self.valid_safe_payload = {
            "device_id": "AQUASENSE_NODE_01",
            "timestamp": "2026-10-24T06:00:00Z",
            "pH": 7.3,
            "tds": 240.0,
            "turbidity": 1.8,
            "temperature": 22.5,
            "prediction": "SAFE",
            "confidence": 98.1,
        }

        self.sample_arn = "arn:aws:sns:ap-south-1:123456789012:AquaSenseWaterQualityAlerts"

    # --------------------------------------------------------------------------
    # Test 1: Valid UNSAFE payload publishes one notification
    # --------------------------------------------------------------------------
    def test_valid_unsafe_payload_publishes_notification(self):
        """A valid UNSAFE water reading must trigger exactly one SNS publish call."""
        mock_client = MagicMock()
        mock_client.publish.return_value = {"MessageId": "msg-uuid-12345"}

        result = AWS_SNS.publish_unsafe_water_alert(
            payload=self.valid_unsafe_payload,
            topic_arn=self.sample_arn,
            sns_client=mock_client,
        )

        self.assertTrue(result["success"])
        self.assertEqual(result["status"], "PUBLISHED")
        self.assertEqual(result["message_id"], "msg-uuid-12345")
        self.assertEqual(result["device_id"], "AQUASENSE_NODE_01")

        # Verify SNS publish called exactly once with correct TopicArn
        mock_client.publish.assert_called_once()
        call_kwargs = mock_client.publish.call_args.kwargs
        self.assertEqual(call_kwargs["TopicArn"], self.sample_arn)
        self.assertIn("AQUASENSE_NODE_01", call_kwargs["Subject"])
        self.assertIn("UNSAFE", call_kwargs["Message"])
        self.assertEqual(
            call_kwargs["MessageAttributes"]["prediction"]["StringValue"],
            "UNSAFE",
        )

    # --------------------------------------------------------------------------
    # Test 2: SAFE payload does NOT publish a notification
    # --------------------------------------------------------------------------
    def test_safe_payload_does_not_publish_notification(self):
        """A SAFE reading must suppress the notification and make zero SNS calls."""
        mock_client = MagicMock()

        result = AWS_SNS.publish_unsafe_water_alert(
            payload=self.valid_safe_payload,
            topic_arn=self.sample_arn,
            sns_client=mock_client,
        )

        self.assertFalse(result["success"])
        self.assertEqual(result["status"], "SKIPPED_SAFE")
        self.assertIsNone(result["message_id"])
        self.assertIn("SAFE", result["reason"])

        # Crucial check: SNS client publish was NEVER called
        mock_client.publish.assert_not_called()

    # --------------------------------------------------------------------------
    # Test 3: Missing or invalid prediction status is rejected
    # --------------------------------------------------------------------------
    def test_missing_or_invalid_prediction_is_rejected(self):
        """Payloads missing prediction or having ambiguous statuses must be rejected."""
        mock_client = MagicMock()

        invalid_cases = [
            {"device_id": "NODE_01", "pH": 7.0},  # Missing prediction key
            {"device_id": "NODE_01", "prediction": ""},  # Empty prediction
            {"device_id": "NODE_01", "prediction": "UNKNOWN"},  # Ambiguous prediction
            {"device_id": "NODE_01", "prediction": "BORDERLINE"},  # Invented status
            {"device_id": "NODE_01", "prediction": None},  # Null prediction
        ]

        for case in invalid_cases:
            with self.subTest(case=case):
                result = AWS_SNS.publish_unsafe_water_alert(
                    payload=case,
                    topic_arn=self.sample_arn,
                    sns_client=mock_client,
                )
                self.assertFalse(result["success"])
                self.assertEqual(result["status"], "INVALID_PAYLOAD")
                self.assertIsNone(result["message_id"])

        mock_client.publish.assert_not_called()

    # --------------------------------------------------------------------------
    # Test 4: Missing required environment configuration is handled correctly
    # --------------------------------------------------------------------------
    def test_missing_topic_arn_configuration(self):
        """When neither argument nor SNS_TOPIC_ARN env var is provided, report configuration error."""
        mock_client = MagicMock()

        with patch.dict(os.environ, {}, clear=True):
            result = AWS_SNS.publish_unsafe_water_alert(
                payload=self.valid_unsafe_payload,
                topic_arn=None,  # No explicit topic ARN
                sns_client=mock_client,
            )

            self.assertFalse(result["success"])
            self.assertEqual(result["status"], "CONFIGURATION_ERROR")
            self.assertIn("SNS_TOPIC_ARN", result["error"])
            mock_client.publish.assert_not_called()

    def test_reads_topic_arn_from_environment(self):
        """Verifies that SNS_TOPIC_ARN is read from environment when not passed as argument."""
        mock_client = MagicMock()
        mock_client.publish.return_value = {"MessageId": "env-msg-999"}

        with patch.dict(os.environ, {"SNS_TOPIC_ARN": self.sample_arn}):
            result = AWS_SNS.publish_unsafe_water_alert(
                payload=self.valid_unsafe_payload,
                topic_arn=None,  # Rely on env var
                sns_client=mock_client,
            )

            self.assertTrue(result["success"])
            self.assertEqual(result["message_id"], "env-msg-999")
            mock_client.publish.assert_called_once()
            self.assertEqual(mock_client.publish.call_args.kwargs["TopicArn"], self.sample_arn)

    # --------------------------------------------------------------------------
    # Test 5: SNS API errors are handled correctly
    # --------------------------------------------------------------------------
    def test_sns_api_client_error_handling(self):
        """Simulates AWS SNS returning a ClientError (e.g. topic not found / forbidden)."""
        mock_client = MagicMock()
        mock_client.publish.side_effect = RuntimeError("Topic does not exist: TopicNotFound")

        result = AWS_SNS.publish_unsafe_water_alert(
            payload=self.valid_unsafe_payload,
            topic_arn=self.sample_arn,
            sns_client=mock_client,
        )

        self.assertFalse(result["success"])
        self.assertEqual(result["status"], "PUBLISH_FAILED")
        self.assertIn("TopicNotFound", result["error"])
        self.assertIsNone(result["message_id"])

    # --------------------------------------------------------------------------
    # Test 6: Message formatting contains all relevant sensor readings
    # --------------------------------------------------------------------------
    def test_alert_message_formatting_content(self):
        """The alert message body must contain device ID, prediction, and all metric readings."""
        subject, body = AWS_SNS.build_unsafe_water_alert_message(self.valid_unsafe_payload)

        # Verify subject
        self.assertIn("AQUASENSE_NODE_01", subject)
        self.assertLessEqual(len(subject), 100)

        # Verify body contains key indicators
        self.assertIn("AQUASENSE_NODE_01", body)
        self.assertIn("5.20", body)  # pH
        self.assertIn("620.0 ppm", body)  # TDS
        self.assertIn("14.5 NTU", body)  # Turbidity
        self.assertIn("26.8 °C", body)  # Temperature
        self.assertIn("94.8%", body)  # Confidence
        self.assertIn("UNSAFE", body)
        self.assertIn("WHO standard", body)

    def test_explicit_ph_vs_pH_key_handling(self):
        """Payload using lowercase 'ph' instead of 'pH' must be handled transparently."""
        mock_client = MagicMock()
        mock_client.publish.return_value = {"MessageId": "msg-ph-lowercase"}

        payload_with_lowercase_ph = {
            "device_id": "NODE_LOWERCASENAME",
            "timestamp": "2026-10-24T06:05:00Z",
            "ph": 4.5,  # lowercase key
            "tds": 750,
            "turbidity": 25.0,
            "temperature": 29.0,
            "prediction": "UNSAFE",
        }

        result = AWS_SNS.publish_unsafe_water_alert(
            payload=payload_with_lowercase_ph,
            topic_arn=self.sample_arn,
            sns_client=mock_client,
        )

        self.assertTrue(result["success"])
        # Check that the formatted message extracted 4.50 pH
        call_msg = mock_client.publish.call_args.kwargs["Message"]
        self.assertIn("4.50", call_msg)

    # --------------------------------------------------------------------------
    # Test 7: Invalid payloads do not result in SNS API calls
    # --------------------------------------------------------------------------
    def test_invalid_payloads_do_not_call_sns(self):
        """Completely malformed payloads (non-dict, missing device_id) must fail prior to SNS call."""
        mock_client = MagicMock()

        malformed_inputs = [
            None,
            "not-a-dict",
            12345,
            [],
            {"prediction": "UNSAFE"},  # Missing device_id
            {"device_id": "", "prediction": "UNSAFE"},  # Empty device_id
        ]

        for item in malformed_inputs:
            with self.subTest(item=item):
                result = AWS_SNS.publish_unsafe_water_alert(
                    payload=item,
                    topic_arn=self.sample_arn,
                    sns_client=mock_client,
                )
                self.assertFalse(result["success"])
                self.assertEqual(result["status"], "INVALID_PAYLOAD")

        mock_client.publish.assert_not_called()


if __name__ == "__main__":
    unittest.main()
