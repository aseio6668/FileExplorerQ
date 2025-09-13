@echo off
echo ==========================================
echo  FileExplorer Q - Version Bump
echo ==========================================
echo.

echo Current version:
findstr "version" package.json

echo.
echo Version bump options:
echo 1. Patch (1.0.0 -> 1.0.1) - Bug fixes
echo 2. Minor (1.0.0 -> 1.1.0) - New features
echo 3. Major (1.0.0 -> 2.0.0) - Breaking changes
echo 4. Custom version
echo 5. Cancel
echo.

set /p choice="Choose option (1-5): "

if "%choice%"=="1" (
    call npm version patch
    echo Patch version updated
) else if "%choice%"=="2" (
    call npm version minor  
    echo Minor version updated
) else if "%choice%"=="3" (
    call npm version major
    echo Major version updated
) else if "%choice%"=="4" (
    set /p newversion="Enter new version (e.g., 1.2.3): "
    call npm version %newversion%
    echo Version updated to %newversion%
) else (
    echo Cancelled
    pause
    exit /b 0
)

if %errorlevel% neq 0 (
    echo ERROR: Version update failed
    pause
    exit /b 1
)

echo.
echo New version:
findstr "version" package.json

echo.
echo Version updated successfully!
echo Run 'quick-package.bat' to build with new version.
echo.
pause