@echo off
cd /d "%~dp0"

if not exist "node_modules" (
  echo Installing dependencies, please wait...
  call npm install
  if errorlevel 1 (
    echo Failed to install dependencies.
    pause
    exit /b 1
  )
)

if not exist "sqlite.db" (
  echo Initializing database...
  call npx tsx scripts\init-db.ts
)

echo.
echo Starting Mechanics Point Score at http://localhost:3000
echo Press Ctrl+C to stop the server.
echo.
call npm run dev
pause
