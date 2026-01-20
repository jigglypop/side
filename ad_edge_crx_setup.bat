@echo off
set path=%path%;c:\windows;c:\windows\system32\;C:\Windows\System32\WindowsPowerShell\v1.0\;
Powershell.exe -ExecutionPolicy Bypass -File "%~dp0ad_edge_crx_setup.ps1"