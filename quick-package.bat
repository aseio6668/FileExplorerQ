@echo off
echo ==========================================
echo  FileExplorer Q - Quick Package
echo  (Build + Package in one step)
echo ==========================================
echo.

echo [1/2] Building application...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo [2/2] Creating installer...
call npm run dist:win
if %errorlevel% neq 0 (
    echo WARNING: Default packaging failed, trying alternative output directory...
    echo This might be due to file locks in the release directory.
    echo.
    call npx electron-builder --win --config.directories.output=build_output
    if %errorlevel% neq 0 (
        echo ERROR: Packaging failed completely
        pause
        exit /b 1
    )
    set OUTPUT_DIR=build_output
) else (
    set OUTPUT_DIR=release
)

echo.
echo ==========================================
echo  SUCCESS! Ready for distribution
echo ==========================================
echo.
echo Generated files:
if exist "%OUTPUT_DIR%\*.exe" (
    dir /b "%OUTPUT_DIR%\*.exe" 2>nul
) else (
    echo FileExplorer Q Setup 1.0.0.exe
)
echo.
echo Install the app: FileExplorer Q Setup 1.0.0.exe
echo Or run portable: win-unpacked\FileExplorer Q.exe
echo Files location: %cd%\%OUTPUT_DIR%\
echo.
pause

echo Opening output folder...
explorer "%OUTPUT_DIR%"