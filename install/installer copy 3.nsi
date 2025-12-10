Name "NH AI Plugin"
OutFile "install.exe"
RequestExecutionLevel user
InstallDir "$LOCALAPPDATA\NHAIPlugin"

Section "Install"
  MessageBox MB_OK|MB_ICONINFORMATION "DEBUG: Installation Start. User-level execution."
  MessageBox MB_OK|MB_ICONINFORMATION "DEBUG: Attempting to copy files from '..\dist\*.*'"
  SetOutPath "$INSTDIR"
  File /r "..\dist\*.*"
  IfErrors install_fail install_ok
  install_fail:
  MessageBox MB_OK|MB_ICONSTOP "ERROR: File Copy Failed.$\n$\nCheck file permissions for '..\dist' and target folder: $INSTDIR"
  Goto end
  install_ok:
  MessageBox MB_OK|MB_ICONINFORMATION "DEBUG: File Copy Success."
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\NHAIPlugin" "DisplayName" "NH AI Plugin"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\NHAIPlugin" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\NHAIPlugin" "InstallLocation" "$INSTDIR"
  ReadRegStr $0 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe" ""
  StrCmp $0 "" try_hkcu found
  try_hkcu:
  ReadRegStr $0 HKCU "SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe" ""
  StrCmp $0 "" try_local found
  try_local:
  IfFileExists "$LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe" 0 try_pf64
  StrCpy $0 "$LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe"
  Goto found
  try_pf64:
  IfFileExists "$PROGRAMFILES64\Microsoft\Edge\Application\msedge.exe" 0 try_pf86
  StrCpy $0 "$PROGRAMFILES64\Microsoft\Edge\Application\msedge.exe"
  Goto found
  try_pf86:
  IfFileExists "$PROGRAMFILES\Microsoft\Edge\Application\msedge.exe" 0 notfound
  StrCpy $0 "$PROGRAMFILES\Microsoft\Edge\Application\msedge.exe"
  Goto found
  notfound:
  MessageBox MB_OK|MB_ICONEXCLAMATION "Edge Not Found$\n$\nExtension installed at: $INSTDIR$\n\nManual setup required."
  Goto end
  found:
  Exec '"$0" --load-extension="$INSTDIR"'
  MessageBox MB_OK|MB_ICONINFORMATION "Installation Complete$\n$\nEdge launched with extension. If not visible, close and reopen Edge."
  end:
SectionEnd
Section "Uninstall"
  MessageBox MB_OK|MB_ICONINFORMATION "DEBUG: Starting Uninstall..."
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\NHAIPlugin"
  MessageBox MB_OK|MB_ICONINFORMATION "Uninstallation Complete$\n$\nNH AI Plugin has been removed from your system."
SectionEnd
