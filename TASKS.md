# Implementation Tasks Tracker

## Rules for AI Agent
1. 한 번에 하나의 Phase만 순차적으로 진행한다.
2. 각 Phase 작업이 끝나면 `TASKS.md`의 완료 항목을 `[x]`로 변경한다.
3. 작업 완료 후 사용자에게 브라우저(`npm run dev`)에서 테스트할 수 있는 검증 방법을 안내하고 정지한다.
4. 사용자가 "검증 완료, 다음 진행해"라고 명시적 승인을 하기 전까지 다음 Phase 코드를 절대 먼저 작성하지 않는다.

---

## Phase 1: 마이크 피치 인식 코어 (Completed)
- [x] Vite + React + TypeScript + Tailwind CSS 기본 프로젝트 세팅
- [x] Web Audio API + Pitchfinder(YIN 알고리즘) 기반 `usePitchDetection` 훅 구현
- [x] 디지털 피아노 C3~B5 음역대 주파수(Hz) -> 음이름(C4, D4 등) 매핑 및 옥타브 판정
- [x] 배경 잡음 방지를 위한 볼륨 노이즈 게이트(Threshold) 로직 추가
- [x] 마이크 시작/중지 및 실시간 피치 디버깅 화면 구현
- [x] *Refactoring & Test Shield*: Phase 1 클린업 완료 (데드 필드 제거, 옥타브 배음 보정 순수함수화, Tier 1/2 테스트 하네스 구축 및 전체 Green)
- [x] *Verification*: 브라우저에서 마이크를 켜고 실제 디지털 피아노 '도(C4)', '미(E4)', '솔(G4)'을 쳤을 때 화면에 즉시 정확한 음이름이 반응하는지 확인

## Phase 2: 하단 가상 건반 UI & 실시간 반응 (Completed)
- [x] 화면 하단 가온 C 구역(C4~G4, 5개 흰건반) 큼직한 키즈 스타일 건반 컴포넌트 렌더링 (`VirtualPiano.tsx`)
- [x] 무지개 테마 컬러(도:빨강, 레:주황, 미:노랑, 파:초록, 솔:파랑) 적용
- [x] 마이크로 피아노 소리가 감지되면 해당 가상 건반이 눌리는 시각적 피드백 연동 (3D 눌림 애니메이션 + 무지개 글로우 발광)
- [x] *Refactoring & Test Shield*: Phase 2 클린업 완료 (키보드 훅 분리, 단일 AudioContext 재사용 안정화, SSOT 상수 구축, Tier 1 키 매핑 테스트 통과)
- [x] *Verification*: 실제 피아노 건반을 누를 때 화면 건반이 정확히 동기화되어 빛나는지 확인

## Phase 3: 오른손 5손가락 자리 튜토리얼 (Completed)
- [x] 1번(도)~5번(솔) 손가락 번호 그래픽 및 직관적인 안내 모달 UI (`HandGuideGraphic.tsx`, `TutorialGuide.tsx`)
- [x] 화면이 지정한 건반(예: 1번 도)을 아이가 칠 때까지 대기하는 인터랙티브 루프 (`useFingerTutorial.ts`, `VirtualPiano.tsx` 타깃 포인터)
- [x] 정답 시 딩동댕 칭찬 사운드와 별가루 이펙트 출력 후 다음 음 안내 (`soundEffects.ts`, `ConfettiEffect.tsx`, `TutorialCompletionModal.tsx`)
- [x] *Test Shield*: `tests/tutorialFlow.test.ts` Tier 1 스텝 불변성 & 순수 타깃 매칭 검증 Green Pass
- [x] *Verification*: 화면 안내에 따라 1번부터 5번 건반을 차례로 쳤을 때 단계별로 진행되는지 확인

## Phase 4: 가로 스크롤 오선보 & 동요('비행기') 리듬 게임 (Completed)
- [x] HTML5 Canvas 기반 가로 스크롤 높은음자리표 오선지 렌더링 (`SheetMusicCanvas.tsx`)
- [x] 오른쪽에서 왼쪽으로 흐르는 무지개색 음표 및 중앙 판정선(Target Line) 구현
- [x] 하단 건반 가이드와 오선보 음표의 실시간 매칭 하이라이트 (`VirtualPiano.tsx`)
- [x] 동요 '비행기' 26음표 멜로디 데이터 탑재 및 타이밍 판정 루프 (`songData.ts`, `useRhythmGame.ts`, `SongPlayHeader.tsx`, `SongCompletionModal.tsx`)
- [x] *Test Shield*: `tests/rhythmGame.test.ts` Tier 1 26음표 악보 불변성, 오선보 기하 정렬, 타이밍 판정 검증 Green Pass
- [x] *Verification*: 흐르는 음표에 맞춰 피아노/키보드를 쳤을 때 타이밍에 맞게 점수와 이펙트가 나는지 확인

## Phase 5: 안드로이드 태블릿 최적화 및 APK 빌드 (Completed)
- [x] Capacitor 초기화 및 Android 플랫폼 추가 (`capacitor.config.ts`, `npx cap add android`)
- [x] 안드로이드 가로 모드(Landscape) 고정 및 마이크 권한(RECORD_AUDIO, MODIFY_AUDIO_SETTINGS) 설정 (`AndroidManifest.xml`)
- [x] 화면 꺼짐 방지(Keep-Screen-On) 설정 (`MainActivity.java` FLAG_KEEP_SCREEN_ON & `@capacitor-community/keep-awake`)
- [x] Debug APK 빌드 및 안드로이드 태블릿(TB331FC) adb 설치 완료 (`app-debug.apk`)

## Phase 6: Commercial Polish (Completed)
- [x] 과제 1: 동음 연타 인식을 위한 Energy Onset 감지기 추가 (`src/utils/audioMath.ts`, `usePitchDetection.ts`)
- [x] 과제 2: 학습자를 위한 'Wait Mode (기다려주기)' 모드 탑재 (`src/hooks/useRhythmGame.ts`, UI)
- [x] 과제 3: 결과 화면 게이미피케이션 (별점 및 칭찬 연출)

## Phase 7: Content Expansion & Audio Purity (Completed)
- [x] 간이 텍스트/JSON 기반 악보 파서 `createSong()` 구현 (`src/utils/songParser.ts`)
  - 음이름과 박자 튜플 나열 시 비트 누적, 손가락 번호, 붐웨커 무지개 컬러, 마디 수 자동 계산
- [x] 동요 5곡 데이터 등록 (`src/utils/songData.ts`)
  1) 비행기 (전래동요 / 난이도 ★☆☆)
  2) 나비야 (독일민요 / 난이도 ★☆☆)
  3) 작은 별 (모차르트 / 난이도 ★★☆ - A4 라 피치 확장)
  4) 곰 세 마리 (전래동요 / 난이도 ★★☆)
  5) 환희의 송가 (베토벤 / 난이도 ★★★)
- [x] 메인 화면 알록달록 동요 선택 카드 슬라이더 UI 구축 (`src/components/SongSelectionCardList.tsx`, `App.tsx`)
- [x] 배경 반주(MR) 마이크 간섭 방지 노치 필터 및 대역 성형 (`src/utils/accompanimentEngine.ts`, `src/hooks/usePitchDetection.ts`)
  - 반주 엔진: 피아노 C4~G4 기음 주파수 대역 간섭을 18dB 감쇠시키는 마스터 Peaking/Notch 이퀄라이저 버스 탑재
  - 마이크 입력 체인: HPF(80Hz, 터치/럼블 컷) + Notch(1800Hz, 반주 퍼커션 틱 저지) + LPF(2200Hz, 초고주파 컷) 3단 BiquadFilter 파이프라인
- [x] 단위 테스트(`tests/rhythmGame.test.ts`, `tests/accompaniment.test.ts`) 보강 및 전체 테스트 100% Green 통과, `npm run build` 검증 완료

## Phase 8: 10-Level Step-by-Step Curriculum Mode (Completed)
- [x] 커리큘럼 도메인 타입 정의 (`src/types/curriculum.ts`: `CurriculumLevel`, `LevelProgress`, `LevelScoreRecord`)
- [x] 10단계 순차 커리큘럼 악보 및 학습 팁 데이터베이스 완성 (`src/utils/curriculumData.ts`)
  - Lv. 1: 가온 도(C4)와 친구하기 (엄지 1번 C4 기초 타건 / BPM 65)
  - Lv. 2: 도와 레의 줄타기 (1~2번 손가락 퐁당퐁당 / BPM 70)
  - Lv. 3: 미끄럼틀 미(E4) (1~3번 손가락 3음 계단 연주 / BPM 72)
  - Lv. 4: 첫 비행기 조종 (3손가락으로 첫 동요 완성 / BPM 74)
  - Lv. 5: 개구리 파(F4) (4번 약지손가락 힘 기르기 / BPM 70)
  - Lv. 6: 하늘 높이 솔(G4) (1~5번 다섯 손가락 완성 / BPM 72)
  - Lv. 7: 나비의 춤 (징검다리 건너뛰기 연주 솔-미, 파-레 / BPM 76)
  - Lv. 8: 2분음표 쿵-쿵 박자 (하얀 2분음표 2박자 노래하듯 누르기 / BPM 68)
  - Lv. 9: 곰 세 마리 가족 (씩씩한 아빠곰 리듬과 도미솔 아르페지오 / BPM 80)
  - Lv. 10: 어린이 피아니스트 졸업식 (작은 별 마스터 & 6개 음표 피날레 / BPM 72)
- [x] 진행도 저장 및 로드 유틸리티 구축 (`src/utils/curriculumStorage.ts`)
  - `kids_piano_curriculum_progress` LocalStorage 키 관리
  - 70% 이상 달성 시 다음 레벨 자동 해금 (`unlockedLevel`) 및 최고 기록 보존
  - 진행도 리셋 지원 (`resetCurriculumProgress`)
- [x] UI 컴포넌트 구현
  - `LevelIntroModal.tsx`: 손가락 위치 팁, 선생님 연주 팁, 목표 음표 색상 안내 및 [연습 시작하기 (Wait Mode)] 진입
  - `CurriculumMap.tsx`: 구불구불 모험 길 위 1~10번 알록달록 발판, 자물쇠 잠금, 별점(1~3개), 통계 배너
  - `SongCompletionModal.tsx`: 커리큘럼 완곡 시 [다음 레벨 도전! 🚀] 버튼 노출 및 자동 연동
- [x] App.tsx 메인 네비게이션 연동
  - 상단 헤더 4대 모드 탭에 `[모험 모드 🗺️]` 1순위 전진 배치
  - 모험 지도 <-> 오선보 연습 모드(Wait Mode) 완벽 스위칭 및 상단 [← 모험 지도로] 복귀 바
- [x] 단위 테스트 구축 및 검증 완료 (`tests/curriculum.test.ts` 100% Green Pass, `npm run build` 통과)




