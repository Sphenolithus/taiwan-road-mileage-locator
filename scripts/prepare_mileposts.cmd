@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0prepare_mileposts.ps1" %*
exit /b %ERRORLEVEL%
