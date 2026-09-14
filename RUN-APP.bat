@echo off
title REDDOT Workstation OS Launcher
echo ==============================================================
echo  REDDOT WORKSTATION OS - ENTERPRISE WORKSPACE v3.0.1
echo ==============================================================
cd /d "%~dp0"

echo [1/3] Clearing any prior hung background instances...
taskkill /F /IM "REDDOT Workstation OS.exe" /T >nul 2>&1
taskkill /F /IM "REDDOT-Workstation-OS.exe" /T >nul 2>&1
taskkill /F /IM "REDDOT-Workstation.exe" /T >nul 2>&1
taskkill /F /IM "electron.exe" /T >nul 2>&1
ping 127.0.0.1 -n 2 >nul

echo [2/3] Synchronizing all app targets and hotpatch...
call node scripts/sync-all-targets.js

echo [3/3] Launching REDDOT Workstation OS...
if exist "%LOCALAPPDATA%\Programs\REDDOT-Workstation-OS\REDDOT-Workstation-OS.exe" (
  cd /d "%LOCALAPPDATA%\Programs\REDDOT-Workstation-OS"
  start "" "REDDOT-Workstation-OS.exe"
  echo.
  echo [SUCCESS] REDDOT Workstation OS v3.0.1 launched successfully!
  echo Window is opening on your desktop screen now...
  ping 127.0.0.1 -n 2 >nul
  exit /b 0
)

if exist "%~dp0app\v2.5.3\win-unpacked\REDDOT Workstation OS.exe" (
  cd /d "%~dp0app\v2.5.3\win-unpacked"
  start "" "REDDOT Workstation OS.exe"
  echo.
  echo [SUCCESS] REDDOT Workstation OS v3.0.1 launched successfully!
  echo Window is opening on your desktop screen now...
  ping 127.0.0.1 -n 2 >nul
  exit /b 0
)

if exist "%~dp0node_modules\electron\dist\electron.exe" (
  start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0."
  exit /b 0
)

start "" npx electron .
exit /b 0
