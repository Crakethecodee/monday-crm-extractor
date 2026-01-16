@echo off
echo Downloading React files for Chrome extension...
echo.

cd /d "%~dp0"

if not exist "lib" mkdir lib

echo Downloading react.min.js...
powershell -Command "Invoke-WebRequest -Uri 'https://unpkg.com/react@18/umd/react.production.min.js' -OutFile 'lib\react.min.js' -UseBasicParsing"
if %errorlevel% equ 0 (
    echo [OK] react.min.js downloaded
) else (
    echo [ERROR] Failed to download react.min.js
)

echo Downloading react-dom.min.js...
powershell -Command "Invoke-WebRequest -Uri 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js' -OutFile 'lib\react-dom.min.js' -UseBasicParsing"
if %errorlevel% equ 0 (
    echo [OK] react-dom.min.js downloaded
) else (
    echo [ERROR] Failed to download react-dom.min.js
)

echo Downloading babel.min.js (this may take a moment)...
powershell -Command "Invoke-WebRequest -Uri 'https://unpkg.com/@babel/standalone/babel.min.js' -OutFile 'lib\babel.min.js' -UseBasicParsing"
if %errorlevel% equ 0 (
    echo [OK] babel.min.js downloaded
) else (
    echo [ERROR] Failed to download babel.min.js
)

echo.
echo Download complete!
echo.
echo Next steps:
echo 1. Reload your extension in Chrome (chrome://extensions/)
echo 2. Test the popup - it should work now!
echo.
pause

