# PowerShell script to download React files for Chrome extension
# Run this script from the popup folder

Write-Host "Downloading React files for Chrome extension..." -ForegroundColor Cyan
Write-Host ""

$libPath = Join-Path $PSScriptRoot "lib"

# Create lib folder if it doesn't exist
if (-not (Test-Path $libPath)) {
    New-Item -ItemType Directory -Path $libPath | Out-Null
    Write-Host "Created lib folder" -ForegroundColor Green
}

# Download React
Write-Host "Downloading react.min.js..." -ForegroundColor Yellow
$reactUrl = "https://unpkg.com/react@18/umd/react.production.min.js"
$reactPath = Join-Path $libPath "react.min.js"
try {
    Invoke-WebRequest -Uri $reactUrl -OutFile $reactPath -UseBasicParsing
    Write-Host "✓ Downloaded react.min.js" -ForegroundColor Green
}
catch {
    Write-Host "✗ Failed to download react.min.js: $_" -ForegroundColor Red
}

# Download ReactDOM
Write-Host "Downloading react-dom.min.js..." -ForegroundColor Yellow
$reactDomUrl = "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"
$reactDomPath = Join-Path $libPath "react-dom.min.js"
try {
    Invoke-WebRequest -Uri $reactDomUrl -OutFile $reactDomPath -UseBasicParsing
    Write-Host "✓ Downloaded react-dom.min.js" -ForegroundColor Green
}
catch {
    Write-Host "✗ Failed to download react-dom.min.js: $_" -ForegroundColor Red
}

# Download Babel
Write-Host "Downloading babel.min.js (this may take a moment, file is ~2MB)..." -ForegroundColor Yellow
$babelUrl = "https://unpkg.com/@babel/standalone/babel.min.js"
$babelPath = Join-Path $libPath "babel.min.js"
try {
    Invoke-WebRequest -Uri $babelUrl -OutFile $babelPath -UseBasicParsing
    Write-Host "✓ Downloaded babel.min.js" -ForegroundColor Green
}
catch {
    Write-Host "✗ Failed to download babel.min.js: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Download complete! Files saved to: $libPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Reload your extension in Chrome (chrome://extensions/)" -ForegroundColor White
Write-Host "2. Test the popup - it should work now!" -ForegroundColor White

