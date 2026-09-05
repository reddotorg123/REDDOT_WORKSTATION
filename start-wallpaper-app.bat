@echo off
title REDDOT Workstation OS - Development Runner
echo ==============================================================
echo  REDDOT WORKSTATION OS - DESKTOP ^& LIVE WALLPAPER
echo  Runs behind all apps on Windows Desktop with System Tray
echo ==============================================================
cd /d "%~dp0"

:: Check for Standalone Portable Executable first (zero-dependency)
echo Launching REDDOT Workstation OS ^& Live Wallpaper Desktop...
if exist "%~dp0app\v2.5.1\REDDOT-Workstation-OS-Portable\REDDOT-Workstation-OS.exe" (
  echo Launching via standalone portable application...
  cd /d "%~dp0app\v2.5.1\REDDOT-Workstation-OS-Portable"
  start "" "REDDOT-Workstation-OS.exe"
  exit /b 0
) else if exist "%~dp0node_modules\electron\dist\electron.exe" (
  "%~dp0node_modules\electron\dist\electron.exe" "%~dp0."
) else (
  npx -y electron "%~dp0."
)

if %ERRORLEVEL% NEQ 0 (
  echo Error starting Electron desktop window.
  pause
)
