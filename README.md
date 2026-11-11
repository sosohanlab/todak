# 토닥 · 온라인 도자기 공방

브라우저에서 흙을 빚고 꾸미고 굽는 가벼운 공방 체험입니다. 제작·단면 조작은 Canvas, 완성 화면은 Three.js PBR 렌더링을 사용합니다.

최근 변경과 검토 결과는 **`REVIEW_NOTES.md`**를 참고하세요. Supabase 설정은 **`SUPABASE_SETUP.md`**에 있습니다.

## 로컬 실행

```sh
python server.py
```

브라우저에서 `http://127.0.0.1:8765`를 엽니다. 완성작 제목·용도와 진열장은 이 브라우저에 저장됩니다.

## 이미지 검색

`config.js`에는 공개 Supabase 함수 주소만 넣습니다. SerpApi 및 Supabase 서버 비밀 키는 코드에 넣지 않습니다. 검색은 사용자가 팝업의 버튼을 눌렀을 때만 진행합니다.

선택한 배경의 이미지로만 검색합니다. 도자기 종류·크기·가격 조건은 추가하지 않으며 뜻밖의 물건도 표시합니다. 비교 공유는 검색 결과 하나를 선택해 제목·용도와 함께 작품 옆에 배치합니다.

**이미지만으로 검색하는 서버 수정과 비교 카드 기능을 적용하려면 Supabase의 `image-search` 함수에 `supabase/functions/image-search/index.ts`를 다시 배포하세요.** GitHub 코드 업데이트만으로 Supabase 함수가 자동 변경되지는 않습니다. 기존 Secrets와 DB SQL은 그대로 사용할 수 있습니다.

## 자산 버전과 배포

```sh
python tools/refresh_assets.py
```

파일 내용 해시를 HTML의 `?v=` 주소에 기록합니다. 같은 파일명이어도 이미지·스크립트가 변경되면 새 주소를 사용합니다. 카카오톡 등 외부 공유 서비스의 기존 미리보기 캐시는 별도 갱신이 필요할 수 있습니다.

기존 GitHub Pages 배포 방식을 유지합니다. `.github/workflows/pages.yml`을 따로 적용하려면 Pages Source를 GitHub Actions로 설정해야 합니다. 이 설정은 기존 기본 배포에 필수인 것은 아닙니다.

## 개발 검사

일반 사용에 npm은 필요하지 않습니다. 개발 검사는 Node 24 이상에서 다음과 같이 실행할 수 있습니다.

```sh
npm install
npm test
```

Three.js 라이선스는 `vendor/THREE-LICENSE.txt`에 포함되어 있습니다.
