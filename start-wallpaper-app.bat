@echo off
title REDDOT Workstation OS - Development Runner
echo ==============================================================
echo  REDDOT WORKSTATION OS - DESKTOP & LIVE WALLPAPER
echo  Runs behind all apps on Windows Desktop with System Tray
echo ==============================================================
cd /d "%~dp0"

:: Check if local electron executable exists
echo Launching REDDOT Workstation OS ^& Wallpaper Desktop App...
if exist "%~dp0node_modules\electron\dist\electron.exe" (
  "%~dp0node_modules\electron\dist\electron.exe" "%~dp0."
) else (
  npx -y electron "%~dp0."
)

if %ERRORLEVEL% NEQ 0 (
  echo Error starting Electron desktop window.
  pause
)
