#!/bin/bash
cd "$(dirname "$0")/.."

echo "Building project..."
npm run build

echo "Compiling Installers..."
cd install
if [ -n "$NSIS_HOME" ] && [ -f "$NSIS_HOME/makensis.exe" ]; then
    wine "$NSIS_HOME/makensis.exe" installer_chrome.nsi
    wine "$NSIS_HOME/makensis.exe" installer_edge.nsi
    echo "Done. install_chrome.exe, install_edge.exe created."
elif command -v makensis &> /dev/null; then
    makensis installer_chrome.nsi
    makensis installer_edge.nsi
    echo "Done. install_chrome.exe, install_edge.exe created."
else
    echo "Error: NSIS not found."
fi
