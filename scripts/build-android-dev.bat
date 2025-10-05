@echo off
setlocal enabledelayedexpansion

REM build-android-dev.bat - Build Android app with automatic dev server IP detection (Windows)

echo 🔍 Detecting development server IP address...

REM Try to get the IP address of the active network adapter
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4 Address" ^| findstr /v "127.0.0.1"') do (
    set "DEV_SERVER_IP=%%i"
    set "DEV_SERVER_IP=!DEV_SERVER_IP: =!"
    goto :found_ip
)

:found_ip
if "!DEV_SERVER_IP!"=="" (
    echo ⚠️  Could not automatically detect IP address
    set /p DEV_SERVER_IP="Please enter your development machine's IP address: "
)

if "!DEV_SERVER_IP!"=="" (
    echo ❌ No IP address provided. Using automatic detection in app.
    set DEV_SERVER_IP=
) else (
    echo ✅ Using development server IP: !DEV_SERVER_IP!
)

REM Change to Android project directory
cd /d "%~dp0..\app\android"

echo 🔨 Building Android app...

REM Build the debug APK with the detected IP
if not "!DEV_SERVER_IP!"=="" (
    gradlew.bat assembleDebug -PDEV_SERVER_HOST="!DEV_SERVER_IP!"
) else (
    gradlew.bat assembleDebug
)

echo ✅ Build complete!
echo 📱 APK location: app\android\app\build\outputs\apk\debug\app-debug.apk

REM Optionally install the APK if device is connected
where adb >nul 2>nul
if %errorlevel% == 0 (
    adb devices | findstr "device$" >nul
    if !errorlevel! == 0 (
        set /p install_choice="📱 Android device detected. Install APK? (y/n): "
        if /i "!install_choice!"=="y" (
            echo 📲 Installing APK...
            adb install -r app\build\outputs\apk\debug\app-debug.apk
            echo ✅ APK installed successfully!
        )
    ) else (
        echo 📱 No Android device connected via ADB
    )
)

if not "!DEV_SERVER_IP!"=="" (
    echo 🚀 Start your development server with:
    echo    cd app ^&^& bun run dev
    echo 🌐 Server should be accessible at: http://!DEV_SERVER_IP!:3000
)

pause