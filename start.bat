@echo off
echo ================================
echo   Local Live - Starting App
echo ================================
 
:: ── Backend setup ───────────────────────────────────────────────
echo.
echo [1/4] Installing backend dependencies...
cd backend
uv pip install fastapi uvicorn[standard] httpx pydantic python-dotenv --system
if %errorlevel% neq 0 (
    echo ERROR: Backend install failed.
    pause
    exit /b 1
)
 
:: ── Database setup ──────────────────────────────────────────────
echo.
echo [2/4] Setting up database...
cd ..\database
if not exist events.db (
    python -c "import sqlite3; conn = sqlite3.connect('events.db'); conn.executescript(open('schema.sql').read()); conn.executescript(open('seed.sql').read()); conn.close(); print('Database created and seeded!')"
) else (
    echo Database already exists, skipping seed.
)
 
:: ── Frontend setup ──────────────────────────────────────────────
echo.
echo [3/4] Installing frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend install failed.
    pause
    exit /b 1
)
 
:: Create .env for frontend if it doesn't exist
if not exist .env (
    echo VITE_API_URL=http://localhost:8000 > .env
    echo Created frontend .env file.
)
 
:: ── Start both servers ──────────────────────────────────────────
echo.
echo [4/4] Starting backend and frontend...
echo.
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173
echo  API Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop both servers.
echo.
 
cd ..
start "Local Live Backend" cmd /k "cd backend && uv run uvicorn main:app --reload"
timeout /t 2 /nobreak >nul
cd frontend && npm run dev