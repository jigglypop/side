Name "NH AI Plugin"
OutFile "install.exe"
RequestExecutionLevel user
InstallDir "$LOCALAPPDATA\NHAIPlugin"

Section "Install"
  
  SetOutPath "$INSTDIR"
  File /r "..\dist\*.*"
  
  IfErrors install_fail install_ok
  
  install_fail:
  MessageBox MB_OK|MB_ICONSTOP "ERROR: File Copy Failed. Check permissions for '..\dist' and target folder: $INSTDIR"
  Goto end
  
  install_ok:
  
  ; --- Standard Uninstall Info Registration (HKCU) ---
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\NHAIPlugin" "DisplayName" "NH AI Plugin"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\NHAIPlugin" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\NHAIPlugin" "InstallLocation" "$INSTDIR"
  
  ; --- CRITICAL FIX: Set Registry View to 64-bit to ensure Edge reads the policy ---
  SetRegView 64
  
  ; --- Policy Registration (HKCU) ---
  WriteRegStr HKCU "Software\Policies\Microsoft\Edge\ExtensionInstallForcelist" "1" "$INSTDIR"
  IfErrors policy_fail_1 policy_ok_1
  policy_fail_1:
  MessageBox MB_OK|MB_ICONSTOP "ERROR: Policy 1 Registration Failed (ExtensionInstallForcelist). Check HKCU Registry write permissions."
  Goto end
  policy_ok_1:

  WriteRegDWORD HKCU "Software\Policies\Microsoft\Edge" "DeveloperMode" 1
  IfErrors policy_fail_2 policy_ok_2
  policy_fail_2:
  MessageBox MB_OK|MB_ICONSTOP "ERROR: Policy 2 Registration Failed (DeveloperMode). Check HKCU Registry write permissions."
  Goto end
  policy_ok_2:
  
  ; --- Reset Reg View and Kill Edge ---
  SetRegView 32 ; Reset to default view
  
  MessageBox MB_OK|MB_ICONWARNING "WARNING: Forcing closure of Edge processes to apply policies. Click OK to continue."
  ExecWait 'taskkill /f /im msedge.exe'
  
  ; --- Relaunch Edge ---
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
  ; --- Set Registry View to 64-bit for cleanup ---
  SetRegView 64
  
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\NHAIPlugin"
  DeleteRegValue HKCU "Software\Policies\Microsoft\Edge\ExtensionInstallForcelist" "1"
  DeleteRegValue HKCU "Software\Policies\Microsoft\Edge" "DeveloperMode"
  
  ; --- Reset Reg View ---
  SetRegView 32
  
  MessageBox MB_OK|MB_ICONINFORMATION "Uninstallation Complete."
SectionEnd
