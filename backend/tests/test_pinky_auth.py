"""Tests for /api/pinky/auth endpoint (ElevenLabs signed URL / WebRTC token).

Iteration 3: API key now has convai_write permission, so we expect 200s
with proper signed_url (text) and conversation_token (voice) payloads.
"""
import os
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")


class TestPinkyAuth:
    def test_root(self):
        r = requests.get(f"{BASE_URL}/api/", timeout=15)
        assert r.status_code == 200
        assert r.json().get("message") == "Hello World"

    def test_text_mode_returns_signed_url(self):
        r = requests.get(f"{BASE_URL}/api/pinky/auth", params={"mode": "text"}, timeout=20)
        assert r.status_code == 200, f"Body: {r.text}"
        body = r.json()
        assert body["mode"] == "text"
        assert isinstance(body.get("signed_url"), str) and body["signed_url"].startswith("wss://"), body
        assert body.get("conversation_token") is None
        assert isinstance(body.get("agent_id"), str) and body["agent_id"].startswith("agent_")

    def test_voice_mode_returns_conversation_token(self):
        r = requests.get(f"{BASE_URL}/api/pinky/auth", params={"mode": "voice"}, timeout=20)
        assert r.status_code == 200, f"Body: {r.text}"
        body = r.json()
        assert body["mode"] == "voice"
        assert isinstance(body.get("conversation_token"), str) and len(body["conversation_token"]) > 20
        assert body.get("signed_url") is None
        assert isinstance(body.get("agent_id"), str) and body["agent_id"].startswith("agent_")

    def test_invalid_mode_returns_422(self):
        r = requests.get(f"{BASE_URL}/api/pinky/auth", params={"mode": "badmode"}, timeout=10)
        assert r.status_code == 422
        assert "detail" in r.json()

    def test_default_mode_is_text(self):
        r = requests.get(f"{BASE_URL}/api/pinky/auth", timeout=20)
        assert r.status_code == 200
        assert r.json()["mode"] == "text"
