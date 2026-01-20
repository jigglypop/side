# ====================================================================
# 설정 변수
# ====================================================================
$extensionId = "paclocbdiglbphpdfehjnfdniadgojki"
$uncPath = "\\d1dxj53aoamg0y.cloudfront.net"
$fileUrl = "file:\\d1dxj53aoamg0y.cloudfront.net"

# 이벤트 로그 설정
$eventLogName = "Application"
$eventSource = "EdgeExtensionInstaller"

# ====================================================================
# updates.xml에서 정보 읽기 함수
# ====================================================================
function Get-UpdateInfo {
    param(
        [string]$XmlPath
    )
    
    try {
        [xml]$xmlContent = Get-Content -Path $XmlPath -Encoding UTF8
        $version = $xmlContent.gupdate.app.updatecheck.version
        $codebase = $xmlContent.gupdate.app.updatecheck.codebase
        
        # codebase에서 파일명 추출
        $fileName = Split-Path $codebase -Leaf
        
        return @{
            Version = $version
            FileName = $fileName
            CodeBase = $codebase
        }
    } catch {
        return $null
    }
}

# ====================================================================
# 이벤트 로그 소스 등록
# ====================================================================
function Initialize-EventLog {
    try {
        if (-not [System.Diagnostics.EventLog]::SourceExists($eventSource)) {
            New-EventLog -LogName $eventLogName -Source $eventSource
        }
    } catch {
        # 이벤트 로그 소스 등록 실패 시 무시 (치명적이지 않음)
    }
}

# ====================================================================
# 이벤트 로그 기록 함수
# ====================================================================
function Write-InstallLog {
    param(
        [string]$Message,
        [string]$EventType = "Information",
        [int]$EventId = 1000
    )
    
    try {
        Write-EventLog -LogName $eventLogName -Source $eventSource -EntryType $EventType -EventId $EventId -Message $Message
    } catch {
        # 로그 기록 실패해도 계속 진행
    }
}

# ====================================================================
# 버전 비교 함수
# ====================================================================
function Compare-Version {
    param(
        [string]$Version1,
        [string]$Version2
    )
    
    try {
        $v1 = [version]$Version1
        $v2 = [version]$Version2
        
        if ($v1 -gt $v2) { return 1 }
        elseif ($v1 -eq $v2) { return 0 }
        else { return -1 }
    } catch {
        return $Version1.CompareTo($Version2)
    }
}

# ====================================================================
# 확장 프로그램 설치 버전 확인 함수
# ====================================================================
function Get-InstalledExtensionVersion {
    param(
        [string]$ExtensionId
    )
    
    $userProfiles = Get-ChildItem "C:\Users" -Directory -ErrorAction SilentlyContinue
    $installedVersions = @()
    
    foreach ($userProfile in $userProfiles) {
        $extensionPath = Join-Path $userProfile.FullName "AppData\Local\Microsoft\Edge\User Data\Default\Extensions\$ExtensionId"
        
        if (Test-Path $extensionPath) {
            $versionFolders = Get-ChildItem -Path $extensionPath -Directory -ErrorAction SilentlyContinue
            
            foreach ($versionFolder in $versionFolders) {
                $manifestPath = Join-Path $versionFolder.FullName "manifest.json"
                
                if (Test-Path $manifestPath) {
                    try {
                        $manifest = Get-Content $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
                        $installedVersions += @{
                            Version = $manifest.version
                            Path = $versionFolder.FullName
                            User = $userProfile.Name
                        }
                    } catch {
                        if ($versionFolder.Name -match '(\d+\.\d+\.\d+\.\d+)') {
                            $installedVersions += @{
                                Version = $matches[1]
                                Path = $versionFolder.FullName
                                User = $userProfile.Name
                            }
                        }
                    }
                }
            }
        }
    }
    
    return $installedVersions
}

# ====================================================================
# 메인 실행
# ====================================================================

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Edge 확장 프로그램 레지스트리 설정" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "확장 프로그램 ID: $extensionId"
Write-Host "파일 경로: $uncPath"
Write-Host ""

Initialize-EventLog

# ====================================================================
# 0-1. updates.xml에서 정보 읽기
# ====================================================================
Write-Host "[0/3] updates.xml에서 버전 정보 읽기..." -ForegroundColor Yellow

$xmlFullPath = Join-Path $uncPath "updates.xml"

if (-not (Test-Path $xmlFullPath)) {
    $errorMsg = "updates.xml 파일을 찾을 수 없습니다: $xmlFullPath"
    Write-Host "✗ $errorMsg" -ForegroundColor Red
    exit 1
}

$updateInfo = Get-UpdateInfo -XmlPath $xmlFullPath

if ($null -eq $updateInfo) {
    $errorMsg = "updates.xml 파일을 읽을 수 없거나 형식이 올바르지 않습니다: $xmlFullPath"
    Write-Host "✗ $errorMsg" -ForegroundColor Red
    exit 1
}

$targetVersion = $updateInfo.Version
$crxFileName = $updateInfo.FileName

Write-Host "✓ updates.xml 정보 읽기 완료" -ForegroundColor Green
Write-Host "  버전: $targetVersion" -ForegroundColor Gray
Write-Host "  CRX 파일: $crxFileName" -ForegroundColor Gray

# ====================================================================
# 0-2. 설치 버전 확인
# ====================================================================
Write-Host "`n설치된 확장 프로그램 버전 확인..." -ForegroundColor Yellow

$installedVersions = Get-InstalledExtensionVersion -ExtensionId $extensionId

if ($installedVersions.Count -gt 0) {
    Write-Host "✓ 설치된 버전 발견:" -ForegroundColor Green
    
    $maxInstalledVersion = $null
    
    foreach ($installed in $installedVersions) {
        Write-Host "  - 버전: $($installed.Version) (사용자: $($installed.User))" -ForegroundColor Gray
        
        if ($null -eq $maxInstalledVersion) {
            $maxInstalledVersion = $installed.Version
        } else {
            $cmp = Compare-Version -Version1 $installed.Version -Version2 $maxInstalledVersion
            if ($cmp -gt 0) {
                $maxInstalledVersion = $installed.Version
            }
        }
    }
    
    Write-Host "`n버전 비교:" -ForegroundColor Cyan
    Write-Host "  설치하려는 버전: $targetVersion" -ForegroundColor White
    Write-Host "  현재 설치된 최고 버전: $maxInstalledVersion" -ForegroundColor White
    
    $comparison = Compare-Version -Version1 $maxInstalledVersion -Version2 $targetVersion
    
    if ($comparison -eq 0) {
        Write-Host "  → 판정: 같은 버전 (설치 불필요)" -ForegroundColor Yellow
        Write-Host "`n설치를 건너뜁니다." -ForegroundColor Gray
        exit 0
    } elseif ($comparison -gt 0) {
        Write-Host "  → 판정: 더 높은 버전이 이미 설치됨 (설치 불필요)" -ForegroundColor Yellow
        Write-Host "`n설치를 건너뜁니다." -ForegroundColor Gray
        exit 0
    } else {
        Write-Host "  → 판정: 상위 버전으로 업데이트 필요 (설치 진행)" -ForegroundColor Green
    }
} else {
    Write-Host "✓ 설치된 확장 프로그램이 없습니다. 신규 설치를 진행합니다." -ForegroundColor Green
}

# ====================================================================
# 1. CRX 파일 존재 확인
# ====================================================================
Write-Host "`n[1/3] CRX 파일 존재 확인..." -ForegroundColor Yellow

$crxFullPath = Join-Path $uncPath $crxFileName

if (Test-Path $crxFullPath) {
    Write-Host "✓ CRX 파일 확인됨: $crxFullPath" -ForegroundColor Green
} else {
    $errorMsg = "CRX 파일을 찾을 수 없습니다: $crxFullPath"
    Write-Host "✗ $errorMsg" -ForegroundColor Red
    exit 1
}

# ====================================================================
# 2. ExtensionInstallForcelist 레지스트리 설정
# ====================================================================
Write-Host "`n[2/3] ExtensionInstallForcelist 레지스트리 설정 중..." -ForegroundColor Yellow

$regPath1 = "HKLM:\SOFTWARE\Policies\Microsoft\Edge\ExtensionInstallForcelist"

try {
    if (-not (Test-Path $regPath1)) {
        New-Item -Path $regPath1 -Force | Out-Null
        Write-Host "  - 레지스트리 키 생성됨" -ForegroundColor Gray
    }
    
    $forcelistValue = "$extensionId;$fileUrl/updates.xml"
    Set-ItemProperty -Path $regPath1 -Name "1" -Value $forcelistValue -Type String
    
    Write-Host "✓ ExtensionInstallForcelist 설정 완료" -ForegroundColor Green
    Write-Host "  값: $forcelistValue" -ForegroundColor Gray
} catch {
    $errorMsg = "ExtensionInstallForcelist 설정 실패: $_"
    Write-Host "✗ $errorMsg" -ForegroundColor Red
    exit 1
}

# ====================================================================
# 3. ExtensionInstallSources 레지스트리 설정
# ====================================================================
Write-Host "`n[3/3] ExtensionInstallSources 레지스트리 설정 중..." -ForegroundColor Yellow

$regPath2 = "HKLM:\SOFTWARE\Policies\Microsoft\Edge\ExtensionInstallSources"

try {
    if (-not (Test-Path $regPath2)) {
        New-Item -Path $regPath2 -Force | Out-Null
        Write-Host "  - 레지스트리 키 생성됨" -ForegroundColor Gray
    }
    
    $installSourceValue = "file://asuka.mooo.com/*"
    Set-ItemProperty -Path $regPath2 -Name "1" -Value $installSourceValue -Type String
    
    Write-Host "✓ ExtensionInstallSources 설정 완료" -ForegroundColor Green
    Write-Host "  값: $installSourceValue" -ForegroundColor Gray
} catch {
    $errorMsg = "ExtensionInstallSources 설정 실패: $_"
    Write-Host "✗ $errorMsg" -ForegroundColor Red
    exit 1
}

# ====================================================================
# 설정 완료 및 로그 기록 (설치했을 때만!)
# ====================================================================
Write-Host "`n======================================" -ForegroundColor Green
Write-Host "레지스트리 설정이 완료되었습니다!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# 성공 로그 기록 (설치 진행했을 때만)
$successMessage = @"
Edge 확장 프로그램 설치 완료

확장 프로그램 ID: $extensionId
CRX 파일명: $crxFileName
설치 버전: $targetVersion
CRX 파일 경로: $crxFullPath
Updates XML: $xmlFullPath

레지스트리 설정:
- ExtensionInstallForcelist: $forcelistValue
- ExtensionInstallSources: $installSourceValue

설치 일시: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
컴퓨터 이름: $env:COMPUTERNAME
설치자: $env:USERNAME
"@

Write-InstallLog -Message $successMessage -EventType "Information" -EventId 1000

Write-Host "`n[다음 단계]" -ForegroundColor Cyan
Write-Host "1. Microsoft Edge를 완전히 종료하세요" -ForegroundColor White
Write-Host "2. Edge를 다시 시작하면 확장 프로그램이 자동으로 설치됩니다" -ForegroundColor White
Write-Host "3. edge://extensions 에서 설치 확인" -ForegroundColor White
Write-Host ""
Write-Host "이벤트 로그 확인: 이벤트 뷰어 > 응용 프로그램 > 원본: $eventSource" -ForegroundColor Gray
