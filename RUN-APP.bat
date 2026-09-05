@echo off
title REDDOT Workstation OS Launcher
echo ==============================================================
echo  REDDOT WORKSTATION OS - ENTERPRISE WORKSPACE
echo ==============================================================
cd /d "%~dp0"

echo [1/3] Clearing any prior hung background instances...
taskkill /F /IM "REDDOT-Workstation-OS.exe" /T >nul 2>&1
ping 127.0.0.1 -n 2 >nul

echo [2/3] Launching REDDOT Workstation OS...
if exist "%~dp0app\v2.5.3\win-unpacked\REDDOT Workstation OS.exe" (
  cd /d "%~dp0app\v2.5.3\win-unpacked"
  start "" "REDDOT Workstation OS.exe"
  echo.
  echo [SUCCESS] REDDOT Workstation v2.5.3 launched successfully!
  echo Window is opening on your desktop screen now...
  ping 127.0.0.1 -n 2 >nul
  exit /b 0
)

if exist "%~dp0app\v2.5.3\REDDOT-Workstation-OS-Portable.exe" (
  start "" "%~dp0app\v2.5.3\REDDOT-Workstation-OS-Portable.exe"
  exit /b 0
)

if exist "%~dp0app\v2.5.1\REDDOT-Workstation-OS-Portable\REDDOT-Workstation-OS.exe" (
  cd /d "%~dp0app\v2.5.1\REDDOT-Workstation-OS-Portable"
  start "" "REDDOT-Workstation-OS.exe"
  echo.
  echo [SUCCESS] REDDOT Workstation window launched successfully!
  echo Window is opening on your desktop screen now...
  ping 127.0.0.1 -n 2 >nul
  exit /b 0
)

if exist "%~dp0REDDOT-Workstation.exe" (
  start "" "%~dp0REDDOT-Workstation.exe"
  exit /b 0
)

echo [3/3] Checking fallback dev runner...
call "%~dp0start-wallpaper-app.bat"
