@echo off
title Build Standalone Portable Windows Executable (.exe)
color 0B
echo =====================================================================
echo  REDDOT WORKSTATION OS - STANDALONE PORTABLE WINDOWS BUILDER
echo =====================================================================
echo.
echo Packaging REDDOT Workstation Wallpaper App into Standalone Portable Executable...
echo Target output folder: app/v2.5.1/
echo.
cd /d "%~dp0"
npx -y electron-builder --win portable
if %ERRORLEVEL% EQU 0 (
  echo.
  echo [SUCCESS] Portable Executable built successfully!
  echo Check the "app\v2.5.1" directory for your portable .exe files.
) else (
  echo.
  echo [WARNING] Build encountered an error. Ensure internet connection is active for electron-builder binaries.
)
pause
