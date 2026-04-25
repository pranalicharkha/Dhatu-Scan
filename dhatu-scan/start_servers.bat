@echo off
echo Starting Dhatu-Scan Development Servers...

REM Start the Python FastAPI backend in a new command window
start "FastAPI Backend" cmd /k "cd /d %~dp0python-backend && python -m uvicorn app:app --host 0.0.0.0 --port 8000"

REM Start the React Frontend in a new command window
start "React Frontend" cmd /k "cd /d %~dp0src\frontend && pnpm dev"

echo Both servers are starting in separate windows.
echo Once they are ready, open your browser to http://127.0.0.1:5173
pause
