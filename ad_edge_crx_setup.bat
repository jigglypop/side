@echo off
setlocal
set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
set "SCRIPT=%~dp0ad_edge_crx_setup.ps1"
set "LOG=%~dp0ad_edge_crx_setup.log"

if not exist "%PS%" (
  echo PowerShell not found: "%PS%"
  exit /b 1
)

"%PS%" -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"
set "EXITCODE=%ERRORLEVEL%"
if exist "%LOG%" (
  echo.
  echo [log] %LOG%
)
exit /b %EXITCODE%