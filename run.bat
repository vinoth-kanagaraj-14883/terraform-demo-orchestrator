@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo  Terraform Demo Orchestrator - Windows Startup
echo ============================================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.11+ from https://python.org
    pause
    exit /b 1
)
echo [OK] Python found

:: Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found

:: Check Terraform
terraform --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Terraform not found in PATH. Deployments will fail without Terraform 1.5+.
    echo           Download from https://www.terraform.io/downloads
) else (
    echo [OK] Terraform found
)

echo.
echo Setting up backend...

:: Create virtualenv if not exists
if not exist "backend\venv" (
    echo Creating Python virtual environment...
    python -m venv backend\venv
)

:: Install backend dependencies
echo Installing backend dependencies...
call backend\venv\Scripts\activate.bat
pip install -q -r backend\requirements.txt
call backend\venv\Scripts\deactivate.bat

echo.
echo Setting up frontend...

:: Install frontend dependencies
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    npm install --silent
    cd ..
) else (
    echo [OK] Frontend dependencies already installed
)

echo.
echo Starting services...
echo.

:: Start backend in a new window
echo Starting backend on http://localhost:8000 ...
start "Terraform Orchestrator - Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: Wait a couple seconds for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend in a new window
echo Starting frontend on http://localhost:3000 ...
start "Terraform Orchestrator - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

:: Wait for frontend to start
timeout /t 5 /nobreak >nul

:: Open browser
echo Opening browser...
start "" "http://localhost:3000"

echo.
echo ============================================================
echo  Both services are starting in separate windows.
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:3000
echo  API Docs: http://localhost:8000/docs
echo ============================================================
echo.
echo Press any key to exit this window (services will keep running).
pause >nul
