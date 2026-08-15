@echo off
set "APP_DIR=%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%APP_DIR%iniciar_gymflow.ps1"
exit /b %ERRORLEVEL%
