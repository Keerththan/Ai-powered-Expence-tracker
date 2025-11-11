@echo off
echo Starting FinSight - AI-Powered Expense Tracker
echo.

echo Starting Backend Server...
cd backend
start "Backend Server" cmd /k "npm run dev"

echo Starting Frontend Application...
cd ..\frontend
start "Frontend App" cmd /k "npm run dev"

echo.
echo FinSight is starting up!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause