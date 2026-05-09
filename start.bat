@echo off
echo Starting Trading Journal...
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
start "Trading Journal - Backend" cmd /k "cd /d "%~dp0backend" && npx ts-node-dev --transpile-only --exit-child src/index.ts"
timeout /t 2 /nobreak >nul
start "Trading Journal - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
echo.
echo Both servers starting. Open http://localhost:5173 in your browser.
