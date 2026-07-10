@echo off
echo ===================================================
echo       Starting APDCL Virtual Assistant Project
echo ===================================================
echo.

echo [1/3] Starting Backend API Server...
start "APDCL Backend" cmd /k "cd /d C:\Users\lenovo\.gemini\antigravity\scratch\apdcl-assistant-v2\backend && venv\Scripts\activate && python run.py"

echo [2/3] Starting Frontend Web Server...
start "APDCL Frontend" cmd /k "cd /d C:\Users\lenovo\.gemini\antigravity\scratch\apdcl-assistant-v2\frontend && npm run dev"

echo [3/3] Waiting 5 seconds for servers to initialize...
timeout /t 5 /nobreak > NUL

echo Opening Website in your default browser...
start http://localhost:3000

echo.
echo All done! You can close this small window now.
echo (Keep the two new black windows open while you are using the app)
pause
