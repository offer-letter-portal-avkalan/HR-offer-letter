@echo off
echo Starting Offer Letter Portal...
echo.

REM Start the backend
echo [1/3] Starting backend...
start "Backend" cmd /k "cd /d "%~dp0backend" && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

REM Start the frontend dev server
echo [2/3] Starting frontend...
start "Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

REM Wait 5 seconds for frontend to start, then launch Electron
echo [3/3] Launching Electron app in 5 seconds...
timeout /t 5 /nobreak >nul

cd /d "%~dp0electron"
npm start
