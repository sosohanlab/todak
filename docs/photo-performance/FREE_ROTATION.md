# 자유 회전 추가 검증

360도 감상과 저장 작품 보기에서 quaternion trackball 카메라를 사용합니다. 위아래 회전 제한을 없애고 가장자리 드래그와 두 손가락 비틀기로 roll을 지원합니다. 사진 확대·위치 이동은 기존 동작입니다. 보기 초기화와 다시 열기는 기존 방향으로 복구합니다.

PC 마우스·모바일 터치 에뮬레이션: 수직 8회 연속 스와이프, 대각선, 180도 뒤집힌 실제 이미지, 두 손가락 확대·비틀기, 저장 뷰어, 원본 보존, 사진 저장 검증 통과. 회전 중 rebuild 0회. 실제 휴대전화 하드웨어 성능은 미검증입니다.

기존 사진 5개×4시점 품질 비교와 실제 생성 빌드의 PNG 저장·작품 불러오기 회귀 검사 통과. 데이터 스키마·형태·유약·무늬·사진 배경·CSS 레이아웃은 수정하지 않았습니다.

코드: free-orbit.cjs, optimized/tools/free-orbit-photo.cjs 및 재생성된 optimized/index.html, pottery-renderer.js. 변경은 optimize.cjs/package.cjs/기존 공개 빌드에서도 재현됩니다. 테스트 결과: results/free-orbit/report.json, results/quality-orbit/report.json, results/regressions/report.json.

배포 완료: https://todak-photo-mobile-test.delightfulcrane1.chatgpt.site
소스 커밋: b176f70167d1d19f8081201d036a5e9db37caddc
배포 ID: appgdep_6afbd87126808191baabd29e13e9292a
