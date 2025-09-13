@echo off
echo ==========================================
echo  FileExplorer Q - Quick Build Script
echo ==========================================
echo.

echo [1/3] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo.
echo [2/3] Building application...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo [3/3] Testing application...
echo Starting FileExplorer Q for testing...
echo Press Ctrl+C to stop and continue to packaging
call npm start

echo.
echo Build completed successfully!
echo.
echo Next steps:
echo - Run 'package.bat' to create installer
echo - Run 'quick-package.bat' to build and package in one step
echo.
pause