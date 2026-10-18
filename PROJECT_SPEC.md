# Project: Kids Piano Journey (어린이 피아노 입문 앱)

## 1. Overview
- 대상: 피아노를 처음 접하는 8세 이하 어린이
- 플랫폼: 안드로이드 태블릿 (가로 모드 고정, React + Vite + Capacitor 기반 APK 빌드)
- 하드웨어 환경: 실제 디지털 피아노를 연주하고, 태블릿 마이크가 소리(음고)를 실시간 인식
- 오디오 피드백: 
  - 실제 피아노 소리를 직접 듣기 때문에 기본 가상 피아노 건반 음원은 재생하지 않음
  - 정답 판정 효과음(딩동댕, 별가루 소리) 및 칭찬 비주얼 이펙트 제공

## 2. Core UI/UX Philosophy (Simply Piano 스타일 키즈 특화)
1. 상단 - 가로 스크롤 오선보 (Horizontal Scrolling Sheet Music):
   - 전통적인 높은음자리표 오선지가 오른쪽에서 왼쪽으로 부드럽게 스크롤
   - 판정선(Target Line)에 음표가 도달했을 때 아이가 피아노를 치도록 유도
2. 컬러 음표 (Boomwhackers 무지개 색상 표준 적용):
   - 도(C): 빨강 (#EF4444)
   - 레(D): 주황 (#F97316)
   - 미(E): 노랑 (#EAB308)
   - 파(F): 초록 (#22C55E)
   - 솔(G): 하늘/파랑 (#06B6D4)
   - 음표 머리 안에 한글 음이름('도', '레', '미')과 손가락 번호(1~5) 표기
3. 하단 - 가상 건반 가이드 (Lower Keyboard Guide):
   - 화면 하단에 가온 다 구역(C4~G4)을 큼직한 건반으로 상시 배치
   - 쳐야 할 음에 해당하는 건반이 음표 색상과 동일하게 빛나며 손가락 번호(1~5번) 안내
   - 아이가 실제 피아노를 올바르게 치면 건반이 튕기며 별가루 이펙트 발생

## 3. Tech Stack
- Frontend: React 18, Vite, TypeScript, Tailwind CSS, Lucide-react (아이콘)
- Audio Engine: Web Audio API, Pitchfinder (YIN / AMDF 알고리즘 기반 피아노 피치 인식)
- Visual/Animation: HTML5 Canvas API (오선보 렌더링용), Framer Motion
- Packaging: @capacitor/core, @capacitor/android

## 4. Implementation Milestones
- Phase 1: 마이크 피치 인식 코어 및 디지털 피아노 주파수 검증
- Phase 2: 하단 가온 C 구역 가상 건반 UI & 실시간 피아노 연동
- Phase 3: 오른손 5손가락 자리 튜토리얼 (도~솔 인터랙티브 트레이닝)
- Phase 4: 가로 스크롤 오선보 Canvas + 무지개 음표 + 동요 1곡('비행기') 리듬 게임 루프
- Phase 5: 안드로이드 태블릿 최적화(가로모드 고정, 마이크 권한) 및 Capacitor APK 빌드
