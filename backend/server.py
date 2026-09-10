from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
import requests


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging early so any endpoint below can safely use `logger`
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "Hello World"}


# ---------------------------------------------------------------------------
# Widget loader — served from the backend so we can attach the
# Cross-Origin-Resource-Policy header required by COEP-enforcing parents
# (e.g. preetyux.work / Framer). File contents are unchanged; only
# headers are added. Works identically on preview + production because
# both hosts route /api/* to this FastAPI service.
# ---------------------------------------------------------------------------
_WIDGET_JS_PATH = ROOT_DIR.parent / "frontend" / "public" / "widget.js"


@api_router.get("/widget.js")
async def get_widget_js():
    try:
        body = _WIDGET_JS_PATH.read_bytes()
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="widget.js not found")
    return Response(
        content=body,
        media_type="application/javascript; charset=utf-8",
        headers={
            "Cross-Origin-Resource-Policy": "cross-origin",
            "Cache-Control": "no-cache, no-store, must-revalidate",
        },
    )


# ---------------------------------------------------------------------------
# Pinky agent auth (ElevenLabs signed URL / WebRTC token)
# ---------------------------------------------------------------------------
# The widget hits this endpoint before opening a session so we can attach
# server-side credentials to the ElevenLabs conversation. Signed URLs /
# tokens bypass the agent's allowlist and never expose the API key to the
# browser.

ELEVENLABS_API_BASE = "https://api.elevenlabs.io"


class PinkyAuthResponse(BaseModel):
    mode: str
    signed_url: Optional[str] = None
    conversation_token: Optional[str] = None
    agent_id: str


@api_router.get("/pinky/auth", response_model=PinkyAuthResponse)
def get_pinky_auth(mode: str = Query(default="text", pattern="^(text|voice)$")):
    api_key = os.environ.get("ELEVENLABS_API_KEY")
    agent_id = os.environ.get("ELEVENLABS_AGENT_ID")
    if not api_key or not agent_id:
        raise HTTPException(
            status_code=500,
            detail="ElevenLabs credentials are not configured on the server.",
        )

    headers = {"xi-api-key": api_key}

    if mode == "voice":
        # WebRTC uses a conversation token
        url = f"{ELEVENLABS_API_BASE}/v1/convai/conversation/token"
        resp = requests.get(url, headers=headers, params={"agent_id": agent_id}, timeout=15)
        if resp.status_code != 200:
            logger.error("ElevenLabs token error: %s %s", resp.status_code, resp.text)
            try:
                detail = resp.json().get("detail", {})
                message = detail.get("message") if isinstance(detail, dict) else str(detail)
            except Exception:
                message = "Failed to obtain conversation token"
            raise HTTPException(status_code=resp.status_code, detail=message or "Failed to obtain conversation token")
        data = resp.json()
        return PinkyAuthResponse(
            mode="voice",
            conversation_token=data.get("token"),
            agent_id=agent_id,
        )

    # text mode -> WebSocket signed URL
    url = f"{ELEVENLABS_API_BASE}/v1/convai/conversation/get-signed-url"
    resp = requests.get(url, headers=headers, params={"agent_id": agent_id}, timeout=15)
    if resp.status_code != 200:
        logger.error("ElevenLabs signed-url error: %s %s", resp.status_code, resp.text)
        try:
            detail = resp.json().get("detail", {})
            message = detail.get("message") if isinstance(detail, dict) else str(detail)
        except Exception:
            message = "Failed to obtain signed URL"
        raise HTTPException(status_code=resp.status_code, detail=message or "Failed to obtain signed URL")
    data = resp.json()
    return PinkyAuthResponse(
        mode="text",
        signed_url=data.get("signed_url"),
        agent_id=agent_id,
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)