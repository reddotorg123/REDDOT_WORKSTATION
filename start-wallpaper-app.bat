@echo off
title REDDOT Workstation OS - Development Runner
echo ==============================================================
echo  REDDOT WORKSTATION OS - DESKTOP ^& LIVE WALLPAPER v3.0.1
echo  Runs behind all apps on Windows Desktop with System Tray
echo ==============================================================
cd /d "%~dp0"

echo [1/3] Clearing any prior hung background instances...
taskkill /F /IM "REDDOT Workstation OS.exe" /T >nul 2>&1
taskkill /F /IM "REDDOT-Workstation-OS.exe" /T >nul 2>&1
taskkill /F /IM "electron.exe" /T >nul 2>&1
ping 127.0.0.1 -n 2 >nul

echo [2/3] Synchronizing hotpatch directory...
call node scripts/sync-hotpatch.js

echo [3/3] Launching REDDOT Workstation OS...
if exist "%~dp0app\v2.5.3\win-unpacked\REDDOT Workstation OS.exe" (
  cd /d "%~dp0app\v2.5.3\win-unpacked"
  start "" "REDDOT Workstation OS.exe"
  exit /b 0
) else if exist "%~dp0node_modules\electron\dist\electron.exe" (
  start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0."
  exit /b 0
) else (
  start "" npx -y electron "%~dp0."
  exit /b 0
)
