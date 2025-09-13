@echo off
setlocal enabledelayedexpansion
echo ==========================================
echo  FileExplorer Q - Robust Package Builder
echo  (Handles file locks and output directories)
echo ==========================================
echo.

echo [1/3] Building application...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo [2/3] Creating installer...
echo Attempting to create installer with multiple fallback options...
echo.

REM Try default output directory first
echo Trying default release directory...
call npm run dist:win >nul 2>&1
if %errorlevel% equ 0 (
    set OUTPUT_DIR=release
    echo SUCCESS: Built to release directory
    goto :success
)

REM Try alternative output directory
echo Default failed, trying build_output directory...
call npx electron-builder --win --config.directories.output=build_output >nul 2>&1
if %errorlevel% equ 0 (
    set OUTPUT_DIR=build_output
    echo SUCCESS: Built to build_output directory
    goto :success
)

REM Try with forced cleanup
echo Alternative failed, trying with cleanup...
rmdir /s /q release 2>nul
rmdir /s /q build_output 2>nul
call npm run dist:win >nul 2>&1
if %errorlevel% equ 0 (
    set OUTPUT_DIR=release
    echo SUCCESS: Built to release directory after cleanup
    goto :success
)

echo ERROR: All packaging attempts failed
pause
exit /b 1

:success
echo.
echo [3/3] Verifying output...

REM Check if installer was created
if not exist "%OUTPUT_DIR%\FileExplorer Q Setup 1.0.0.exe" (
    echo WARNING: Installer exe not found with expected name
    echo Looking for any exe files...
    if exist "%OUTPUT_DIR%\*.exe" (
        echo Found exe files:
        dir /b "%OUTPUT_DIR%\*.exe"
    ) else (
        echo ERROR: No exe files found in output directory
        pause
        exit /b 1
    )
) else (
    echo SUCCESS: Installer created successfully
)

echo.
echo ==========================================
echo  PACKAGING COMPLETE!
echo ==========================================
echo.
echo Output directory: %OUTPUT_DIR%
echo.
echo Generated files:
if exist "%OUTPUT_DIR%\*.exe" (
    for %%f in ("%OUTPUT_DIR%\*.exe") do echo   %%~nxf
) else (
    echo   FileExplorer Q Setup 1.0.0.exe (expected)
)
echo.
echo Portable version: %OUTPUT_DIR%\win-unpacked\
echo.

choice /C YN /M "Open output folder"
if %errorlevel% equ 1 (
    explorer "%OUTPUT_DIR%"
)

echo.
echo Done! The installer is ready for distribution.
pause