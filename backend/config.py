"""Shared configuration for the backend application."""

import os

# JWT configuration
SECRET_KEY = os.getenv("SECRET_KEY", "4fca6c8e639aaad8d373ac05b64b18c792a6d7375fdebe4c09765f9b31c2a1d7")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./todoapp.db"  # Use SQLite for local development as fallback
)

# Logging configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Environment configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Frontend URL
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Backend URL
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

# GROQ API configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")