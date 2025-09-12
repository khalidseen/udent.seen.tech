@echo off
chcp 65001 >nul
REM Test Udent System
REM -----------------------------------

cd /d %~dp0

ECHO =============================
ECHO  🧪 Testing Udent System
ECHO =============================
ECHO.

ECHO Checking system requirements...
ECHO Testing Node.js installation...
node --version || ECHO ERROR: Node.js not found!
ECHO.

ECHO Testing npm installation...
npm --version || ECHO ERROR: npm not found!
ECHO.

ECHO Testing project dependencies...
if not exist "node_modules" (
    ECHO WARNING: node_modules folder not found!
    ECHO Run update_udent.bat first.
) else (
    ECHO Dependencies folder found.
)
ECHO.

ECHO Testing package.json...
if not exist "package.json" (
    ECHO ERROR: package.json not found!
) else (
    ECHO package.json found.
)
ECHO.

ECHO Testing port availability...
netstat -an | findstr :8082 >nul && ECHO Port 8082 is in use || ECHO Port 8082 is available
netstat -an | findstr :5173 >nul && ECHO Port 5173 is in use || ECHO Port 5173 is available
netstat -an | findstr :3000 >nul && ECHO Port 3000 is in use || ECHO Port 3000 is available
ECHO.

ECHO Running lint check...
npm run lint 2>nul || ECHO WARNING: Lint check failed or not configured
ECHO.

ECHO Running type check...
npm run type-check 2>nul || ECHO WARNING: Type check failed or not configured
ECHO.

ECHO =============================
ECHO System test completed!
ECHO =============================
pause
