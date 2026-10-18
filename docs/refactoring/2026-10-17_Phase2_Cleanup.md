# Phase 2 리팩토링 및 Phase 3 진입 전 점검 계획서

> 작성일: 2026-10-17 | 대상 범위: Phase 2 가상 건반 UI 및 App 입력 레이어  
> 규칙 준수: **승인 전 코드 일체 수정 금지 (Zero Tool-Call Gate)**

---

## 1. As-Is 현황 분석 (기술 부채 및 냄새 목록)

### [CRITICAL] 자원 관리 & 잠재 결함

| # | 파일 | 위치 | 문제 | 위험도 |
|:---|:---|:---|:---|:---|
| B-1 | `usePitchDetection.ts` | L388~402 | `simulateNote` 호출 시마다 **`new AudioContext()`를 매번 새로 생성**하고 400ms 후 `close()`. 브라우저 동시 AudioContext 제한(최대 6개) 초과 시 사운드 차단 및 메모리 스파이크 위험 | High |
| B-2 | `VirtualPiano.tsx` | L18~24 | `FIVE_KEYS` 배열에 건반 메타데이터(색상, 손가락번호, 단축키)가 컴포넌트 내부에 하드코딩. `audioMath.ts`의 `C4_G4_FINGERS` 및 `NOTE_COLORS`와 중복 선언 | Medium |

### [WARN] 구조적 냄새 (Structural Smells)

| # | 파일 | 위치 | 문제 |
|:---|:---|:---|:---|
| S-1 | `App.tsx` | L28~80 | 52줄에 걸친 Mac 키보드(`KeyA`~`KeyG`, `Digit1`~`5`, 한글 IME 자음 `ㅁ,ㄴ,ㅇ,ㄹ,ㅎ`) 리스너가 **`App.tsx` 내부에 인라인으로 방치**. View/Orchestrator 레이어 오염 (SRP 위반) |
| S-2 | `VirtualPiano.tsx` | L76 | `activeNote`에 `C4`가 아닌 다른 옥타브(`C3`, `C5`) 입력 시 손가락 번호(1~5)와 시각적 매핑 충돌 방어 로직 부재 |
| S-3 | `tests/` | 전체 | 키보드 키 매핑(`e.code`, `e.key`, 한글 자음) 변환 불변성을 보장하는 단위 테스트 하네스 부재 |

---

## 2. To-Be 수술 계획 (외과수술적 최소 수정)

```text
1. src/hooks/useKeyboardSimulation.ts (신규 분리)
   - App.tsx의 52줄 키보드 이벤트 리스너를 독립 커스텀 훅으로 추출
   - e.code(물리키), e.key(영문 대소문자, 한글 두벌식 자음) 전수 커버
   - App.tsx 코드 라인 60줄 이상 경량화 (SRP 달성)

2. src/hooks/usePitchDetection.ts (오디오 리소스 안정화)
   - simulateNote의 AudioContext 매번 생성 안티패턴 제거
   - 공유 playbackCtxRef (단일 재사용 AudioContext) 도입으로 동시 인스턴스 고갈 방지

3. src/utils/audioMath.ts & src/components/VirtualPiano.tsx (데이터 소스 일원화)
   - 가온 C 5건반 메타데이터 상수(FIVE_CORE_KEYS)를 audioMath.ts로 단일화
   - VirtualPiano와 PianoRangeTester가 동일한 도메인 상수를 참조하도록 정합성 확보

4. tests/keyboardMapping.test.ts (Tier 1 테스트 하네스 추가)
   - 키보드 물리 코드(KeyA~KeyG, Digit1~5) 및 한글 자음(ㅁ, ㄴ, ㅇ, ㄹ, ㅎ) 매핑 100% 일치 검증
```

---

## 3. 원자적 작업 체크리스트 (Mandatory Checklist)

> 모든 작업 단계는 통과 시 `- [x]`로 갱신되며 사후 전수 재검증(Post-Audit)을 수행합니다.

- [x] **Step 0: 사전 안전망 확보**
  - [x] `tests/keyboardMapping.test.ts` 작성 및 매핑 로직 베이스라인 GREEN 확인
  - [x] 기존 `npm test` (audioMath, slidingWindow) 100% 정상 통과 확인
- [x] **Step 1: 오디오 톤 합성기 리소스 최적화 (`usePitchDetection.ts`)**
  - [x] `playbackContextRef` 도입으로 `new AudioContext()` 반복 생성 차단
  - [x] 컴포넌트 언마운트 시 공유 `playbackContext` 정상 해제(cleanup) 보장
- [x] **Step 2: 키보드 시뮬레이션 전용 훅 분리 (`useKeyboardSimulation.ts`)**
  - [x] `src/hooks/useKeyboardSimulation.ts` 생성 및 단일 책임 분리
  - [x] `App.tsx`에서 52줄 인라인 이벤트 리스너 제거 후 커스텀 훅 연동
- [x] **Step 3: 건반 메타데이터 단일 진실 공급원(SSOT) 구축**
  - [x] `src/utils/audioMath.ts`에 `CORE_PIANO_KEYS` 상수 정의 (도메인 일원화)
  - [x] `VirtualPiano.tsx`에서 중복 배열 제거 후 상수로 교체
- [x] **Step 4: 정적 안전망 & 전체 빌드 검증**
  - [x] `npx tsc --noEmit` 타입 에러 0건 확인
  - [x] `npm test` 전체 스위트(Tier 1 + Tier 2 + New) GREEN 확인
  - [x] `npm run build` 번들 정상 통과
- [x] **Step 5: 아키텍처 맵 동기화**
  - [x] `CODEMAP.md`에 `useKeyboardSimulation.ts` 및 신규 테스트 파일 반영

---

## 4. 보존 계약 (Interface Invariants)

- `usePitchDetection` 훅의 외부 반환 시그니처(`UsePitchDetectionReturn`) 변경 금지
- 키보드 입력 키(`A, S, D, F, G`, `1, 2, 3, 4, 5`, `ㅁ, ㄴ, ㅇ, ㄹ, ㅎ`)의 동작 불변성 100% 유지
- 가상 건반의 UI/UX 디자인(3D 눌림, Boomwhackers 색상, 네온 글로우) 유지

---

## 5. 실행 절차 (Execution Gate)

본 계획서 작성 후 즉시 턴을 종료(Halt)합니다.  
사용자의 승인("진행", "승인", "Proceed") 접수 시에만 코드 수정을 순차 착수합니다.
