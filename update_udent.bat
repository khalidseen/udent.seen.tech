@echo off
chcp 65001 >nul
REM Update and Install Udent System
REM -----------------------------------

cd /d %~dp0

ECHO =============================
ECHO  📦 Updating Udent Dental System
ECHO =============================
ECHO.

ECHO Checking Node.js and npm versions...
node --version
npm --version
ECHO.

ECHO Updating npm to latest version...
npm install -g npm@latest
ECHO.

ECHO Updating dependencies...
npm install
ECHO.

ECHO Updating development dependencies...
npm update
ECHO.

ECHO Clearing npm cache...
npm cache clean --force
ECHO.

ECHO Checking for security vulnerabilities...
npm audit
ECHO.

ECHO Fixing security vulnerabilities...
npm audit fix
ECHO.

ECHO =============================
ECHO System updated successfully!
ECHO =============================
pause
