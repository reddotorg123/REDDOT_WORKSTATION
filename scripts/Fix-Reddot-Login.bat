@echo off
title REDDOT Workstation - Quick Login Reset
echo ===================================================
echo   REDDOT Workstation OS - Quick Login & Cache Reset
echo ===================================================
echo.
echo [1/3] Closing any hanging REDDOT instances...
taskkill /F /IM "REDDOT Workstation OS.exe" >nul 2>&1

echo [2/3] Removing old cache and corrupted files...
if exist "%APPDATA%\reddot-workstation-os\hotpatch" (
    rmdir /S /Q "%APPDATA%\reddot-workstation-os\hotpatch"
    echo   -> Cache cleared successfully!
) else (
    echo   -> Cache already clean.
)

echo [3/3] Launching REDDOT Workstation OS...
if exist "%LOCALAPPDATA%\Programs\REDDOT-Workstation-OS\REDDOT Workstation OS.exe" (
    start "" "%LOCALAPPDATA%\Programs\REDDOT-Workstation-OS\REDDOT Workstation OS.exe"
) else if exist "C:\Program Files\REDDOT Workstation OS\REDDOT Workstation OS.exe" (
    start "" "C:\Program Files\REDDOT Workstation OS\REDDOT Workstation OS.exe"
) else (
    echo Please launch REDDOT Workstation from your desktop shortcut.
)

echo.
echo [SUCCESS] Your workstation is ready! You can now log in normally.
echo Press any key to exit.
pause >nul
