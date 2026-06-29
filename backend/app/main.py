from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router

app = FastAPI(
    title="AI Resume Analyzer API",
    description="Backend API for AI-powered resume analysis, ATS scoring, and suggestions.",
    version="1.0.0"
)

# CORS Configuration - Allow all origins for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the API router
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "AI Resume Analyzer API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "backend"}
