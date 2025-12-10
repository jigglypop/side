Name "NH AI Plugin"
OutFile "install_chrome.exe"
InstallDir "$LOCALAPPDATA\NHAIPlugin"
RequestExecutionLevel user
SilentInstall silent

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "..\dist\*.*"
  
  IfErrors install_fail install_ok
  
  install_fail:
  MessageBox MB_OK|MB_ICONSTOP "Install Failed$\n$\nCould not copy files to:$\n$INSTDIR$\n$\nCheck write permissions."
  Goto end
  
  install_ok:
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\NHAIPlugin" "DisplayName" "NH AI Plugin"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\NHAIPlugin" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\NHAIPlugin" "InstallLocation" "$INSTDIR"
  
  ReadRegStr $0 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" ""
  StrCmp $0 "" try_hkcu found
  try_hkcu:
  ReadRegStr $0 HKCU "SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" ""
  StrCmp $0 "" try_local found
  try_local:
  IfFileExists "$LOCALAPPDATA\Google\Chrome\Application\chrome.exe" 0 try_pf64
  StrCpy $0 "$LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
  Goto found
  try_pf64:
  IfFileExists "$PROGRAMFILES64\Google\Chrome\Application\chrome.exe" 0 try_pf86
  StrCpy $0 "$PROGRAMFILES64\Google\Chrome\Application\chrome.exe"
  Goto found
  try_pf86:
  IfFileExists "$PROGRAMFILES\Google\Chrome\Application\chrome.exe" 0 notfound
  StrCpy $0 "$PROGRAMFILES\Google\Chrome\Application\chrome.exe"
  Goto found
  
  notfound:
  MessageBox MB_OK|MB_ICONEXCLAMATION "Chrome Not Found$\n$\nSearched:$\n- Registry$\n- $LOCALAPPDATA\Google\Chrome$\n- $PROGRAMFILES64\Google\Chrome$\n- $PROGRAMFILES\Google\Chrome$\n$\nExtension installed at:$\n$INSTDIR$\n$\nManual setup:$\n1. Install Chrome$\n2. Go to chrome://extensions$\n3. Enable Developer mode$\n4. Load unpacked > select above path"
  Goto end
  
  found:
  Exec '"$0" --load-extension="$INSTDIR"'
  MessageBox MB_OK|MB_ICONINFORMATION "Install Complete$\n$\nChrome launched with extension.$\n$\nIf extension not visible:$\n1. Close all Chrome windows$\n2. Reopen Chrome$\n3. Click extension icon (puzzle piece)"
  
  end:
SectionEnd

Section "Uninstall"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\NHAIPlugin"
SectionEnd
