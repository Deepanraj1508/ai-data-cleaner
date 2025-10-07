from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import uvicorn
import os
from dotenv import load_dotenv

from routers import data_cleaning
from services.file_handler import FileHandler

load_dotenv()

app = FastAPI(
    title="AI Data Cleaning Tool",
    description="Automated data cleaning with AI-powered suggestions",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directory
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Include routers
app.include_router(data_cleaning.router, prefix="/api/v1", tags=["data-cleaning"])

@app.get("/")
async def root():
    return {
        "message": "AI Data Cleaning Tool API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host=host, port=port)