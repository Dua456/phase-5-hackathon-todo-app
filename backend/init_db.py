"""
Database initialization script for Railway deployment.
This script can be run separately to initialize the database schema.
"""

import os
import time
import logging
from db import create_db_and_tables

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_database(max_retries=10, delay=5):
    """
    Initialize the database with retry logic for cloud environments.

    Args:
        max_retries (int): Maximum number of retry attempts
        delay (int): Delay between retries in seconds
    """
    logger.info("Starting database initialization...")

    for attempt in range(max_retries):
        try:
            logger.info(f"Attempt {attempt + 1}/{max_retries} to initialize database")

            # Call the table creation function
            create_db_and_tables()

            logger.info("Database initialized successfully!")
            return True

        except Exception as e:
            logger.warning(f"Database initialization attempt {attempt + 1} failed: {e}")

            if attempt < max_retries - 1:
                logger.info(f"Waiting {delay} seconds before retry...")
                time.sleep(delay)
                delay *= 1.5  # Increase delay slightly for each retry (exponential backoff)
            else:
                logger.error(f"Failed to initialize database after {max_retries} attempts")
                logger.error(f"Last error: {e}")

    return False

if __name__ == "__main__":
    success = init_database()
    if success:
        logger.info("Database initialization completed successfully")
        exit(0)
    else:
        logger.error("Database initialization failed")
        exit(1)