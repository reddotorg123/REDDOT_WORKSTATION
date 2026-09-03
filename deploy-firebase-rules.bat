@echo off
title REDDOT - Firebase Security Rules Deployer
echo ==============================================================
echo  REDDOT ENTERPRISE WORKSPACE - FIREBASE SECURITY RULES DEPLOY
echo  Deploying firestore.rules and database.rules.json to Firebase
echo ==============================================================
cd /d "%~dp0"

echo.
echo [1/2] Checking Firebase CLI...
where firebase >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo [2/2] Deploying rules via Firebase CLI...
  firebase deploy --only firestore:rules,database
) else (
  echo [2/2] Deploying rules via npx firebase-tools...
  npx -y firebase-tools deploy --only firestore:rules,database
)

if %ERRORLEVEL% EQU 0 (
  echo.
  echo ==============================================================
  echo  SUCCESS: Hardened Firebase security rules deployed live!
  echo ==============================================================
) else (
  echo.
  echo ==============================================================
  echo  NOTE: If not logged in, run: npx -y firebase-tools login
  echo  Or paste firestore.rules and database.rules.json directly into
  echo  the Firebase Console: https://console.firebase.google.com/
  echo ==============================================================
)

echo.
pause
