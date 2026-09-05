@echo off
title Build Regular Windows Installer Setup (.exe)
color 0A
echo =====================================================================
echo  REDDOT WORKSTATION OS - WINDOWS SETUP INSTALLER BUILDER (NSIS)
echo =====================================================================
echo.
echo Packaging REDDOT Workstation OS into standard Windows Setup Installer...
echo Features: Desktop Shortcut, Start Menu Entry, Uninstaller, Custom Directory.
echo Target output folder: app/v2.5.3/
echo.
cd /d "%~dp0"
call npx -y electron-builder --win nsis
if %ERRORLEVEL% EQU 0 (
  echo.
  echo [SUCCESS] Windows Setup Installer (.exe) built successfully!
  echo Check the "app\v2.5.3" folder for: REDDOT-Workstation-OS-Setup.exe
) else (
  echo.
  echo [WARNING] Build encountered an error. Ensure internet connection is active.
)
echo.
pause
