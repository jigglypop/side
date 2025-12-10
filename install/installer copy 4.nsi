Name "NH AI Plugin"
OutFile "install.exe"
RequestExecutionLevel user
InstallDir "$LOCALAPPDATA\NHAIPlugin"

Var KEY=

Section "Install"
  MessageBox MB_OK|MB_ICONINFORMATION "DEBUG: Installation Start. Applying final security fix."
  SetOutPath "$INSTDIR"
  File /r "..\dist\*.*"
  IfErrors install_fail install_ok
  install_fail:
  MessageBox MB_OK|MB_ICONSTOP "ERROR: File Copy Failed. Check permissions for '..\dist' and target folder: $INSTDIR"
  Goto end
  install_ok:
  MessageBox MB_OK|MB_ICONINFORMATION "DEBUG: File Copy Success. Applying permissions and policy."
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\NHAIPlugin" "DisplayName" "NH AI Plugin"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\NHAIPlugin" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\NHAIPlugin" "InstallLocation" "$INSTDIR"
  ExecWait 'icacls "$INSTDIR" /grant %USERNAME%:(F) /t /c /q'
  SetRegView 64
  WriteRegStr HKCU "Software\Policies\Microsoft\Edge\ExtensionInstallForcelist" "1" "$INSTDIR"
  WriteRegDWORD HKCU "Software\Policies\Microsoft\Edge" "DeveloperMode" 1
  SetRegView 32
  ExecWait 'taskkill /f /im msedge.exe'
  ReadRegStr $0 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe" ""
  StrCmp $0 "" try_hkcu found
  try_hkcu:
  ReadRegStr $0 HKCU "SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe" ""
  StrCmp $0 "" notfound found
  notfound:
  MessageBox MB_OK|MB_ICONINFORMATION "Installation Complete. Cannot locate Edge executable. Please relaunch Edge manually and check edge://extensions."
  Goto end
  found:
  Exec '"$0"'
  MessageBox MB_OK|MB_ICONINFORMATION "Installation Complete. Edge relaunched. Check edge://extensions."
  end:
SectionEnd
Section "Uninstall"
  SetRegView 64
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\NHAIPlugin"
  DeleteRegValue HKCU "Software\Policies\Microsoft\Edge\ExtensionInstallForcelist" "1"
  DeleteRegValue HKCU "Software\Policies\Microsoft\Edge" "DeveloperMode"
  SetRegView 32
  MessageBox MB_OK|MB_ICONINFORMATION "Uninstallation Complete."
SectionEnd