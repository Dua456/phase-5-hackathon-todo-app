import os
import sys

# Add the backend directory to the Python path to resolve imports when running as a module
if __name__ != "__main__":
    # When imported as a module (like in Railway/Nixpacks), ensure proper path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    if current_dir not in sys.path:
        sys.path.insert(0, current_dir)

# Load environment variables FIRST before importing modules that depend on them
from dotenv import load_dotenv
load_dotenv(override=True)

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select
from typing import Optional
from pydantic import BaseModel
import httpx
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from urllib.parse import urlencode
import uuid
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import models after environment variables are loaded
from models import (
    User, Task, UserCreate, UserLogin, UserResponse,
    TaskCreate, TaskUpdate, TaskResponse, TokenResponse,
    ProviderEnum, PriorityEnum
)

# Import routes
from routes.chat import router as chat_router

# Import db module after environment is loaded
from db import get_session, create_db_and_tables, refresh_engine

# Refresh the database engine with the loaded environment variables
refresh_engine()

# Initialize Sentry for error tracking (after environment is loaded)
if os.getenv("SENTRY_DSN"):
    sentry_sdk.init(
        dsn=os.getenv("SENTRY_DSN"),
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
        ],
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )

# Initialize FastAPI app with proper configuration for production
app = FastAPI(
    title="Todo App Backend",
    version="1.0.0",
    description="Modern Todo Application with Authentication",
    docs_url="/docs",      # Explicitly enable docs
    redoc_url="/redoc",    # Explicitly enable redoc
    openapi_url="/openapi.json"  # Explicitly enable openapi
)

# Add CORS middleware
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:43803",
    "https://phase-5-hackathon-todo-app.vercel.app",  # Your deployed frontend
]

# Add production origins from environment variables
FRONTEND_URL = os.getenv("FRONTEND_URL")
if FRONTEND_URL:
    # Ensure the URL has proper scheme
    if not FRONTEND_URL.startswith(('http://', 'https://')):
        FRONTEND_URL = f"https://{FRONTEND_URL}"
    frontend_clean = FRONTEND_URL.rstrip('/')  # Remove trailing slash if present
    if frontend_clean not in ALLOWED_ORIGINS:
        ALLOWED_ORIGINS.append(frontend_clean)

# Add Railway public domain which is available during runtime
RAILWAY_PUBLIC_DOMAIN = os.getenv("RAILWAY_PUBLIC_DOMAIN")
if RAILWAY_PUBLIC_DOMAIN:
    # Ensure we only add the domain if it's not already in the list
    railway_url = f"https://{RAILWAY_PUBLIC_DOMAIN}"
    if railway_url not in ALLOWED_ORIGINS:
        ALLOWED_ORIGINS.append(railway_url)

# Allow all origins in production if specifically configured (for development flexibility)
# This should be used carefully in production
ALLOW_ALL_ORIGINS = os.getenv("ALLOW_ALL_CORS", "").lower() in ('true', '1', 'yes')
if ALLOW_ALL_ORIGINS:
    ALLOWED_ORIGINS = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],  # Explicitly include OPTIONS
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "X-Requested-With",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers"
    ],  # Explicitly allow headers including Authorization for JWT
    # Expose headers that the browser should be able to read
    expose_headers=["Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"],
)

# Security configurations
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = HTTPBearer()

# Import configuration
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

# OAuth2 configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

# URLs - IMPORTANT: Make sure these match your actual deployment
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://phase-5-hackathon-todo-app.vercel.app")

# Determine backend URL based on environment
RAILWAY_PUBLIC_DOMAIN = os.getenv("RAILWAY_PUBLIC_DOMAIN")
if RAILWAY_PUBLIC_DOMAIN:
    BACKEND_URL = f"https://{RAILWAY_PUBLIC_DOMAIN}"
else:
    BACKEND_URL = os.getenv("BACKEND_URL", "https://web-production-3d8a1.up.railway.app")

def check_oauth_config(provider: str) -> tuple[bool, str]:
    """Check if OAuth credentials are properly configured for the given provider."""
    if provider == "google":
        if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
            return False, "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables."
    elif provider == "github":
        if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
            return False, "GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables."
    else:
        return False, f"Unsupported OAuth provider: {provider}"
    return True, ""


# OAuth URLs
GOOGLE_AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

GITHUB_AUTHORIZATION_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USERINFO_URL = "https://api.github.com/user"
GITHUB_EMAIL_URL = "https://api.github.com/user/emails"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    if not hashed_password:
        return False
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.error(f"Token verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)
) -> User:
    """Get current user from JWT token - sync version to avoid session conflicts"""
    token = credentials.credentials
    try:
        payload = verify_token(token)
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: str = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        logger.error(f"Invalid user ID format: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create a dedicated session for this function to avoid conflicts
    from db import get_session
    session_gen = get_session()
    session = next(session_gen)

    try:
        user = session.get(User, user_uuid)
    except Exception as e:
        logger.error(f"Database error when fetching user {user_id}: {str(e)}")
        # For Railway cold start issues, try to refresh the engine and retry once
        from db import refresh_engine
        refresh_engine()  # Refresh the engine to get a new connection
        try:
            user = session.get(User, user_uuid)
        except Exception as retry_e:
            logger.error(f"Retry failed for user {user_id}: {str(retry_e)}")
            session.close()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection error, please try again",
            )
    finally:
        session.close()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@app.on_event("startup")
async def on_startup():
    """Create database tables on startup"""
    import time
    max_retries = 15  # Increase retries for production reliability
    retry_count = 0

    logger.info("Starting application startup sequence...")
    logger.info(f"Backend URL: {BACKEND_URL}")
    logger.info(f"Frontend URL: {FRONTEND_URL}")
    logger.info(f"Database URL configured: {'Yes' if os.getenv('DATABASE_URL') else 'No'}")
    logger.info(f"Google OAuth configured: {bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)}")
    logger.info(f"GitHub OAuth configured: {bool(GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET)}")
    logger.info(f"GROQ API configured: {'Yes' if os.getenv('GROQ_API_KEY') else 'No'}")
    logger.info(f"OAuth Callback URLs:")
    logger.info(f"  Google: {BACKEND_URL}/auth/google/callback")
    logger.info(f"  GitHub: {BACKEND_URL}/auth/github/callback")

    while retry_count < max_retries:
        try:
            logger.info(f"Attempting to create database tables (attempt {retry_count + 1}/{max_retries})...")
            # Create a fresh session for table creation
            from db import get_session
            from sqlmodel import Session

            # Refresh the engine to ensure proper connection pool settings
            from db import refresh_engine
            refresh_engine()

            create_db_and_tables()
            logger.info("Database tables created successfully")
            break  # If successful, exit the loop
        except Exception as e:
            retry_count += 1
            logger.warning(f"Database connection attempt {retry_count} failed: {e}")
            if retry_count >= max_retries:
                logger.error(f"Failed to connect to database after {max_retries} attempts: {e}")
                # Still continue to allow the app to start, as the database might become available later
                # But log a clear warning
                logger.warning("Continuing startup despite database connection issues. Database-dependent features may not work until connection is established.")
                break
            else:
                wait_time = min(2 ** retry_count, 30)  # Cap the wait time at 30 seconds
                logger.info(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)  # Exponential backoff with cap

    logger.info("Application startup sequence completed")


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Todo App Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running",
        "backend_url": BACKEND_URL,
        "oauth_callbacks": {
            "google": f"{BACKEND_URL}/auth/google/callback",
            "github": f"{BACKEND_URL}/auth/github/callback"
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.get("/health/db")
def db_health_check(session: Session = Depends(get_session)):
    """Database health check endpoint"""
    try:
        # Attempt a simple database query to check connectivity
        from sqlalchemy import text
        result = session.exec(text("SELECT 1")).first()
        return {"status": "database_connected", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "database_error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }, 503


@app.post("/auth/register", response_model=TokenResponse)
def register(user_data: UserCreate, session: Session = Depends(get_session)):
    """Register a new user with email and password"""
    # Check if user already exists
    existing_user = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )

    # Hash password
    hashed_password = get_password_hash(user_data.password)

    # Create user
    user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        provider=ProviderEnum.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        bio=user_data.bio,
        location=user_data.location,
        timezone=user_data.timezone,
        theme_preference=user_data.theme_preference,
        last_login=datetime.utcnow()
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # Create JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "provider": user.provider, "email": user.email},
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/auth/login", response_model=TokenResponse)
def login(user_data: UserLogin, session: Session = Depends(get_session)):
    """Login with email and password"""
    # Find user by email
    user = session.exec(select(User).where(User.email == user_data.email)).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.hashed_password or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last login
    user.last_login = datetime.utcnow()
    session.add(user)
    session.commit()

    # Create JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "provider": user.provider, "email": user.email},
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/auth/google")
async def google_auth():
    """Initiate Google OAuth flow"""
    is_configured, error_msg = check_oauth_config("google")
    if not is_configured:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=error_msg
        )

    # Construct redirect URI - ensure it matches exactly what's registered in Google Cloud Console
    redirect_uri = f"{BACKEND_URL}/auth/google/callback"

    logger.info(f"Google OAuth initiated with redirect_uri: {redirect_uri}")

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent"  # Force consent screen to ensure we get refresh token
    }

    auth_url = f"{GOOGLE_AUTHORIZATION_URL}?{urlencode(params)}"
    logger.info(f"Redirecting to Google auth URL: {auth_url}")
    return RedirectResponse(url=auth_url)


@app.get("/auth/google/callback")
async def google_auth_callback(code: str, session: Session = Depends(get_session)):
    """Handle Google OAuth callback"""
    try:
        is_configured, error_msg = check_oauth_config("google")
        if not is_configured:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail=error_msg
            )

        redirect_uri = f"{BACKEND_URL}/auth/google/callback"
        logger.info(f"Google callback received with redirect_uri: {redirect_uri}")

        async with httpx.AsyncClient() as client:
            # Exchange code for token
            token_response = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": redirect_uri,
                },
                headers={"Accept": "application/json"}
            )

            if token_response.status_code != 200:
                logger.error(f"Google token exchange failed: {token_response.status_code}, {token_response.text}")
                error_detail = token_response.json() if token_response.headers.get("content-type") == "application/json" else token_response.text
                return RedirectResponse(url=f"{FRONTEND_URL}/auth/error?provider=google&error=token_exchange_failed&details={str(error_detail)}")

            token_data = token_response.json()
            access_token = token_data.get("access_token")

            if not access_token:
                logger.error(f"No access token in response: {token_data}")
                return RedirectResponse(url=f"{FRONTEND_URL}/auth/error?provider=google&error=no_access_token")

            # Get user info
            user_response = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )

            if user_response.status_code != 200:
                logger.error(f"Google user info failed: {user_response.status_code}, {user_response.text}")
                return RedirectResponse(url=f"{FRONTEND_URL}/auth/error?provider=google&error=user_info_failed")

            user_info = user_response.json()
            email = user_info.get("email")

            if not email:
                logger.error(f"No email in user info: {user_info}")
                return RedirectResponse(url=f"{FRONTEND_URL}/auth/error?provider=google&error=no_email")

        # Check if user exists
        existing_user = session.exec(select(User).where(User.email == email)).first()

        # Extract first_name and last_name from Google user info
        first_name = user_info.get("given_name", None)
        last_name = user_info.get("family_name", None)

        if existing_user:
            # Update existing user with name information if not already present
            if not existing_user.first_name:
                existing_user.first_name = first_name
            if not existing_user.last_name:
                existing_user.last_name = last_name
            existing_user.last_login = datetime.utcnow()
            session.add(existing_user)
            session.commit()
            user = existing_user
        else:
            user = User(
                email=email,
                provider=ProviderEnum.google,
                hashed_password=None,
                first_name=first_name,
                last_name=last_name,
                bio=None,
                location=user_info.get("locale", None),
                timezone=user_info.get("locale", "UTC"),  # Google provides locale which can be used for timezone
                theme_preference="dark",  # Default theme
                last_login=datetime.utcnow()
            )
            session.add(user)
            session.commit()
            session.refresh(user)

        # Create JWT token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        jwt_token = create_access_token(
            data={"sub": str(user.id), "provider": user.provider, "email": user.email},
            expires_delta=access_token_expires
        )

        redirect_url = f"{FRONTEND_URL}/auth/callback?token={jwt_token}&provider=google"
        logger.info(f"Successfully authenticated Google user, redirecting to: {redirect_url}")
        return RedirectResponse(url=redirect_url)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in Google callback: {str(e)}")
        return RedirectResponse(url=f"{FRONTEND_URL}/auth/error?provider=google&error=internal_error&details={str(e)}")
    finally:
        # Ensure session is closed even in case of exceptions
        session.close()


@app.get("/auth/github")
async def github_auth():
    """Initiate GitHub OAuth flow"""
    is_configured, error_msg = check_oauth_config("github")
    if not is_configured:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=error_msg
        )

    redirect_uri = f"{BACKEND_URL}/auth/github/callback"

    logger.info(f"GitHub OAuth initiated with redirect_uri: {redirect_uri}")

    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "scope": "user:email"
    }

    auth_url = f"{GITHUB_AUTHORIZATION_URL}?{urlencode(params)}"
    logger.info(f"Redirecting to GitHub auth URL: {auth_url}")
    return RedirectResponse(url=auth_url)


@app.get("/auth/github/callback")
async def github_auth_callback(code: str, session: Session = Depends(get_session)):
    """Handle GitHub OAuth callback"""
    try:
        is_configured, error_msg = check_oauth_config("github")
        if not is_configured:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail=error_msg
            )

        redirect_uri = f"{BACKEND_URL}/auth/github/callback"
        logger.info(f"GitHub callback received with redirect_uri: {redirect_uri}")

        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                GITHUB_TOKEN_URL,
                data={
                    "client_id": GITHUB_CLIENT_ID,
                    "client_secret": GITHUB_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": redirect_uri,
                },
                headers={"Accept": "application/json"}
            )

            if token_response.status_code != 200:
                logger.error(f"GitHub token exchange failed: {token_response.status_code}, {token_response.text}")
                error_detail = token_response.json() if token_response.headers.get("content-type") == "application/json" else token_response.text
                return RedirectResponse(url=f"{FRONTEND_URL}/auth/error?provider=github&error=token_exchange_failed&details={str(error_detail)}")

            token_data = token_response.json()
            access_token = token_data.get("access_token")

            if not access_token:
                logger.error(f"No access token in response: {token_data}")
                return RedirectResponse(url=f"{FRONTEND_URL}/auth/error?provider=github&error=no_access_token")

            # Get user info
            user_response = await client.get(
                GITHUB_USERINFO_URL,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json"
                }
            )

            if user_response.status_code != 200:
                logger.error(f"GitHub user info failed: {user_response.status_code}, {user_response.text}")
                return RedirectResponse(url=f"{FRONTEND_URL}/auth/error?provider=github&error=user_info_failed")

            user_info = user_response.json()
            email = user_info.get("email")

            # Fetch email if not public
            if not email:
                emails_response = await client.get(
                    GITHUB_EMAIL_URL,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Accept": "application/json"
                    }
                )
                if emails_response.status_code == 200:
                    emails = emails_response.json()
                    primary_email = next((e["email"] for e in emails if e.get("primary") and e.get("verified")), None)
                    email = primary_email or (emails[0]["email"] if emails else None)

            # Fallback to username@github.com
            if not email:
                username = user_info.get("login")
                email = f"{username}@github.com" if username else None

            if not email:
                logger.error(f"Could not retrieve email from GitHub: {user_info}")
                return RedirectResponse(url=f"{FRONTEND_URL}/auth/error?provider=github&error=no_email")

        # Check if user exists
        existing_user = session.exec(select(User).where(User.email == email)).first()

        # Extract first_name and last_name from GitHub user info
        full_name = user_info.get("name", "")
        first_name = None
        last_name = None

        if full_name:
            name_parts = full_name.strip().split(" ", 1)
            first_name = name_parts[0] if len(name_parts) > 0 else None
            last_name = name_parts[1] if len(name_parts) > 1 else None

        if existing_user:
            # Update existing user with name information if not already present
            if not existing_user.first_name:
                existing_user.first_name = first_name
            if not existing_user.last_name:
                existing_user.last_name = last_name
            existing_user.last_login = datetime.utcnow()
            session.add(existing_user)
            session.commit()
            user = existing_user
        else:
            user = User(
                email=email,
                provider=ProviderEnum.github,
                hashed_password=None,
                first_name=first_name,
                last_name=last_name,
                bio=None,
                location=user_info.get("location", None),
                timezone="UTC",  # Default timezone, could be derived from GitHub if available
                theme_preference="dark",  # Default theme
                last_login=datetime.utcnow()
            )
            session.add(user)
            session.commit()
            session.refresh(user)

        # Create JWT token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        jwt_token = create_access_token(
            data={"sub": str(user.id), "provider": user.provider, "email": user.email},
            expires_delta=access_token_expires
        )

        redirect_url = f"{FRONTEND_URL}/auth/callback?token={jwt_token}&provider=github"
        logger.info(f"Successfully authenticated GitHub user, redirecting to: {redirect_url}")
        return RedirectResponse(url=redirect_url)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in GitHub callback: {str(e)}")
        return RedirectResponse(url=f"{FRONTEND_URL}/auth/error?provider=github&error=internal_error&details={str(e)}")
    finally:
        # Ensure session is closed even in case of exceptions
        session.close()


@app.get("/auth/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info"""
    return current_user


@app.get("/admin/users", response_model=list[UserResponse])
def get_all_users(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Admin endpoint to view all users with provider labels - requires admin access"""
    # For now, we'll allow any authenticated user to view users
    # In production, you'd want to check if current_user is an admin
    users = session.exec(select(User)).all()
    return users


@app.get("/api/tasks", response_model=list[TaskResponse])
def get_tasks(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    limit: int = 100,
    offset: int = 0
):
    """Get list of user's tasks"""
    tasks = session.exec(
        select(Task)
        .where(Task.user_id == current_user.id)
        .order_by(Task.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    return list(tasks)


@app.post("/api/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create a new task"""
    task = Task(
        title=task_data.title,
        description=task_data.description,
        priority=task_data.priority.value if isinstance(task_data.priority, PriorityEnum) else task_data.priority,
        tags=task_data.tags if task_data.tags else [],
        user_id=current_user.id,
        completed=False
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@app.get("/api/tasks/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get a specific task"""
    task = session.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    if task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this task"
        )

    return task


@app.put("/api/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: uuid.UUID,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update an existing task"""
    task = session.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    if task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this task"
        )

    # Update task fields
    update_data = task_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(task, field, value)

    task.updated_at = datetime.utcnow()
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_200_OK)
def delete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Delete a task"""
    task = session.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    if task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this task"
        )

    session.delete(task)
    session.commit()
    return {"message": "Task deleted successfully", "task_id": str(task_id)}


@app.patch("/api/tasks/{task_id}/complete", response_model=TaskResponse)
def toggle_task_completion(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Toggle task completion status"""
    task = session.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    if task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this task"
        )

    # Toggle completion status
    task.completed = not task.completed
    task.updated_at = datetime.utcnow()
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


# Pydantic model for updating user profile
class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    timezone: Optional[str] = None
    theme_preference: Optional[str] = None


@app.put("/auth/me", response_model=UserResponse)
def update_current_user_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update current user's profile information"""
    # Update allowed fields
    update_data = profile_data.dict(exclude_unset=True)

    for field, value in update_data.items():
        if hasattr(current_user, field):
            setattr(current_user, field, value)

    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    return current_user


# Include the chat router
app.include_router(chat_router)