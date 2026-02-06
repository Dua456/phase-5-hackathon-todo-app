#!/bin/bash

# Todo App Local Development Startup Script

echo "🚀 Starting Todo App Development Servers..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists python3; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Function to start backend
start_backend() {
    echo "📦 Starting backend server..."
    cd backend

    # Check if virtual environment exists, if not create it
    if [ ! -d "venv" ]; then
        echo "🔧 Creating virtual environment..."
        python3 -m venv venv
    fi

    # Activate virtual environment
    source venv/bin/activate

    # Install dependencies if requirements.txt exists
    if [ -f "requirements.txt" ]; then
        echo "📦 Installing backend dependencies..."
        pip install -r requirements.txt
    else
        echo "📦 Installing required packages..."
        pip install fastapi uvicorn python-multipart python-jose[cryptography] passlib[argon2] sqlmodel httpx python-dotenv psycopg2-binary gunicorn groq sentry-sdk[fastapi]
    fi

    # Initialize database
    echo "💾 Initializing database..."
    python init_db.py

    # Start backend server
    echo "📡 Backend server starting on http://localhost:8000"
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
}

# Function to start frontend
start_frontend() {
    echo "🎨 Starting frontend server..."
    cd frontend

    # Install dependencies
    echo "📦 Installing frontend dependencies..."
    npm install

    # Start frontend server
    echo "🌐 Frontend server starting on http://localhost:3000"
    npm run dev
}

# Check if we're in the main project directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Not in the main project directory. Please run this script from the project root."
    exit 1
fi

# Ask user which server to start
echo ""
echo "Select server to start:"
echo "1) Backend only"
echo "2) Frontend only"
echo "3) Both servers (recommended)"
echo "4) Exit"
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "Starting backend server..."
        start_backend
        ;;
    2)
        echo "Starting frontend server..."
        start_frontend
        ;;
    3)
        echo "Starting both servers..."

        # Start backend in background
        cd backend

        # Check if virtual environment exists, if not create it
        if [ ! -d "venv" ]; then
            echo "🔧 Creating virtual environment..."
            python3 -m venv venv
        fi

        # Activate virtual environment
        source venv/bin/activate

        # Install dependencies if needed
        if [ -f "requirements.txt" ]; then
            echo "📦 Installing backend dependencies..."
            pip install -r requirements.txt
        else
            echo "📦 Installing required packages..."
            pip install fastapi uvicorn python-multipart python-jose[cryptography] passlib[argon2] sqlmodel httpx python-dotenv psycopg2-binary gunicorn groq sentry-sdk[fastapi]
        fi

        # Initialize database
        echo "💾 Initializing database..."
        python init_db.py

        echo "📡 Starting backend server on http://localhost:8000"
        uvicorn main:app --reload --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
        BACKEND_PID=$!

        # Wait a moment for backend to start
        sleep 3

        # Start frontend
        cd ../frontend

        # Install dependencies
        echo "📦 Installing frontend dependencies..."
        npm install

        echo "🌐 Starting frontend server on http://localhost:3000"
        npm run dev

        # Kill backend when frontend exits
        kill $BACKEND_PID 2>/dev/null
        ;;
    *)
        echo "👋 Exiting..."
        exit 0
        ;;
esac