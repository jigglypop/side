Name "NH AI Plugin"
OutFile "install_edge.exe"
InstallDir "$APPDATA\NHAIPlugin"
RequestExecutionLevel user

Function .onInit
  ExecWait 'taskkill /f /im msedge.exe'
  Sleep 2000
FunctionEnd

Section "Install"
  ExecWait 'taskkill /f /im msedge.exe'
  Sleep 1000

  ; IMPORTANT: Clear error flag before checking directory creation
  ClearErrors
  CreateDirectory "$INSTDIR"
  IfErrors 0 dir_ok
    MessageBox MB_OK|MB_ICONSTOP "Failed to create: $INSTDIR"
    Goto end
  dir_ok:
  
  ; Clear errors before file copy
  ClearErrors
  SetOutPath "$INSTDIR"
  File /r "dist\*.*"
  IfErrors install_fail install_ok

  install_fail:
  MessageBox MB_OK|MB_ICONSTOP "File copy failed to: $INSTDIR"
  Goto end

  install_ok:
  ; Clean registry
  DeleteRegValue HKCU "Software\Policies\Microsoft\Edge\ExtensionInstallForcelist" "1"
  DeleteRegValue HKCU "Software\Policies\Microsoft\Edge\ExtensionInstallAllowlist" "1"
  DeleteRegKey HKCU "Software\Microsoft\Edge\Extensions\ibeccohaddeajifhkmoagjockkhckkmn"
  DeleteRegKey HKCU "Software\Microsoft\Edge\Extensions\nkfhcpbppmdkmejcldlkgpblboebhjcl"

  ; Uninstall info
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\NHAIPlugin" "DisplayName" "NH AI Plugin"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\NHAIPlugin" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\NHAIPlugin" "InstallLocation" "$INSTDIR"

  ; Find Edge
  ReadRegStr $0 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe" ""
  StrCmp $0 "" try_hkcu found_edge
  try_hkcu:
  ReadRegStr $0 HKCU "SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe" ""
  StrCmp $0 "" try_local found_edge
  try_local:
  IfFileExists "$LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe" 0 notfound
  StrCpy $0 "$LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe"
  Goto found_edge

  notfound:
  MessageBox MB_OK|MB_ICONEXCLAMATION "Edge not found."
  Goto end

  found_edge:
  ; Shortcuts
  CreateShortCut "$DESKTOP\NH AI Plugin.lnk" "$0" \
    '--load-extension="$INSTDIR"' \
    "" 0 SW_SHOWNORMAL \
    "" "Launch Edge with NH AI Plugin"

  CreateDirectory "$SMPROGRAMS\NH AI Plugin"
  CreateShortCut "$SMPROGRAMS\NH AI Plugin\NH AI Plugin.lnk" "$0" \
    '--load-extension="$INSTDIR"' \
    "" 0 SW_SHOWNORMAL \
    "" "Launch Edge with NH AI Plugin"
  CreateShortCut "$SMPROGRAMS\NH AI Plugin\Uninstall.lnk" "$INSTDIR\Uninstall.exe"

  ; Launch
  Exec '"$0" --load-extension="$INSTDIR"'
  
  end:
SectionEnd

Section "Uninstall"
  RMDir /r "$INSTDIR"
  Delete "$DESKTOP\NH AI Plugin.lnk"
  RMDir /r "$SMPROGRAMS\NH AI Plugin"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\NHAIPlugin"
  MessageBox MB_OK|MB_ICONINFORMATION "Uninstallation Complete."
SectionEnd
