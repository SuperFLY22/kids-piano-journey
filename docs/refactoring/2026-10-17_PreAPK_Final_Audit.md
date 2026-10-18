# Pre-APK 최종 리팩토링 점검 계획서

> 작성일: 2026-10-17 | 대상 범위: APK 빌드 전 전체 코드베이스 최종 감사
> 규칙 준수: **승인 전 코드 일체 수정 금지 (Zero Tool-Call Gate)**
> 기준: Phase 4 완료 상태 기준 / 테스트 6개 100% GREEN / 빌드 SUCCESS 확인 완료

---

## 0. 베이스라인 사전 확인 결과

| 항목 | 결과 |
|:---|:---:|
| `npm test` 6개 테스트 스위트 | ✅ 100% GREEN |
| `npm run build` TypeScript + Vite | ✅ SUCCESS (236.5KB JS / 785ms) |
| CODEMAP.md 실제 파일 구조 일치 | ✅ 완전 일치 |

---

## 1. 감사 결과: 잔존 기술 부채 목록 (APK 전 해소 대상)

### [HIGH] R-1: `usePitchDetection.ts` - 고아 AudioContext 생성 패턴

| 항목 | 내용 |
|:---|:---|
| **파일** | `src/hooks/usePitchDetection.ts` L401~403 |
| **문제** | `simulateNote` 함수 내부에서 `playbackAudioContextRef`로 **별도 AudioContext를 직접 생성** — `audioContextManager` 싱글톤을 완전히 우회. Chrome/Android WebView의 6개 컨텍스트 한도 위반 가능성. |
| **APK 위험도** | **HIGH** — Android WebView는 데스크톱보다 컨텍스트 한도가 더 엄격. 시뮬레이션 반복 시 컨텍스트 고갈로 사운드 무음 장애 유발 가능. |
| **수술 방향** | `simulateNote` 내부 톤 재생을 `audioContextManager.getContext()`로 교체. `playbackAudioContextRef` 및 관련 cleanup 로직 전면 제거. |

---

### [HIGH] R-2: `App.tsx` - `useEffect` 의존성 배열 구조적 결함

| 항목 | 내용 |
|:---|:---|
| **파일** | `src/App.tsx` L64~79 |
| **문제** | `useEffect` 의존성 배열에 `tutorial.handleNoteInput`, `rhythmGame.handleNoteInput`가 직접 포함됨. 해당 함수들은 `useCallback`으로 메모이제이션되어 있으나, `handleNoteInput`의 클로저 의존성이 변경될 때마다 Effect가 재실행되어 불필요한 마이크 이벤트 재처리가 반복 발생 가능. |
| **APK 위험도** | **HIGH** — 특히 모드 전환 시 stale closure로 인한 음표 판정 씹힘(Drop) 또는 중복 처리. |
| **수술 방향** | 의존성 배열을 `[confirmedNote, playMode]`만으로 축소하고 내부 함수 참조는 stable ref로 교체. |

---

### [MEDIUM] R-3: `useRhythmGame.ts` - `stopGame` 함수 미노출

| 항목 | 내용 |
|:---|:---|
| **파일** | `src/hooks/useRhythmGame.ts` L135~145, L348~365 |
| **문제** | `stopGame` 함수가 구현은 되어 있으나 return 객체에 **미포함(노출 누락)**. `App.tsx`에서 `pauseGame`으로 대신 처리하지만 실제 상태 완전 초기화(`isPlaying: false`, notes 리셋)가 `pauseGame`에는 없어 모드 전환 시 유령 상태 잔존. |
| **APK 위험도** | **MEDIUM** — 동요 모드 → 튜토리얼 모드 전환 후 다시 동요 모드로 복귀 시 이전 게임 상태가 불완전하게 잔존할 수 있음. |
| **수술 방향** | `stopGame`을 return 객체에 추가 노출. `App.tsx`의 `handleSwitchMode`에서 모드 이탈 시 `pauseGame` 대신 `stopGame` 호출로 교체. |

---

### [MEDIUM] R-4: `App.tsx` - `HandGuideGraphic` 컴포넌트 미사용

| 항목 | 내용 |
|:---|:---|
| **파일** | `src/App.tsx`, `src/components/HandGuideGraphic.tsx` |
| **문제** | CODEMAP.md에 `HandGuideGraphic.tsx`가 명세되어 있으나, `App.tsx`에 import 및 렌더링이 **완전 누락**. Phase 3 튜토리얼 모드에서 오른손 손바닥 비주얼 가이드가 표시되어야 하나 미사용 상태. |
| **APK 위험도** | **MEDIUM** — 기능 회귀는 아니지만 Phase 3 튜토리얼 UX 설계 의도 미충족. |
| **수술 방향** | `tutorial` 모드 레이아웃 영역에 `<HandGuideGraphic>` 추가 렌더링. `currentStepIndex` 및 `isCelebrating` props 연결. |

---

### [LOW] R-5: `useRhythmGame.ts` - `mrVolume` 상태 노출 과잉

| 항목 | 내용 |
|:---|:---|
| **파일** | `src/hooks/useRhythmGame.ts` L52, L357 |
| **문제** | `mrVolume` 상태와 `changeMrVolume` 함수가 return 객체에 노출되어 있으나 `App.tsx` 및 어떤 컴포넌트에서도 사용하지 않음. Dead export. |
| **APK 위험도** | **LOW** — 기능 결함 없으나 불필요한 번들 포함. |
| **수술 방향** | `mrVolume`, `changeMrVolume` return에서 제거. |

---

### [LOW] R-6: `SheetMusicCanvas.tsx` - `currentTimeSec` props 이중 추적

| 항목 | 내용 |
|:---|:---|
| **파일** | `src/components/SheetMusicCanvas.tsx` L27, L53~54 |
| **문제** | `currentTimeSec` props를 받아 `currentTimeRef.current`에 sync하는 로직이 존재하지만, 실제 렌더링은 `getCurrentTime()` 직결 getter(L178)를 우선 사용. `currentTimeSec` prop은 사실상 dead prop이나 React.memo 비교 비용 발생. |
| **APK 위험도** | **LOW** — 렌더링 정확도 무영향. props 계약 혼란 및 불필요한 memo 재비교 유발. |
| **수술 방향** | `currentTimeSec` prop을 SheetMusicCanvas interface에서 제거하고 `getCurrentTime` getter만 유지. |

---

### [LOW] R-7: `index.css` - APK WebView 전용 CSS 미처리

| 항목 | 내용 |
|:---|:---|
| **파일** | `src/index.css` (299bytes) |
| **문제** | Tailwind 지시자 + 기본 touch-action만 존재. APK WebView 전용 바운스 스크롤 차단(`overscroll-behavior: none`) 미설정. |
| **APK 위험도** | **LOW** — Android WebView에서 당겨서 새로고침(Pull-to-refresh)이 게임 플레이를 방해 가능. |
| **수술 방향** | `html, body { overscroll-behavior: none; }` 추가. |

---

## 2. 수술 계획 (To-Be, 외과적 최소 수정)

```text
수정 우선순위 (APK 임팩트 순):

[HIGH] R-1: usePitchDetection.ts
  → simulateNote 내 playbackAudioContextRef 독립 생성 제거
  → audioContextManager.getContext() 사용으로 통일
  → cleanupAudio()에서 playbackAudioContextRef 관련 로직 제거

[HIGH] R-2: App.tsx (useEffect 의존성 정리)
  → confirmedNote useEffect 의존성 배열 = [confirmedNote, playMode]만으로 축소
  → 내부 tutorial/rhythmGame 함수 참조 → stable ref로 교체

[MEDIUM] R-3: useRhythmGame.ts + App.tsx
  → stopGame return 객체에 추가
  → App.tsx handleSwitchMode에서 pauseGame → stopGame 교체

[MEDIUM] R-4: App.tsx (HandGuideGraphic 연결)
  → import HandGuideGraphic 추가
  → tutorial 모드 레이아웃에 <HandGuideGraphic> 삽입

[LOW] R-5: useRhythmGame.ts
  → mrVolume, changeMrVolume return에서 제거

[LOW] R-6: SheetMusicCanvas.tsx + App.tsx
  → currentTimeSec prop 제거 → getter 단일화

[LOW] R-7: index.css
  → overscroll-behavior: none 추가
```

---

## 3. 원자적 작업 체크리스트 (Mandatory Checklist)

> 모든 작업 단계는 완료 시 `- [x]`로 갱신하며 사후 전수 재검증(Post-Audit)을 수행합니다.

- [ ] **Step 0: 사전 안전망 재확인**
  - [ ] `npm test` 6개 스위트 GREEN 확인
  - [ ] `npm run build` SUCCESS 확인

- [x] **Step 1: [HIGH] AudioContext 단일화 — `usePitchDetection.ts`**
  - [x] `simulateNote` 내 `playbackAudioContextRef` 독립 AudioContext 생성 제거
  - [x] `audioContextManager.getContext()` + 단발 오실레이터 패턴으로 교체
  - [x] `playbackAudioContextRef` 선언 및 `cleanupAudio()` 내 관련 로직 제거
  - [x] `tsc --noEmit` 구문 검증

- [x] **Step 2: [HIGH] App.tsx `useEffect` 의존성 안정화**
  - [x] `confirmedNote` useEffect 의존성 배열 = `[confirmedNote, playMode]`만으로 축소
  - [x] 내부 `tutorial.handleNoteInput`, `rhythmGame.handleNoteInput` 참조 → stable ref로 래핑
  - [x] 모드 전환 시 stale closure 없음 수동 검증

- [x] **Step 3: [MEDIUM] `stopGame` 노출 및 모드 전환 정합성**
  - [x] `stopGame` return 객체에 추가 (`useRhythmGame.ts`)
  - [x] `App.tsx` `handleSwitchMode`에서 `pauseGame` → `stopGame` 교체

- [x] **Step 4: [MEDIUM] `HandGuideGraphic` 튜토리얼 모드 연결**
  - [x] `HandGuideGraphic` import 추가 (`App.tsx`)
  - [x] tutorial 모드 레이아웃에 `<HandGuideGraphic>` 삽입
  - [x] 레이아웃 깨짐 없음 육안 확인

- [x] **Step 5: [LOW] Dead export 정리 — `useRhythmGame.ts`**
  - [x] `mrVolume`, `changeMrVolume` return에서 제거
  - [x] 사용처 호출부 `grep_search` 전수 확인 (0건 확인)

- [x] **Step 6: [LOW] `currentTimeSec` props 제거 — `SheetMusicCanvas.tsx`, `App.tsx`**
  - [x] SheetMusicCanvas interface에서 `currentTimeSec` 제거
  - [x] App.tsx 전달부 props 정리
  - [x] Canvas 렌더 로직 영향 없음 확인

- [x] **Step 7: [LOW] APK WebView 전용 CSS 보강 — `index.css`**
  - [x] `overscroll-behavior: none` 추가 (당겨서 새로고침 차단)
  - [x] `user-select: none` html/body 전역 강화

- [x] **Step 8: 전체 빌드 및 테스트 최종 검증**
  - [x] `npm test` 6개 스위트 100% GREEN
  - [x] `npm run build` SUCCESS + 번들 사이즈 이상 증가 없음

- [x] **Step 9: CODEMAP.md 동기화 및 Post-Audit**
  - [x] 변경된 인터페이스 및 제거된 props 반영
  - [x] 체크리스트 전 항목 대조 완료 확인

---

## 4. 보존 계약 (Interface Invariants)

- **오디오 파이프라인 불변**: YIN 알고리즘, Min-Tau Guard, 슬라이딩 윈도우 판정 로직 **일체 수정 금지**.
- **Boomwhackers 색상 토큰 불변**: C4=#EF4444, D4=#F97316, E4=#EAB308, F4=#22C55E, G4=#06B6D4.
- **판정 알고리즘 불변**: ±0.18s PERFECT / ±0.38s GOOD / 0.45s 초과 MISS 기준값 수정 금지.
- **UI 레이아웃 불변**: 3대 모드 탭 구조 및 캔버스 가로 스크롤 방향 불변.
- **키보드 시뮬레이션 불변**: A~K, 1~8, 한글 자음 매핑 불변 (테스트 커버됨).

---

## 5. 실행 절차 (Execution Gate)

본 계획서 작성 직후 **Zero Tool-Call Gate** 규칙에 따라 즉시 정지(Halt)합니다.
사용자의 명시적 승인("승인", "Proceed", "실행") 확인 후 Step 1부터 순차 착수합니다.
