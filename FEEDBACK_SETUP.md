# 토닥 비공개 피드백·메일 연결

2026-11-16 연결 및 시험 완료. 미리보기에서 검증한 홈 피드백 UI를 PUBLIC_RELEASE.md의 운영 배포 묶음에 포함했다. 백엔드 메일 연결은 별도로 배포 및 실제 전달 시험을 마쳤다.

## 방문자 동작

홈의 **피드백 남기기** → 기존 작성 창에서 종류·내용 입력 → **의견 보내기**.

방문자의 메일 앱을 열지 않는다. 서버가 내용을 **sosohanlab08@gmail.com**으로 자동 전달한다. 수신 주소 확인은 사용자가 완료했고, 실제 시험 요청의 발송 상태가 sent인 것을 확인했다. 공개 목록·조회 화면은 없다.

두 작품 정도 완성한 뒤 홈으로 돌아오면 버튼 위에 다음 말풍선이 표시된다.

> 개선했으면 하는 점이나 불편했던 부분이 있다면 피드백을 남겨 주세요.

첫 작품 뒤에는 표시하지 않는다. 닫거나 피드백 전송을 완료하면 이후에는 표시하지 않는다. 같은 브라우저의 다른 탭에서도 닫기 상태를 공유한다. 작품 수·닫기 상태는 이 기기의 로컬 저장소에만 기록한다.

## 전송과 비공개 보관

- Supabase 프로젝트: todak, bdyqynoybwwvmnxizcrl.
- 전용 함수: site-feedback, JWT 확인 유지.
- 비공개 스키마: todak_feedback. 기존 검색·작품 데이터와 분리했다.
- anon과 authenticated 역할 모두 스키마·테이블 읽기 및 관련 RPC 실행 권한이 없다. 세 RPC는 SECURITY INVOKER이며 서버 역할만 실행한다.
- 서버 비밀 키는 브라우저나 메일 발송 서비스에 보내지 않는다. 클라이언트 설정에는 공개 anon JWT만 들어간다.
- 원문 IP는 보관하지 않는다. 발송 제한용으로 매일 바뀌는 HMAC만 짧게 보관한다.
- 제출 요청별 임의 ID로 중복 기록을 막는다. 메일 발송은 임시 잠금과 발송 완료 상태를 사용해 같은 요청의 반복 발송을 막는다.
- 실패하면 입력 내용을 유지한다. 서버에 먼저 비공개로 보관하므로 발송 실패 자료도 공개되지 않는다. 방문자가 같은 내용으로 재시도하면 같은 요청 ID를 사용한다.

메일 전달은 [FormSubmit](https://formsubmit.co/)을 사용한다. 해당 서비스는 전달 처리와 함께 제출 기록을 30일 보관한다고 [문서](https://formsubmit.co/documentation)에 안내한다. CC나 방문자 자동 회신은 설정하지 않았다. 방문자의 이메일·사진·작품 파일도 수집하지 않는다.

## 파일

- ui-layout-preview/site-feedback.js / site-feedback.css: 홈 버튼·작성 창·두 작품 후 말풍선.
- ui-layout-preview/site-feedback-config.js: 공개 전송 URL·anon JWT.
- supabase/functions/site-feedback/index.ts: 검증·제한·비공개 저장·소유자 메일 전달.
- supabase/feedback-setup.sql: 새 환경의 비공개 저장 구조와 제출 RPC.
- supabase/feedback-email-setup.sql: 메일 발송 상태·잠금·완료 RPC. 새 환경에서는 위 setup 다음에 적용한다.
- supabase/feedback-function-fix.sql: 초기 연결 시험에서 발견한 변수명 충돌의 기존 환경 교정본. 새 setup에는 이미 반영돼 있다.

함수 재배포 시 deno.json을 포함하고 import_map_path를 deno.json으로 명시한다. 이전 배포의 임시 절대 경로를 재사용하면 배포가 실패할 수 있다.

## 확인한 검사

- 서버 단위 검사 8개: 입력 검증, 허용 출처, 읽기 경로 차단, 과도한 제출 제한, 비밀 값 미노출, 메일 수신 주소 고정, 중복 방지, 수신 확인 미완료 시 성공으로 표시하지 않음.
- 작성 창: 280·320·390·768·1366px. 실패 시 내용 보존, 같은 요청으로 재시도, 성공 시 말풍선 숨김.
- 말풍선: 320·390·768·1366px. 첫 작품 뒤 숨김, 두 작품 뒤 홈에서만 표시, 버튼 위 배치, 닫기 후 재방문·새로고침에서도 숨김.
- 실제 서버: 전송·메일 발송 성공, 같은 ID 재시도 후 기록 1개 및 발송 완료 상태 유지.
- 공개 조회: 함수 GET 405, 비공개 스키마 조회 406, 직접 RPC 호출 401.
- DB 권한: 비로그인·일반 로그인 역할 모두 세 테이블과 세 RPC 접근 차단 확인.

## 기존 프로젝트 점검 기록

새 피드백 테이블의 RLS 정책 없음 INFO는 일반 사용자의 접근을 허용하지 않는 의도된 설정이다. 서버 역할만 별도로 권한을 가진다. [RLS 점검 안내](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

피드백 추가 전부터 있던 public.rls_auto_enable의 실행 권한 경고와 비밀번호 유출 보호 비활성 경고는 이번 기능에서 변경하지 않았다. 피드백 전용 함수는 모두 invoker이며 일반 역할의 실행 권한을 차단했다. 관련 기존 경고 안내: [익명 실행 권한](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [로그인 역할 실행 권한](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [비밀번호 보호](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
