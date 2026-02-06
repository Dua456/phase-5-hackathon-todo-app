from sqlmodel import Session, SQLModel
from typing import Generator, Callable, TypeVar, Any
import os
import time
from sqlalchemy import text
from sqlalchemy.exc import DisconnectionError, OperationalError

def get_engine():
    """Create and return SQLAlchemy engine with proper DATABASE_URL"""
    from sqlmodel import create_engine  # Import here to avoid circular import issues
    from sqlalchemy.pool import QueuePool

    # Database URL from environment variable (with fallback for safety)
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "sqlite:///./todoapp.db"  # Use SQLite for local development as fallback
    )

    # Handle different database URL schemes for production
    if DATABASE_URL.startswith("postgres://"):
        # Convert to postgresql:// for SQLAlchemy compatibility
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    # Get pool configuration from environment variables with sensible defaults
    # Reduced defaults to prevent connection pool exhaustion on platforms like Railway
    pool_size = int(os.getenv("SQLALCHEMY_POOL_SIZE", "5"))  # Smaller default pool
    max_overflow = int(os.getenv("SQLALCHEMY_MAX_OVERFLOW", "10"))  # Smaller overflow
    pool_timeout = int(os.getenv("SQLALCHEMY_POOL_TIMEOUT", "30"))  # Default timeout
    pool_recycle = int(os.getenv("SQLALCHEMY_POOL_RECYCLE", "300"))  # 5 minutes
    pool_pre_ping = os.getenv("SQLALCHEMY_POOL_PRE_PING", "True").lower() in ("true", "1", "yes")  # Verify connections
    connect_timeout = int(os.getenv("SQLALCHEMY_CONNECT_TIMEOUT", "30"))
    command_timeout = int(os.getenv("SQLALCHEMY_COMMAND_TIMEOUT", "60"))

    # Determine if we're using SQLite or PostgreSQL to configure appropriately
    if DATABASE_URL.startswith("sqlite"):
        # SQLite configuration
        engine = create_engine(
            DATABASE_URL,
            echo=False,  # Set to True for debugging SQL queries
            connect_args={"check_same_thread": False}  # Required for SQLite
        )
    else:
        # PostgreSQL configuration for Railway deployment with Neon compatibility
        # Build connect_args dictionary with proper Neon settings
        connect_args = {
            "connect_timeout": connect_timeout,  # Increased timeout for connection attempts
            "command_timeout": command_timeout,  # Increased command timeout
        }

        # Add Neon-specific SSL settings if using Neon
        if "neon" in DATABASE_URL.lower() or "railway" in DATABASE_URL.lower():
            connect_args.update({
                "sslmode": "require",
                "keepalives_idle": 300,  # Start keepalives after 5 minutes
                "keepalives_interval": 30,  # Ping every 30 seconds
                "keepalives_count": 5,  # Close connection after 5 failed pings
            })
        else:
            connect_args["sslmode"] = "require" if "railway" in DATABASE_URL.lower() or "heroku" in DATABASE_URL.lower() else "prefer"

        engine = create_engine(
            DATABASE_URL,
            echo=False,  # Set to True for debugging SQL queries
            poolclass=QueuePool,
            pool_size=pool_size,  # Configurable pool size
            max_overflow=max_overflow,  # Configurable overflow
            pool_pre_ping=pool_pre_ping,  # Verify connections before use (configurable)
            pool_recycle=pool_recycle,  # Recycle connections (5 minutes)
            pool_timeout=pool_timeout,  # Increased timeout
            pool_reset_on_return='commit',  # Reset connections when returned to pool
            pool_pre_reset=lambda conn: conn.rollback(),  # Rollback before returning to pool
            connect_args=connect_args
        )
    return engine

# Get the engine instance (will be refreshed after env vars are loaded)
engine = get_engine()

def get_engine_instance():
    """Function to get the current engine instance, allowing for reinitialization"""
    from sqlmodel import create_engine
    from sqlalchemy.pool import QueuePool

    # Re-read the environment variable and create a fresh engine
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "sqlite:///./todoapp.db"  # Use SQLite for local development as fallback
    )

    # Handle different database URL schemes for production
    if DATABASE_URL.startswith("postgres://"):
        # Convert to postgresql:// for SQLAlchemy compatibility
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    # Get pool configuration from environment variables with sensible defaults
    # Reduced defaults to prevent connection pool exhaustion on platforms like Railway
    pool_size = int(os.getenv("SQLALCHEMY_POOL_SIZE", "5"))  # Smaller default pool
    max_overflow = int(os.getenv("SQLALCHEMY_MAX_OVERFLOW", "10"))  # Smaller overflow
    pool_timeout = int(os.getenv("SQLALCHEMY_POOL_TIMEOUT", "30"))  # Default timeout
    pool_recycle = int(os.getenv("SQLALCHEMY_POOL_RECYCLE", "300"))  # 5 minutes
    pool_pre_ping = os.getenv("SQLALCHEMY_POOL_PRE_PING", "True").lower() in ("true", "1", "yes")  # Verify connections
    connect_timeout = int(os.getenv("SQLALCHEMY_CONNECT_TIMEOUT", "30"))
    command_timeout = int(os.getenv("SQLALCHEMY_COMMAND_TIMEOUT", "60"))

    # Determine if we're using SQLite or PostgreSQL to configure appropriately
    if DATABASE_URL.startswith("sqlite"):
        # SQLite configuration
        engine = create_engine(
            DATABASE_URL,
            echo=False,  # Set to True for debugging SQL queries
            connect_args={"check_same_thread": False}  # Required for SQLite
        )
    else:
        # PostgreSQL configuration for Railway deployment with Neon compatibility
        # Build connect_args dictionary with proper Neon settings
        connect_args = {
            "connect_timeout": connect_timeout,  # Increased timeout for connection attempts
            "command_timeout": command_timeout,  # Increased command timeout
        }

        # Add Neon-specific SSL settings if using Neon
        if "neon" in DATABASE_URL.lower() or "railway" in DATABASE_URL.lower():
            connect_args.update({
                "sslmode": "require",
                "keepalives_idle": 300,  # Start keepalives after 5 minutes
                "keepalives_interval": 30,  # Ping every 30 seconds
                "keepalives_count": 5,  # Close connection after 5 failed pings
            })
        else:
            connect_args["sslmode"] = "require" if "railway" in DATABASE_URL.lower() or "heroku" in DATABASE_URL.lower() else "prefer"

        engine = create_engine(
            DATABASE_URL,
            echo=False,  # Set to True for debugging SQL queries
            poolclass=QueuePool,
            pool_size=pool_size,  # Configurable pool size
            max_overflow=max_overflow,  # Configurable overflow
            pool_pre_ping=pool_pre_ping,  # Verify connections before use (configurable)
            pool_recycle=pool_recycle,  # Recycle connections (5 minutes)
            pool_timeout=pool_timeout,  # Increased timeout
            pool_reset_on_return='commit',  # Reset connections when returned to pool
            pool_pre_reset=lambda conn: conn.rollback(),  # Rollback before returning to pool
            connect_args=connect_args
        )
    return engine

def refresh_engine():
    """Refresh the engine with updated environment variables (call after loading .env)"""
    global engine
    engine = get_engine_instance()

def create_db_and_tables():
    """Create all database tables defined in models.py"""
    # Create all tables from the current models
    # This will only create tables that don't already exist
    # Use the current engine instance to ensure we're using the updated DB URL
    try:
        current_engine = get_engine_instance()
        SQLModel.metadata.create_all(current_engine)
        print("Database tables created successfully")
    except Exception as e:
        print(f"Warning: Could not create database tables: {e}")
        print("This might be because the database is not yet available.")
        print("Tables will be created when the database becomes available.")


T = TypeVar('T')

def execute_with_retry(func: Callable[[], T], max_retries: int = 3, base_delay: float = 0.1) -> T:
    """
    Execute a database function with retry logic for handling connection issues.

    Args:
        func: The function to execute
        max_retries: Maximum number of retry attempts
        base_delay: Base delay in seconds between retries (exponential backoff)

    Returns:
        Result of the function execution
    """
    last_exception = None

    for attempt in range(max_retries + 1):
        try:
            return func()
        except (DisconnectionError, OperationalError) as e:
            last_exception = e
            if attempt < max_retries:
                # Exponential backoff: wait longer after each failed attempt
                delay = base_delay * (2 ** attempt)
                print(f"Database connection error on attempt {attempt + 1}, "
                      f"retrying in {delay}s: {str(e)}")

                # Refresh the engine to get a new connection pool
                from db import refresh_engine
                refresh_engine()

                time.sleep(delay)
            else:
                print(f"Database operation failed after {max_retries + 1} attempts: {str(e)}")
                raise last_exception
        except Exception as e:
            # For other exceptions, don't retry - just re-raise
            raise e

def get_session() -> Generator[Session, None, None]:
    """Dependency to get a database session for each request"""
    session = Session(engine)
    try:
        yield session
    finally:
        # Explicitly close the session to return connection to pool
        session.close()


# Alternative dependency using context manager approach for better error handling
from contextlib import contextmanager

@contextmanager
def get_session_context():
    """Context manager for database sessions - alternative approach"""
    session = Session(engine)
    try:
        yield session
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()