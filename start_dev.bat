@echo off
title Todo App Local Development Startup

echo 🚀 Starting Todo App Development Servers...

REM Check prerequisites
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

where python >nul 2>nul
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python first.
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Check if we're in the main project directory
if not exist "backend" (
    echo ❌ Backend directory not found. Please run this script from the project root.
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ❌ Frontend directory not found. Please run this script from the project root.
    pause
    exit /b 1
)

REM Display menu
:menu
echo.
echo Select server to start:
echo 1) Backend only
echo 2) Frontend only
echo 3) Both servers (recommended)
echo 4) Exit
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto start_backend
if "%choice%"=="2" goto start_frontend
if "%choice%"=="3" goto start_both
if "%choice%"=="4" goto exit_script

echo Invalid choice. Please enter 1, 2, 3, or 4.
goto menu

:start_backend
echo Starting backend server...
cd backend

REM Check if virtual environment exists, if not create it
if not exist "venv" (
    echo 🔧 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment and start backend
call venv\Scripts\activate.bat

REM Install dependencies if requirements.txt exists
if exist "requirements.txt" (
    echo 📦 Installing backend dependencies...
    pip install -r requirements.txt
) else (
    echo 📦 Installing required packages...
    pip install fastapi uvicorn python-multipart python-jose[cryptography] passlib[argon2] sqlmodel httpx python-dotenv psycopg2-binary gunicorn groq sentry-sdk[fastapi]
)

REM Initialize database
echo 💾 Initializing database...
python init_db.py

REM Start backend server
echo 📡 Backend server starting on http://localhost:8000
uvicorn main:app --reload --host 0.0.0.0 --port 8000
goto end

:start_frontend
echo Starting frontend server...
cd frontend

REM Install dependencies
echo 📦 Installing frontend dependencies...
npm install

REM Start frontend server
echo 🌐 Frontend server starting on http://localhost:3000
npm run dev
goto end

:start_both
echo Starting both servers...

REM Start backend in a separate window
start "Todo App Backend" cmd /k "cd /d %cd%\backend && call venv\Scripts\activate.bat && if exist requirements.txt (pip install -r requirements.txt) else (pip install fastapi uvicorn python-multipart python-jose[cryptography] passlib[argon2] sqlmodel httpx python-dotenv psycopg2-binary gunicorn groq sentry-sdk[fastapi]) && python init_db.py && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in current window
cd frontend

REM Install dependencies
echo 📦 Installing frontend dependencies...
npm install

REM Start frontend server
echo 🌐 Frontend server starting on http://localhost:3000
echo When you're done developing, close both windows to stop the servers.
npm run dev

goto end

:exit_script
echo 👋 Exiting...
exit /b 0

:end
pause