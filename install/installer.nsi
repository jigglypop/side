Name "NH AI Plugin"
OutFile "install.exe"
RequestExecutionLevel user
InstallDir "$LOCALAPPDATA\NHAIPlugin"

Var PATH

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "..\dist\*.*"

  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\NHAIPlugin" "DisplayName" "NH AI Plugin"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\NHAIPlugin" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\NHAIPlugin" "InstallLocation" "$INSTDIR"

  StrCpy $0 "$INSTDIR"
  StrCpy $1 ""
loop:
  StrCpy $2 $0 1
  StrCmp $2 "" done
  StrCpy $0 $0 "" 1
  StrCmp $2 "\" slash no_slash
slash:
  StrCpy $2 "/"
no_slash:
  StrCpy $1 "$1$2"
  Goto loop
done:
  SetRegView 64
  WriteRegStr HKCU "Software\Policies\Microsoft\Edge\ExtensionInstallAllowlist" "1" "nkfhcpbppmdkmejcldlkgpblboebhjcl"
  WriteRegStr HKCU "Software\Policies\Microsoft\Edge\ExtensionInstallForcelist" "1" "nkfhcpbppmdkmejcldlkgpblboebhjcl;file:///$1/"
  SetRegView 32
  ExecWait 'taskkill /f /im msedge.exe'
  ReadRegStr $3 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe" ""
  StrCmp $3 "" try_hkcu found
try_hkcu:
  ReadRegStr $3 HKCU "SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe" ""
  StrCmp $3 "" noedge found
noedge:
  MessageBox MB_OK "Extension installed. Restart Edge."
  Goto end
found:
  Exec '"$3"'
  MessageBox MB_OK "Extension installed."
end:
SectionEnd

Section "Uninstall"
  SetRegView 64
  DeleteRegValue HKCU "Software\Policies\Microsoft\Edge\ExtensionInstallForcelist" "1"
  SetRegView 32
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\NHAIPlugin"
SectionEnd
