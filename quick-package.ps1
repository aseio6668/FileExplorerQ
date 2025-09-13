# FileExplorer Q - Quick Package Script (PowerShell)
# Right-click -> "Run with PowerShell" or double-click

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host " FileExplorer Q - Quick Package" -ForegroundColor Yellow
Write-Host " (Build + Package in one step)" -ForegroundColor Yellow
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if npm is available
function Test-Npm {
    try {
        $null = Get-Command npm -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

# Check for npm
if (-not (Test-Npm)) {
    Write-Host "ERROR: npm is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

try {
    # Step 1: Build
    Write-Host "[1/2] Building application..." -ForegroundColor Green
    $buildProcess = Start-Process -FilePath "npm" -ArgumentList "run", "build" -Wait -PassThru -NoNewWindow
    
    if ($buildProcess.ExitCode -ne 0) {
        throw "Build failed with exit code $($buildProcess.ExitCode)"
    }
    
    Write-Host "✓ Build completed successfully" -ForegroundColor Green
    Write-Host ""
    
    # Step 2: Package
    Write-Host "[2/2] Creating installer..." -ForegroundColor Green
    Write-Host "This may take a few minutes..." -ForegroundColor Yellow
    
    $packageProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dist:win" -Wait -PassThru -NoNewWindow
    
    if ($packageProcess.ExitCode -ne 0) {
        throw "Packaging failed with exit code $($packageProcess.ExitCode)"
    }
    
    Write-Host "✓ Packaging completed successfully" -ForegroundColor Green
    Write-Host ""
    
    # Success message
    Write-Host "===========================================" -ForegroundColor Cyan
    Write-Host " SUCCESS! Ready for distribution" -ForegroundColor Green
    Write-Host "===========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # List generated files
    Write-Host "Generated files:" -ForegroundColor Yellow
    if (Test-Path "release") {
        Get-ChildItem "release" -Filter "*.exe" | ForEach-Object {
            Write-Host "  📦 $($_.Name)" -ForegroundColor White
        }
        
        $installerSize = (Get-Item "release\FileExplorer Q Setup 1.0.0.exe").Length / 1MB
        Write-Host ""
        Write-Host "📊 Installer size: $([math]::Round($installerSize, 1)) MB" -ForegroundColor Cyan
        Write-Host "📂 Location: $PWD\release\" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "🎉 Install the app: FileExplorer Q Setup 1.0.0.exe" -ForegroundColor Green
    Write-Host "🚀 Or run portable: win-unpacked\FileExplorer Q.exe" -ForegroundColor Green
    
}
catch {
    Write-Host ""
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Try running 'clean.bat' first, then try again" -ForegroundColor Yellow
}

Write-Host ""
$openFolder = Read-Host "Open release folder? (Y/n)"
if ($openFolder -ne "n" -and $openFolder -ne "N") {
    if (Test-Path "release") {
        Start-Process "explorer" -ArgumentList "release"
    }
}

Read-Host "Press Enter to exit"