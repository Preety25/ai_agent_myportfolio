from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
import requests
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging early so any endpoint below can safely use `logger`
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()