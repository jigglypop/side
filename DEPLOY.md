# Edge 확장 프로그램 내부망 배포 가이드

## 개요

자체 호스팅 서버에 CRX 파일을 올리고, 대상 PC 레지스트리에 정책을 등록하면 Edge가 자동으로 다운로드/설치/업데이트한다.

```
[빌드] extensions/ -> extensions.crx
            |
[업로드] extensions.crx + updates.xml -> HTTPS 파일 서버
            |
[배포] ad_edge_crx_setup.bat -> 대상 PC 레지스트리 등록
            |
[완료] Edge 재시작 -> 자동 설치
```

---

## 사전 조건

- 대상 PC: 도메인 가입된 Windows + Microsoft Edge
- 파일 서버: HTTPS 접근 가능한 내부 서버 (HTTP 불가, Edge가 차단)
- `extensions.pem`: 서명 키. **분실 시 extension ID가 바뀌어 전체 재배포 필요**

### 현재 값

| 항목 | 값 |
|------|-----|
| Extension ID | `ankogagbhkfkkejnbbilhkocaghbllkj` |
| 서명 키 | `extensions.pem` |
| Update URL | `https://d1dxj53aoamg0y.cloudfront.net/updates.xml` |
| CRX URL | `https://d1dxj53aoamg0y.cloudfront.net/extensions.crx` |

> 내부 서버로 변경 시 `updates.xml`, `ad_edge_crx_setup.ps1`, `src/manifest.json`의 URL을 모두 수정한다.

---

## 1. 빌드

소스 코드를 수정한 뒤 빌드한다.

```bash
npm run build
```

빌드 결과가 `extensions/` 디렉토리에 반영되는지 확인한다.

---

## 2. CRX 패킹

빌드된 `extensions/` 폴더를 CRX로 패킹한다. **반드시 같은 `extensions.pem` 키를 사용**해야 extension ID가 유지된다.

```cmd
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" ^
  --pack-extension=E:\side\extensions ^
  --pack-extension-key=E:\side\extensions.pem
```

실행하면 `extensions.crx`가 생성된다.

### 검증

```bash
# Extension ID 확인 (node.js)
node -e "
const fs = require('fs');
const crypto = require('crypto');
const buf = fs.readFileSync('extensions.crx');
const headerSize = buf.readUInt32LE(8);
const header = buf.slice(12, 12 + headerSize);
function readVarint(b, p) {
  let r=0,s=0,c; do{c=b[p++];r|=(c&0x7f)<<s;s+=7}while(c&0x80); return[r,p];
}
if (header[0]===0x12) {
  let [l,p]=readVarint(header,1), sub=header.slice(p,p+l);
  if (sub[0]===0x0a) {
    let [kl,kp]=readVarint(sub,1), key=sub.slice(kp,kp+kl);
    const h=crypto.createHash('sha256').update(key).digest('hex');
    const id=h.slice(0,32).split('').map(c=>String.fromCharCode(97+parseInt(c,16))).join('');
    console.log('Extension ID:', id);
  }
}
"
```

출력이 `ankogagbhkfkkejnbbilhkocaghbllkj`인지 확인한다.

---

## 3. updates.xml 버전 갱신

`extensions/manifest.json`의 `version`을 올렸으면 `updates.xml`도 맞춰야 한다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gupdate xmlns="http://www.google.com/update2/response" protocol="2.0">
  <app appid="ankogagbhkfkkejnbbilhkocaghbllkj">
    <updatecheck
      codebase="https://내부서버/경로/extensions.crx"
      version="0.2.0" />
  </app>
</gupdate>
```

| 필드 | 설명 |
|------|------|
| `appid` | Extension ID. 변경 금지 |
| `codebase` | CRX 다운로드 URL. 내부 서버 주소로 변경 |
| `version` | `extensions/manifest.json`의 `version`과 반드시 일치 |

---

## 4. 서버 업로드

`extensions.crx`와 `updates.xml` 두 파일을 HTTPS 파일 서버에 업로드한다.

### AWS S3/CloudFront 사용 시

```bash
aws s3 cp extensions.crx s3://버킷명/extensions.crx \
  --content-type "application/x-chrome-extension"

aws s3 cp updates.xml s3://버킷명/updates.xml \
  --content-type "text/xml"

# CloudFront 캐시 무효화
aws cloudfront create-invalidation \
  --distribution-id 배포ID --paths "/*"
```

### 내부 웹서버 사용 시

Nginx/IIS 등에 두 파일을 배치한다. CRX의 Content-Type이 올바른지 확인:

| 파일 | Content-Type |
|------|-------------|
| `extensions.crx` | `application/x-chrome-extension` |
| `updates.xml` | `text/xml` |

---

## 5. 대상 PC 배포

### 방법 A: 스크립트 실행 (소규모)

`ad_edge_crx_setup.bat` + `ad_edge_crx_setup.ps1` 두 파일을 대상 PC에 복사한 뒤:

1. `ad_edge_crx_setup.bat` 우클릭 > **관리자 권한으로 실행**
2. Edge 재시작

스크립트가 하는 일: 아래 레지스트리 값 하나를 등록한다.

```
HKLM\SOFTWARE\Policies\Microsoft\Edge\ExtensionInstallForcelist
  "1" = "ankogagbhkfkkejnbbilhkocaghbllkj;https://내부서버/경로/updates.xml"
```

### 방법 B: GPO (대규모, 권장)

스크립트 없이 Active Directory 그룹 정책으로 직접 등록한다.

1. 그룹 정책 관리 콘솔(gpmc.msc) > 새 GPO 생성
2. GPO 편집:
   - 컴퓨터 구성 > 관리 템플릿 > Microsoft Edge > 확장
   - **"자동으로 설치되는 확장 구성"** (ExtensionInstallForcelist) 정책 열기
   - "사용"으로 설정
   - "표시" 클릭 후 값 추가:
     ```
     ankogagbhkfkkejnbbilhkocaghbllkj;https://내부서버/경로/updates.xml
     ```
3. GPO를 대상 OU에 연결
4. 대상 PC 재로그인 또는 `gpupdate /force` 실행

> GPO 관리 템플릿이 없으면 [Microsoft Edge 정책 템플릿](https://www.microsoft.com/ko-kr/edge/business/download)을 다운로드하여 중앙 저장소에 추가한다.

### 방법 C: 로그인 스크립트

GPO > 컴퓨터 구성 > Windows 설정 > 스크립트(시작/종료) > **시작 스크립트**에 `ad_edge_crx_setup.bat` 경로를 등록한다.

PC 부팅마다 실행되며, 이미 등록된 경우 중복 등록하지 않는다.

---

## 6. 버전 업데이트

신규 버전을 배포할 때 **대상 PC에서 추가 작업은 불필요**하다. Edge가 자동으로 처리한다.

1. `extensions/manifest.json`의 `version` 수정 (예: `0.2.0` -> `0.3.0`)
2. CRX 재패킹 (같은 `.pem` 키 사용)
3. `updates.xml`의 `version` 수정
4. 서버에 `extensions.crx` + `updates.xml` 재업로드

Edge는 수 시간 간격으로 `updates.xml`을 확인하고, 새 버전이 있으면 자동 다운로드/설치한다.

---

## 내부 서버로 URL 변경 시 수정 대상

CloudFront URL을 내부 서버로 바꿀 때 수정해야 할 파일 목록:

| 파일 | 수정 내용 |
|------|----------|
| `updates.xml` | `codebase` 속성의 URL |
| `ad_edge_crx_setup.ps1` | `$updateUrl` 변수 |
| `src/manifest.json` | `update_url` 필드 |
| `extensions/manifest.json` | `update_url` 필드 |

수정 후 CRX를 재패킹하고, 신규 CRX + updates.xml을 내부 서버에 업로드한다.

---

## 트러블슈팅

### 설치가 안 됨

1. 레지스트리 확인: `HKLM\SOFTWARE\Policies\Microsoft\Edge\ExtensionInstallForcelist`에 값이 있는지
2. `edge://policy` 접속: Edge가 정책을 인식하는지 (도메인 가입 PC에서만 작동)
3. `edge://extensions` 접속: 확장이 표시되는지

### 비도메인 PC에서 테스트

정책 방식이 안 먹히므로 External Extensions 레지스트리를 사용한다:

```
HKLM\SOFTWARE\Microsoft\Edge\Extensions\ankogagbhkfkkejnbbilhkocaghbllkj
  "update_url" = "https://서버/updates.xml"
```

이 방식은 "알려진 출처가 아님" 경고가 표시된다. 테스트 용도로만 사용.

### Extension ID가 바뀜

`extensions.pem`이 아닌 다른 키로 패킹한 경우 발생. 반드시 원본 `extensions.pem`으로 패킹해야 한다.

### updates.xml 버전 불일치

`updates.xml`의 `version`과 CRX 내부 `manifest.json`의 `version`이 다르면 Edge가 설치를 거부하거나 무한 업데이트 루프에 빠진다. 반드시 일치시킨다.
