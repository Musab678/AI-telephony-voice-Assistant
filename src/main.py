import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

# Database & Routes
from database import init_db
from patients_api import router as patients_router

# Load environment variables
load_dotenv()

# Initialize SQLite database
init_db()

PORT = int(os.getenv("PORT", "8080"))

# Create FastAPI app
app = FastAPI(
    title="Metro Health Clinic — Voice AI Patient Registration System",
    description="Full implementation of the Take-Home Technical Assessment for Voice AI / Conversational AI Engineer",
    version="1.0.0"
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Patient Registration & Vapi Telephony routes
app.include_router(patients_router, prefix="/api")
app.include_router(patients_router)

# Mount audio directory for serving real call recordings
audio_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
app.mount("/audio", StaticFiles(directory=audio_dir), name="audio")

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Metro Health Clinic Voice AI Patient Registration",
        "provider": "Vapi"
    }

# Mount frontend production build if available for seamless single-service cloud deployment
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")

async def auto_sync_pipeline_worker():
    """Continuously runs in background every 3 seconds, discovering new calls and auto-ingesting validated patients."""
    import asyncio
    from patients_api import sync_from_vapi
    while True:
        try:
            await sync_from_vapi(None)
        except Exception as e:
            pass
        await asyncio.sleep(3.0)

@app.on_event("startup")
async def startup_event():
    import asyncio
    asyncio.create_task(auto_sync_pipeline_worker())

if __name__ == "__main__":
    print(f"Starting Metro Health Clinic Voice AI Server on port {PORT}")
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True, app_dir=os.path.dirname(__file__))
