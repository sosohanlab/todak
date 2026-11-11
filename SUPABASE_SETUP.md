# 토닥 · Supabase 이미지 검색 연결

이미 연결했다면 Secrets·SQL을 다시 만들 필요는 없습니다. 최신 `supabase/functions/image-search/index.ts`로 함수 코드를 교체하고 **Deploy updates**만 실행하면 사진+종류·크기 검색과 비교 카드용 썸네일 가져오기가 적용됩니다. 웹사이트와 함수 배포는 별개입니다.

토닥 화면은 GitHub Pages에 두고, 검색 요청만 Supabase Edge Functions에서 처리합니다. 별도 Python 호스팅은 필요 없습니다. 이 파일은 설정 안내이며 실제 프로젝트 생성·배포·Secrets 등록은 아직 하지 않았습니다.

## 1. Supabase 프로젝트 만들기

https://supabase.com/dashboard 에서 프로젝트를 만듭니다. 이미 사용할 프로젝트가 있으면 그 프로젝트를 사용해도 됩니다. 이번 검색 기능에는 회원가입이나 로그인 기능을 추가하지 않습니다.

## 2. 검색 횟수 제한 SQL 실행

프로젝트 왼쪽의 **SQL Editor → New query**에서 다음 파일의 전체 내용을 붙여 넣고 **Run**을 누릅니다.

```
supabase/migrations/202611110001_image_search_limits.sql
```

검색 제한과 결과 캐시를 저장하는 전용 비공개 테이블 및 함수가 만들어집니다. 기존 작품·사용자 테이블은 수정하지 않습니다. SQL을 적용하지 않으면 검색 기능은 안전하게 중단되며 SerpApi를 호출하지 않습니다.

## 3. API 키를 Supabase Secrets에 넣기

**Edge Functions → Secrets**에서 다음 값을 등록합니다.

| 이름 | 값 | 필수 여부 |
|---|---|---|
| `SERPAPI_API_KEY` | SerpApi에서 발급받은 실제 키 | 필수 |
| `ALLOWED_ORIGINS` | `https://sosohanlab.github.io` | 기본값과 같으면 생략 가능 |
| `SEARCH_MONTHLY_LIMIT` | `200` | 생략하면 200 |
| `SEARCH_DAILY_LIMIT` | `20` | 생략하면 20 |
| `SEARCH_CLIENT_DAILY_LIMIT` | `5` | 생략하면 5 |
| `SEARCH_RATE_SALT` | 선택: 직접 만든 긴 무작위 문자열 | 생략하면 서버 내부 키로 해싱 |

`ALLOWED_ORIGINS`에는 `/todak/` 같은 경로를 넣지 않습니다. 별도 도메인을 연결했다면 해당 도메인의 정확한 Origin(예: `https://todak.example.com`)으로 바꾸세요. 여러 주소는 쉼표로 구분합니다. 로컬 테스트를 허용하려면 `http://127.0.0.1:8765`를 추가합니다.

`SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`는 Supabase Edge Functions가 제공하는 서버 환경변수를 사용합니다. 이를 `config.js`에 복사할 필요가 없습니다. **SerpApi 키·service_role 키·sb_secret 키는 GitHub 코드나 브라우저에 넣지 마세요.**

## 4. Edge Function 배포

**Edge Functions**에서 새 함수를 만듭니다. 함수 이름은 정확히 **`image-search`**로 정합니다.

대시보드 코드 편집기의 `index.ts`를 다음 파일의 전체 내용으로 교체합니다.

```
supabase/functions/image-search/index.ts
```

이 파일은 추가 SDK나 다른 소스 파일을 import하지 않으므로, 단일 파일을 그대로 붙여 넣으면 됩니다. `Deno.serve`를 사용하는 TypeScript 코드입니다.

이 함수에 한해 **JWT 검증(Verify JWT / Enforce JWT Verification)**을 **OFF**로 설정하고 배포합니다. 플랫폼 JWT 검증을 끄는 이유는 '로그인 없이 바로 만들고 검색하기'를 유지하기 위해서입니다. 브라우저에 비밀 키를 넣어서 401을 우회하지 마세요. CLI 배포를 사용하면 포함된 `supabase/config.toml`의 `verify_jwt = false`가 같은 설정을 담당합니다.

이 함수는 의도적으로 공개 엔드포인트입니다. CORS는 허용한 브라우저 주소를 제한하지만 인증 수단은 아닙니다. 비용 보호는 아래의 DB 공통 한도에서 담당합니다. Supabase 함수 호출량 자체까지 차단하는 인증·CAPTCHA를 구현한 것은 아닙니다.

## 5. 토닥에 함수 주소 연결

배포한 함수의 Invoke URL을 복사합니다. 다음과 같은 모양입니다.

```
https://프로젝트참조값.supabase.co/functions/v1/image-search
```

토닥의 `config.js`에 **이 주소만** 넣습니다.

```js
window.TODAK_CONFIG = {
  searchEndpoint: '복사한 실제 Invoke URL'
};
```

이 주소는 공개해도 됩니다. 공개 설정에는 SerpApi 키나 Supabase 서버 비밀 키가 전혀 필요 없습니다. Supabase `anon`/publishable 키도 이번 구현에서는 브라우저에 넣지 않습니다.

수정 후 다음 명령으로 JavaScript와 OG 이미지 등의 버전 주소를 갱신합니다.

```sh
python tools/refresh_assets.py
```

이후 GitHub에 반영하면 됩니다. **이번 수정 작업에서는 GitHub 업로드·커밋·배포를 실행하지 않았습니다.**

## 6. 동작 확인

1. 토닥에서 작품을 완성합니다.
2. **이 작품과 닮은 도자기 찾기 → 내 작품 이미지로 찾기**를 누릅니다.
3. 표시된 미리보기 사진이 Supabase를 거쳐 SerpApi에 전송됩니다.
4. 이미지 검색 결과 중 가격·사진·HTTPS 판매처 링크가 있는 항목만 후보로 보여줍니다.

상품이 없으면 '찾지 못했어요', 한도 초과면 일/월/접속별 안내가 나옵니다. API 연결 실패는 검색 결과 없음과 구분하고, 사진을 저장해서 Google Lens에 직접 올리는 대안을 보여줍니다. 함수 주소를 아직 넣지 않았으면 '자동 이미지 검색을 준비 중이에요'라고 표시하며 외부 검색 요청을 보내지 않습니다.

## 기본 사용량 제한

| 범위 | 기본 한도 |
|---|---:|
| 전체 월간 신규 검색 시도 | 200회 |
| 전체 일간 신규 검색 시도 | 20회 |
| 같은 접속 주소의 일간 신규 검색 시도 | 5회 |
| 같은 접속 주소의 분간 신규 검색 시도 | 3회 |

- 한도는 Supabase Postgres에서 원자적으로 예약하므로 여러 Edge 인스턴스가 동시에 실행돼도 전체 한도를 넘겨 신규 SerpApi 검색을 시작하지 않습니다.
- 외부 검색이 실패한 시도도 사용량에 포함합니다. 실패를 무제한 재시도해 비용이 늘지 않도록 보수적으로 계산합니다.
- 같은 이미지의 완료된 결과는 10분간 DB 캐시에서 가져오므로 이 함수의 신규 검색 한도를 사용하지 않습니다. 다만 동시에 처음 요청한 동일 이미지는 각각 예약될 수 있습니다.
- 날짜·월 변경은 한국 시간 기준입니다. 접속 주소는 IP를 HMAC으로 해싱한 값만 저장하고 원문 IP는 저장하지 않습니다. 여러 사람이 같은 네트워크를 쓰면 한도를 공유할 수 있습니다. 오래된 접속별 기록은 정리합니다.
- 원본 작품 사진은 Supabase Storage나 DB에 저장하지 않습니다. 사진은 요청 중에만 사용하고 외부 검색 서비스로 전송합니다. 캐시에는 결과 상품 링크·정보만 저장됩니다. 외부 서비스의 사진 보관 정책은 해당 서비스 정책을 따릅니다.
- 이 한도는 **이 함수가 실행하는 SerpApi 신규 검색**을 제한합니다. 같은 API 키를 다른 프로그램에서 사용한 내역이나 Supabase 자체 요청량까지 제한하는 것은 아닙니다. 무료 사용량·요금은 각 서비스에서 별도로 확인하세요.

## CLI를 쓰는 경우

CLI로 배포할 때는 프로젝트 연결 후 다음 순서로 적용할 수 있습니다.

```sh
supabase link --project-ref 실제프로젝트참조값
supabase db push
supabase functions deploy image-search
```

Secrets는 대시보드에서 넣으면 셸 명령 기록에 비밀 키를 남기지 않을 수 있습니다. 기존 프로젝트에 다른 미적용 마이그레이션이 있다면 `db push` 전에 적용 목록을 확인하세요.

## 검증 범위

- Edge Function 요청 처리 테스트: 업로드 사진 기반 요청, CORS, 잘못된/과대 이미지, 키 미설정, 결과 캐시, DB 장애 시 검색 차단, 전체·개별 한도, 외부 오류, 키·IP 응답 미노출.
- 실제 Postgres 엔진(PGlite)에서 SQL 적용과 공통 한도·기간 초기화·캐시 만료·anon 권한 차단 검사.
- 데스크톱·모바일 크기 DOM 시뮬레이션에서 기존 제작 흐름과 Supabase 검색 안내 검사.
- 실제 Supabase 프로젝트·SerpApi 키가 제공되지 않아 운영 배포, 실제 상품 검색, Supabase 네트워크 헤더 검증은 실행하지 않았습니다. 실제 GPU 시각 검수는 이전 수정본과 같은 제한이 있습니다.

공식 문서:
- https://supabase.com/docs/guides/functions/quickstart-dashboard
- https://supabase.com/docs/guides/functions/secrets
- https://supabase.com/docs/guides/functions/auth
- https://serpapi.com/image-api
- https://serpapi.com/google-lens-api
