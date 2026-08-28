"""Tests for /api/pinky/auth endpoint (ElevenLabs signed URL / token fallback)."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://portfolio-voice-chat.preview.emergentagent.com").rstrip("/")


class TestPinkyAuth:
    def test_root(self):
        r = requests.get(f"{BASE_URL}/api/", timeout=15)
        assert r.status_code == 200
        assert r.json().get("message") == "Hello World"

    def test_text_mode_returns_graceful_error(self):
        """API key lacks convai_write scope - expect non-200 with detail message."""
        r = requests.get(f"{BASE_URL}/api/pinky/auth", params={"mode": "text"}, timeout=20)
        # Expect graceful failure (401 from ElevenLabs propagated, or 502/500)
        assert r.status_code != 200, f"Unexpected 200: key may now have permissions. Body: {r.text}"
        body = r.json()
        assert "detail" in body
        detail_str = str(body["detail"]).lower()
        # Either mentions permission or a helpful fallback message
        assert (
            "permission" in detail_str
            or "missing" in detail_str
            or "failed to obtain" in detail_str
            or "unauthorized" in detail_str
            or "signed" in detail_str
        ), f"Detail was: {body['detail']}"
        print(f"text mode -> {r.status_code}: {body['detail']}")

    def test_voice_mode_returns_graceful_error(self):
        r = requests.get(f"{BASE_URL}/api/pinky/auth", params={"mode": "voice"}, timeout=20)
        assert r.status_code != 200, f"Unexpected 200: {r.text}"
        body = r.json()
        assert "detail" in body
        detail_str = str(body["detail"]).lower()
        assert (
            "permission" in detail_str
            or "missing" in detail_str
            or "failed to obtain" in detail_str
            or "unauthorized" in detail_str
            or "token" in detail_str
        ), f"Detail was: {body['detail']}"
        print(f"voice mode -> {r.status_code}: {body['detail']}")

    def test_invalid_mode_returns_422(self):
        r = requests.get(f"{BASE_URL}/api/pinky/auth", params={"mode": "invalid"}, timeout=10)
        assert r.status_code == 422
        body = r.json()
        assert "detail" in body

    def test_default_mode_is_text(self):
        r = requests.get(f"{BASE_URL}/api/pinky/auth", timeout=20)
        # No mode -> defaults to text -> still graceful failure due to missing perm
        assert r.status_code in (401, 500, 502)
