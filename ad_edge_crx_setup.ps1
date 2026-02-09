# Edge 확장 프로그램 자동 설치 (내부망 도메인 PC용)
# 관리자 권한 필요. GPO 배포 또는 수동 실행.

$extensionId = "ankogagbhkfkkejnbbilhkocaghbllkj"
$updateUrl = "https://d1dxj53aoamg0y.cloudfront.net/updates.xml"

# 관리자 권한 확인
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "[X] 관리자 권한이 필요합니다." -ForegroundColor Red
    exit 1
}

# ExtensionInstallForcelist 설정
$regPath = "HKLM:\SOFTWARE\Policies\Microsoft\Edge\ExtensionInstallForcelist"
if (-not (Test-Path $regPath)) { New-Item -Path $regPath -Force | Out-Null }

# 이미 등록된 항목 확인 후 중복 방지
$existing = Get-ItemProperty -Path $regPath -ErrorAction SilentlyContinue
$found = $false
if ($null -ne $existing) {
    $existing.PSObject.Properties | ForEach-Object {
        if ($_.Name -match '^\d+$' -and $_.Value -like "$extensionId;*") { $found = $true }
    }
}

if (-not $found) {
    $maxNum = 0
    if ($null -ne $existing) {
        $existing.PSObject.Properties | ForEach-Object {
            if ($_.Name -match '^\d+$' -and [int]$_.Name -gt $maxNum) { $maxNum = [int]$_.Name }
        }
    }
    Set-ItemProperty -Path $regPath -Name ([string]($maxNum + 1)) -Value "$extensionId;$updateUrl" -Type String
}

Write-Host "[O] 설정 완료. Edge 재시작 시 자동 설치됩니다." -ForegroundColor Green
