@echo off
title REDDOT Workstation OS - Development Runner
set ELECTRON_RUN_AS_NODE=
echo ==============================================================
echo  REDDOT WORKSTATION OS - DESKTOP ^& LIVE WALLPAPER v3.0.1
echo  Runs behind all apps on Windows Desktop with System Tray
echo ==============================================================
cd /d "%~dp0"

echo [1/3] Clearing any prior hung background instances...
powershell -NoProfile -Command "Stop-Process -Name 'REDDOT*', 'electron*' -Force -ErrorAction SilentlyContinue" >nul 2>&1
taskkill /F /IM REDDOT* /T >nul 2>&1
taskkill /F /IM electron* /T >nul 2>&1
ping 127.0.0.1 -n 2 >nul

echo [2/3] Synchronizing all app targets and hotpatch...
call node scripts/sync-all-targets.js

echo [3/3] Launching REDDOT Workstation OS (Electron & React Engine)...
if exist "%~dp0node_modules\electron\dist\electron.exe" (
  start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0."
  exit /b 0
) else if exist "%LOCALAPPDATA%\Programs\REDDOT Workstation OS\REDDOT Workstation OS.exe" (
  start "" "%LOCALAPPDATA%\Programs\REDDOT Workstation OS\REDDOT Workstation OS.exe"
  exit /b 0
) else if exist "%LOCALAPPDATA%\Programs\REDDOT-Workstation-OS\REDDOT-Workstation-OS.exe" (
  start "" "%LOCALAPPDATA%\Programs\REDDOT-Workstation-OS\REDDOT-Workstation-OS.exe"
  exit /b 0
) else (
  start "" npx -y electron "%~dp0."
  exit /b 0
)
