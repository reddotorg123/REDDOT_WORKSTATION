@echo off
title Push REDDOT Workstation to GitHub
echo ============================================================
echo   Pushing REDDOT Workstation OS to GitHub
echo   Remote: https://github.com/reddotorg123/REDDOT_WORKSTATION.git
echo ============================================================
echo.

set "PATH=%LOCALAPPDATA%\MinGit\cmd;%PATH%"

git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ============================================================
    echo   SUCCESSFULLY PUSHED TO GITHUB!
    echo   https://github.com/reddotorg123/REDDOT_WORKSTATION
    echo ============================================================
) else (
    echo.
    echo [NOTE] If prompted above, enter your GitHub Username and Personal Access Token (PAT).
    echo Or create a PAT at: https://github.com/settings/tokens
)

echo.
pause
