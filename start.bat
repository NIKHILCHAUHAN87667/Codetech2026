@echo off
REM One-command launcher for Windows: UI + API on http://127.0.0.1:8000
cd /d "%~dp0"
where python >nul 2>nul || (echo Python 3 not found. Install Python 3.10+ and retry. & exit /b 1)
if not exist frontend\dist\index.html (
  where npm >nul 2>nul || (echo frontend\dist is missing and npm is not installed. Install Node.js 20+ then run: cd frontend ^&^& npm ci ^&^& npm run build & exit /b 1)
  echo Building frontend (first run only)...
  pushd frontend
  call npm ci --no-audit --no-fund
  call npm run build
  popd
)
cd backend
echo Starting SAT-SA on http://127.0.0.1:8000  (Ctrl+C to stop)
python -m sat_sa
