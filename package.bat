@echo off
echo ==========================================
echo  FileExplorer Q - Package Installer
echo ==========================================
echo.

echo Creating Windows installer and executable...
echo This may take a few minutes...
echo.

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
echo  PACKAGING COMPLETE!
echo ==========================================
echo.
echo Generated files:
if exist "%OUTPUT_DIR%\*.exe" (
    dir /b "%OUTPUT_DIR%\*.exe" 2>nul
) else (
    echo FileExplorer Q Setup 1.0.0.exe
)
echo.
echo Files location: %cd%\%OUTPUT_DIR%\
echo.
echo Installer: FileExplorer Q Setup 1.0.0.exe
echo Portable: win-unpacked\FileExplorer Q.exe
echo.
pause

echo Opening output folder...
explorer "%OUTPUT_DIR%"