# Edge 확장 프로그램 내부망 배포 가이드

## 전체 흐름

```
[1] 내부 HTTPS 파일서버 준비
         |
[2] 소스 코드 URL 변경 (CloudFront -> 내부서버)
         |
[3] 빌드 + CRX 패킹
         |
[4] 파일서버에 extensions.crx, updates.xml 업로드
         |
[5] GPO로 대상 PC에 정책 배포
         |
[6] 대상 PC Edge 재시작 -> 자동 설치
```

---

## 고정값 (변경 금지)

| 항목 | 값 |
|------|-----|
| Extension ID | `ankogagbhkfkkejnbbilhkocaghbllkj` |
| 서명 키 | `extensions.pem` (분실 시 전체 재배포) |

---

## 1. 내부 HTTPS 파일서버 준비

Edge는 HTTP에서 CRX 다운로드를 차단한다. 반드시 HTTPS여야 한다.

### IIS 예시

1. IIS 관리자에서 새 사이트 생성
2. SSL 인증서 바인딩 (내부 CA 인증서 또는 자체서명 인증서)
3. 사이트 루트에 `edge-extensions/` 폴더 생성
4. MIME 타입 추가:

| 확장자 | MIME Type |
|--------|-----------|
| `.crx` | `application/x-chrome-extension` |
| `.xml` | `text/xml` |

IIS 관리자 > 해당 사이트 > MIME 형식 > 추가:
- 파일 이름 확장명: `.crx`
- MIME 형식: `application/x-chrome-extension`

### Nginx 예시

```nginx
server {
    listen 443 ssl;
    server_name files.내부도메인.com;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /edge-extensions/ {
        root /var/www;
        types {
            application/x-chrome-extension crx;
            text/xml xml;
        }
    }
}
```

### 최종 URL 확인

파일서버가 준비되면 아래 두 URL이 접근 가능해야 한다:

```
https://files.내부도메인.com/edge-extensions/updates.xml
https://files.내부도메인.com/edge-extensions/extensions.crx
```

> 이하 이 URL을 기준으로 설명한다. 실제 도메인/경로에 맞게 대체할 것.

---

## 2. 소스 코드 URL 변경

CloudFront URL을 내부서버 URL로 바꿔야 하는 파일이 **3개**다.

### 2-1. src/manifest.json

```json
"update_url": "https://files.내부도메인.com/edge-extensions/updates.xml",
```

### 2-2. updates.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gupdate xmlns="http://www.google.com/update2/response" protocol="2.0">
  <app appid="ankogagbhkfkkejnbbilhkocaghbllkj">
    <updatecheck
      codebase="https://files.내부도메인.com/edge-extensions/extensions.crx"
      version="0.2.0" />
  </app>
</gupdate>
```

### 2-3. 확인 사항

| 파일 | 변경 필드 | 변경 내용 |
|------|----------|----------|
| `src/manifest.json` | `update_url` | 내부서버 updates.xml URL |
| `updates.xml` | `codebase` | 내부서버 extensions.crx URL |
| `updates.xml` | `version` | manifest.json의 version과 일치 |

`updates.xml`의 `appid`는 절대 변경하지 않는다.

---

## 3. 빌드 + CRX 패킹

### 3-1. 의존성 설치 (최초 1회)

```cmd
npm install
```

### 3-2. 빌드

```cmd
npm run build
```

빌드 결과가 `dist/` 폴더에 생성된다.

### 3-3. CRX 패킹

Edge를 이용해 패킹한다. Edge가 실행 중이면 먼저 종료한다.

```cmd
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" ^
  --pack-extension=E:\side\dist ^
  --pack-extension-key=E:\side\extensions.pem
```

`dist.crx` 파일이 생성된다. `extensions.crx`로 이름을 변경한다:

```cmd
move /Y dist.crx extensions.crx
```

### 3-4. 검증

```cmd
node -e "const fs=require('fs'),c=require('crypto'),b=fs.readFileSync('extensions.crx');const s=b.readUInt32LE(8),h=b.slice(12,12+s);function v(b,p){let r=0,s=0,x;do{x=b[p++];r|=(x&0x7f)<<s;s+=7}while(x&0x80);return[r,p]}if(h[0]===0x12){let[l,p]=v(h,1),u=h.slice(p,p+l);if(u[0]===0x0a){let[k,q]=v(u,1),y=u.slice(q,q+k);const d=c.createHash('sha256').update(y).digest('hex');const i=d.slice(0,32).split('').map(x=>String.fromCharCode(97+parseInt(x,16))).join('');console.log(i==='ankogagbhkfkkejnbbilhkocaghbllkj'?'OK: ID match':'ERROR: ID mismatch - wrong pem key?')}}"
```

`OK: ID match`가 출력되면 정상이다.

---

## 4. 파일서버 업로드

아래 두 파일을 파일서버에 복사한다:

```
extensions.crx -> https://files.내부도메인.com/edge-extensions/extensions.crx
updates.xml    -> https://files.내부도메인.com/edge-extensions/updates.xml
```

### 업로드 후 확인

대상 PC가 접근 가능한 네트워크에서 브라우저로 아래 URL을 열어본다:

- `https://files.내부도메인.com/edge-extensions/updates.xml` - XML 내용이 표시되면 정상
- `https://files.내부도메인.com/edge-extensions/extensions.crx` - 파일 다운로드가 시작되면 정상

SSL 인증서 오류가 나면 내부 CA 인증서가 대상 PC에 설치되어 있는지 확인한다.

---

## 5. GPO 배포

### 5-1. Edge 정책 템플릿 설치 (최초 1회)

도메인 컨트롤러의 그룹 정책 편집기에 "Microsoft Edge" 항목이 없으면 템플릿을 설치한다.

1. [https://www.microsoft.com/ko-kr/edge/business/download](https://www.microsoft.com/ko-kr/edge/business/download) 에서 "정책 파일" 다운로드
   (내부망이면 인터넷 PC에서 다운 후 USB로 반입)
2. 압축 해제
3. 파일 복사:
   ```
   windows\admx\msedge.admx
   windows\admx\msedgeupdate.admx
     -> \\도메인컨트롤러\SYSVOL\도메인명\Policies\PolicyDefinitions\

   windows\admx\ko-KR\msedge.adml
   windows\admx\ko-KR\msedgeupdate.adml
     -> \\도메인컨트롤러\SYSVOL\도메인명\Policies\PolicyDefinitions\ko-KR\
   ```
4. 그룹 정책 편집기를 다시 열면 "Microsoft Edge" 항목이 나타남

### 5-2. GPO 생성 및 설정

1. 도메인 컨트롤러에서 `gpmc.msc` 실행
2. 대상 OU 우클릭 > "이 도메인에서 GPO를 만들어 여기에 연결" 
3. GPO 이름: `Edge 확장 프로그램 - NH AI Plugin`
4. 생성된 GPO 우클릭 > "편집"

### 5-3. 정책 값 입력

GPO 편집기에서:

```
컴퓨터 구성
  > 관리 템플릿
    > Microsoft Edge
      > 확장
        > "자동으로 설치되는 확장 구성"
```

1. "사용"으로 변경
2. 옵션 영역에서 "표시..." 클릭
3. "값" 열에 아래 문자열 입력:

```
ankogagbhkfkkejnbbilhkocaghbllkj;https://files.내부도메인.com/edge-extensions/updates.xml
```

4. 확인 > 적용

### 5-4. 대상 PC에 적용

대상 PC에서:

```cmd
gpupdate /force
```

또는 다음 로그인 시 자동 적용된다.

### 5-5. 설치 확인

대상 PC에서 Edge를 열고:

1. `edge://policy` 접속
   - `ExtensionInstallForcelist` 정책이 표시되고, 값에 extension ID가 보이면 정책 적용 성공
2. `edge://extensions` 접속
   - "NH AI Plugin"이 설치되어 있고, "조직에서 관리됨" 표시가 있으면 완료

---

## 6. 버전 업데이트

대상 PC에서 추가 작업 불필요. Edge가 자동 처리한다.

1. 코드 수정
2. `extensions/manifest.json`(또는 `src/manifest.json`)의 `version` 올리기 (예: `0.2.0` -> `0.3.0`)
3. `npm run build`
4. CRX 재패킹 (같은 `.pem` 키 사용)
5. `updates.xml`의 `version`을 동일하게 수정
6. 파일서버에 `extensions.crx` + `updates.xml` 덮어쓰기

Edge는 수 시간 간격으로 updates.xml을 확인하고, 버전이 올라가 있으면 자동 업데이트한다.

---

## 트러블슈팅

### edge://policy에 정책이 안 보임

- `gpupdate /force` 실행 후 Edge 재시작
- GPO가 해당 OU에 연결되어 있는지 확인
- `gpresult /r`로 적용된 GPO 목록 확인

### 정책은 보이는데 설치 안 됨

- 대상 PC에서 updates.xml URL에 접근 가능한지 확인 (브라우저에서 직접 열어볼 것)
- SSL 인증서 오류 여부 확인 (내부 CA 인증서가 PC에 설치되어 있어야 함)
- updates.xml의 `version`과 CRX manifest의 `version`이 일치하는지 확인
- updates.xml의 `appid`가 `ankogagbhkfkkejnbbilhkocaghbllkj`인지 확인

### Extension ID가 바뀜

`extensions.pem`이 아닌 다른 키로 패킹한 경우 발생. 반드시 원본 `extensions.pem`으로 패킹해야 한다. 키를 분실했으면 새 키로 패킹하고 GPO의 extension ID도 변경해야 한다.

### CRX 다운로드가 안 됨

- 파일서버에서 `.crx` 파일의 Content-Type이 `application/x-chrome-extension`인지 확인
- HTTPS인지 확인 (HTTP는 Edge가 차단)
