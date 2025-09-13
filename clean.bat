@echo off
setlocal enabledelayedexpansion
echo ==========================================
echo  FileExplorer Q - Clean Build Environment
echo ==========================================
echo.

echo Cleaning build artifacts...
echo.

if exist dist (
    echo Removing dist folder...
    rmdir /s /q dist 2>nul
    if exist dist echo WARNING: Some dist files could not be removed (may be in use)
)

if exist release (
    echo Removing release folder...
    rmdir /s /q release 2>nul
    if exist release echo WARNING: Some release files could not be removed (may be in use)
)

if exist build_output (
    echo Removing build_output folder...
    rmdir /s /q build_output 2>nul
    if exist build_output echo WARNING: Some build_output files could not be removed (may be in use)
)

echo.
echo Optionally clean dependencies:
choice /C YN /M "Remove node_modules (will require npm install afterwards)"
if %errorlevel% equ 1 (
    if exist node_modules (
        echo Removing node_modules...
        rmdir /s /q node_modules 2>nul
        echo.
        echo IMPORTANT: Run 'npm install' before building again.
    )
)

echo.
echo Clean completed!
echo.
echo Next steps:
echo - If you removed node_modules: Run 'npm install'
echo - To build: Run 'build.bat' 
echo - To package: Run 'quick-package.bat'
echo.
pause