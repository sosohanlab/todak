# 토닥 UI 운영 배포 · 2026-11-16

미리보기에서 검토한 빚기·꾸미기·유약·가마·완성 화면과 반응형 레이아웃을 운영 사이트에 반영한다. 기존 저장소 키와 IndexedDB, 작품 데이터 형식, Clarity 프로젝트와 도메인은 유지한다.

## 포함한 변경

- 통합 작품 정보/보기 전환 바, 안내선 스위치, 단계 이름, 모바일 더보기와 도구 패널.
- 속 직접 파기와 단면 표시, 깎기 접촉 복구, 내벽 다듬기.
- 원형 색상칩과 직접 고르는 색상, 도장 불투명도, 도구 선택.
- 한 화면 안의 360도 감상, 감상 보기 초기화, 기존 저장 작품 감상과 투명 진열 이미지.
- 손끝 크기 3단계와 최대 40단계 되돌리기/다시하기.
- 홈 비공개 피드백과 운영자 이메일 전달, 두 작품 이후 피드백 안내.

## 홍보 주소

| 주소 | 이동 후 UTM |
|---|---|
| https://todak.sosohanlab.com/threads | utm_source=threads&utm_medium=social&utm_campaign=profile |
| https://todak.sosohanlab.com/insta | utm_source=instagram&utm_medium=social&utm_campaign=profile |
| https://todak.sosohanlab.com/ | 별도 캠페인 없음 |

짧은 주소는 별도 서버 없이 GitHub Pages 폴더의 index.html에서 홈페이지로 이동한다. 자바스크립트를 사용할 수 없어도 meta refresh와 링크로 이동한다. 외부 주소로 이동시키거나 URL의 임의 목적지를 실행하지 않는다.

기존 Clarity 초기화의 호스트 조건이 예전 GitHub 주소만 허용하고 있어 실제 todak.sosohanlab.com 도메인도 허용하도록 수정했다. 프로젝트 ID는 기존 값을 유지하며 공유 메타데이터의 기준 주소도 현재 도메인으로 맞췄다.

Clarity 대시보드의 Filters → Traffic → Source에서 threads/instagram을 선택하거나 Custom tags → promotion_channel에서 같은 값을 선택한다. 방문자/세션과 녹화를 채널별로 볼 수 있다. 태그가 없는 유입은 untagged로 표시하며 직접 방문이라고 단정하지 않는다. 플랫폼 게시물 조회 수, 링크를 누르지 않은 사람, 분석 차단 방문까지 집계하는 방식은 아니다. 이전 방문은 소급 분류하지 않는다.

Microsoft 공식 문서: [UTM 필터](https://learn.microsoft.com/en-us/clarity/filters/clarity-filters), [사용자 정의 태그](https://learn.microsoft.com/en-us/clarity/filters/custom-tags). 태그 목록 반영에는 30분~2시간이 걸릴 수 있다.

## 다시 빌드

`node tools/build-public-release.cjs`로 release-site/에 운영 파일을 만든다. tools/studio-base.html은 UI 확장 전 원본이고 ui-layout-preview/의 소스 모듈을 조합한다. 운영 index.html에는 검토용 자동 시작 장면을 넣지 않는다. 같은 이름의 정적 자산에는 내용 해시를 붙여 오래된 CSS 캐시를 피한다. 기존 기본 GitHub Pages 배포 설정을 유지한다.

로컬 검사: `node tools/serve-release-qa.cjs`. 검사용 장면은 로컬 응답에만 주입하며 release-site/에는 저장하지 않는다.

## 배포 확인

배포 후 운영 주소에서 신규 홈, 이전 작품 데이터가 있는 진열장, 모바일/PC UI, 360도 감상, 홍보 주소와 UTM을 확인한다. GitHub 커밋이 성공한 것과 실제 도메인 배포 완료를 구분해 확인한다. 백엔드 피드백 함수는 이미 별도 배포 및 이메일 전달 검사 완료 상태다.

배포 전 운영 파일로 26개 화면 크기 × 12개 장면 312개 조합, 7개 전환 경계 × 3개 장면 21개 조합을 검사했다. 겹침·잘림·가로 넘침·주요 버튼 경계·실행 오류 검사에서 총 333개 조합을 통과했다. 별도로 모바일 도구 패널 드래그·접기·회전, PC/모바일 실제 360도 회전과 저장 작품 재열기, 내벽 다듬기, 색상 되돌리기, 투명 진열 이미지, 첫 사용 안내와 피드백 재시도를 검사했다. 실제 모든 휴대폰을 직접 조작한 결과는 아니며 브라우저 크기/터치 에뮬레이션 결과다.
