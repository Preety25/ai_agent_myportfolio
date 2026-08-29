"""Tests for /api/pinky/auth endpoint (ElevenLabs signed URL / WebRTC token)
   plus core status endpoints. Iteration 5: verify NameError fix — logger
   now defined at module top (lines ~19-23) so error branches at lines
   113/131 can safely log without NameError.
"""
import os
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")


# --- core routes ---
class TestCore:
    def test_root(self):
        r = requests.get(f"{BASE_URL}/api/", timeout=15)
        assert r.status_code == 200
        assert r.json().get("message") == "Hello World"

    def test_status_get_list(self):
        r = requests.get(f"{BASE_URL}/api/status", timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_status_post_and_persist(self):
        r = requests.post(
            f"{BASE_URL}/api/status",
            json={"client_name": "TEST_deploy-test"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["client_name"] == "TEST_deploy-test"
        assert "id" in body and isinstance(body["id"], str)
        assert "timestamp" in body

        # verify persisted via GET
        r2 = requests.get(f"{BASE_URL}/api/status", timeout=15)
        assert r2.status_code == 200
        ids = [item["id"] for item in r2.json()]
        assert body["id"] in ids


# --- Pinky auth endpoint ---
class TestPinkyAuth:
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
