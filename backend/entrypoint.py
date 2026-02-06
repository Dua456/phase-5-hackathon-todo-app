"""
Entry point for Railway deployment that directly starts the uvicorn server
to avoid command-line parsing issues with environment variables.
"""
import os
import sys
from uvicorn import Config, Server

# Since we're in the backend folder, import the app from the current module
from main import app

def main():
    # Get port from environment variable, default to 8000
    port = int(os.environ.get("PORT", 8000))

    # Validate port is in acceptable range
    if not (1 <= port <= 65535):
        print(f"Error: Port {port} is out of valid range (1-65535)")
        sys.exit(1)

    print(f"Starting server on port {port}")

    # Create uvicorn config
    config = Config(
        app=app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )

    # Create and run server
    server = Server(config=config)

    try:
        import asyncio
        asyncio.run(server.serve())
    except KeyboardInterrupt:
        print("Server stopped by user")
    except Exception as e:
        print(f"Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()