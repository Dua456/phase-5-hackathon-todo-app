#!/usr/bin/env python3
"""
Railway deployment entry point that handles dynamic port assignment.
"""

import os
import sys
import subprocess
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    # Get the port from environment, default to 8000
    port = os.environ.get('PORT', '8000')

    logger.info(f"Attempting to start server on port: {port}")

    # Verify the port is a valid integer
    try:
        port_num = int(port)
        if port_num < 1 or port_num > 65535:
            raise ValueError("Port out of valid range")
    except ValueError:
        logger.error(f"Invalid port value: '{port}'. Must be an integer between 1 and 65535.")
        sys.exit(1)

    # Verify that backend.main can be imported
    try:
        import backend.main
        logger.info("Successfully imported backend.main module")
    except ImportError as e:
        logger.error(f"Failed to import backend.main: {e}")
        sys.exit(1)

    # Build the uvicorn command with the resolved port
    cmd = [
        sys.executable, '-m', 'uvicorn',
        'backend.main:app',
        '--host', '0.0.0.0',
        '--port', str(port_num)
    ]

    logger.info(f"Executing command: {' '.join(cmd)}")

    # Execute the command
    try:
        os.execvp(sys.executable, cmd)
    except Exception as e:
        logger.error(f"Failed to start uvicorn server: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()