@echo off
echo ===================================================
echo   RECALLDESK - Support That Remembers What Happened
echo   HackwithHyderabad 3.0 Full-Stack Innovation
echo ===================================================
echo.

echo Starting Backend Server on http://localhost:8000 ...
start "RECALLDESK Backend" cmd /k "cd backend && python run_backend.py"

timeout /t 2 /nobreak >nul

echo Starting Frontend Dev Server on http://localhost:5173 ...
start "RECALLDESK Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers have been launched in separate windows!
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to exit this launcher window (servers will stay running).
pause >nul
