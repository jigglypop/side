# NH AI Plugin - 개발자 가이드

## 요구사항

- Node.js 22+
- npm
- Docker (macOS/Linux에서 설치파일 빌드시)

## 로컬 개발

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
```

결과물: `dist/` 폴더

## Chrome 확장 테스트

1. `chrome://extensions/` 열기
2. 개발자 모드 ON
3. "압축해제된 확장 프로그램을 로드합니다" 클릭
4. `dist` 폴더 선택

## Windows 설치파일 빌드

### Windows에서

1. NSIS 설치: https://nsis.sourceforge.io/Download
2. 빌드:

```bash
npm install
npm run build
cd install
makensis installer_chrome.nsi
makensis installer_edge.nsi
```

### macOS/Linux에서

Docker 필요:

```bash
docker build --platform linux/amd64 -t nabla-nsis-wine install/
docker run --rm --platform linux/amd64 -v "$PWD":/app -w /app nabla-nsis-wine bash -c 'npm install && npm run build && cd install && wine "$NSIS_HOME/makensis.exe" installer_chrome.nsi && wine "$NSIS_HOME/makensis.exe" installer_edge.nsi'
```

결과물: `install/install_chrome.exe`, `install/install_edge.exe`

## 프로젝트 구조

```
src/           - 소스코드
public/        - 정적 파일
dist/          - 빌드 결과물
install/       - 설치파일 관련
  Dockerfile
  build_installer.sh
  installer_chrome.nsi
  installer_edge.nsi
  install_chrome.exe
  install_edge.exe
```

## 기술 스택

- React 19
- TypeScript
- Jotai (상태관리)
- TanStack Query
- Vite
- Chrome Extension Manifest V3

## 테스트

```bash
npm test
```
