#!/bin/bash
# Startup script for Railway deployment

echo "Starting application with database initialization..."

# Start the database initialization in the background
echo "Initializing database in background..."
python /app/init_db.py &

# Small delay to allow database initialization to start
sleep 3

# Start the main application
echo "Starting main application..."
exec python /app/entrypoint.py