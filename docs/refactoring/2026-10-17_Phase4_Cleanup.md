# Phase 4 리팩토링 및 시스템 무결성 점검 계획서

> 작성일: 2026-10-17 | 대상 범위: Phase 4 가로 스크롤 오선보 리듬 게임 엔진, 60fps 상태 분리, 완곡 모달 동적 바인딩, 성능 최적화  
> 규칙 준수: **승인 전 코드 일체 수정 금지 (Zero Tool-Call Gate)**

---

## 1. As-Is 현황 분석 (기술 부채 및 냄새 목록)

### [CRITICAL] 60fps 연산과 React State 결합 (AGENTS.md 오디오 불변 규칙 3 위반)

| # | 파일 | 위치 | 문제 | 위험도 |
|:---|:---|:---|:---|:---|
| B-1 | `useRhythmGame.ts` | L328~334 | `gameLoop` 내에서 매 requestAnimationFrame(초당 60회!)마다 `setGameState((prev) => ({ ...prev, currentTimeSec: curTime, activeTargetNote: nextActiveNote }))` 호출. 최상위 `App.tsx` 및 하위 건반/카드/헤더 전체가 매초 60회 전면 리렌더링되어 태블릿 모바일 CPU/배터리 과부하 유발 | High |
| B-2 | `SheetMusicCanvas.tsx` & `useRhythmGame.ts` | L123~175 | `useRhythmGame`의 `gameLoop`와 `SheetMusicCanvas` 내부의 `render` 루프가 각각 독립된 `requestAnimationFrame`을 구동(이중 루프). 부모 리렌더링과 캔버스 렌더링 간 프레임 타이밍 지터(Jitter) 위험 | Medium |

### [WARN] 도메인 시맨틱 결함 & 구조적 냄새 (Structural Smells)

| # | 파일 | 위치 | 문제 | 위험도 |
|:---|:---|:---|:---|:---|
| S-1 | `SongCompletionModal.tsx` | L35 | 곡 완곡 축하 타이틀이 `비행기 완곡 성공! 🎉`으로 하드코딩. 신규 추가된 '나비야'(`song-butterfly`)를 완곡해도 비행기로 표출되는 결함 | Medium |
| S-2 | `useRhythmGame.ts` | L71~167 | `selectSong`, `restartGame`, `stopGame` 간 중복된 상태 리셋 보일러플레이트 코드 산재 | Low |
| S-3 | `SongPlayHeader.tsx` | L29~34 | 부모 컴포넌트의 60fps 리렌더링으로 인해 헤더 전체의 DOM 및 진행바 계산이 초당 60회 재계산 | Medium |
| S-4 | `tests/rhythmGame.test.ts` | 전체 | 순수 헬퍼 함수만 검증 중이며, 리듬 게임 상태 머신 전이(MISS 자동 확정, 다중 곡 완곡 판정) 통합 테스트 부재 | Medium |

---

## 2. To-Be 수술 계획 (외과수술적 최소 수정)

```text
1. src/hooks/useRhythmGame.ts (60fps State Decoupling & 참조 안정화)
   - 60fps 시간(currentTimeSec)을 React State 대신 timeRef 기반 getter (getCurrentTimeSec) 및 캔버스 직결 구조로 격리
   - setGameState는 유효 이벤트(점수 획득, 콤보 변화, 타깃 음표 변경, 완곡) 발생 시 및 100ms 스로틀 진행도 동기화 시에만 호출 (리렌더링 60fps -> 이벤트 기반 축소)
   - 중복 리셋 로직을 createInitialGameState() 순수 팩토리 함수로 단일화

2. src/components/SheetMusicCanvas.tsx (캔버스 렌더링 동기화 보강)
   - timeRef 기반 부모 시간 추적 안정화
   - 불필요한 React props 리렌더링 간섭 차단 (React.memo 적용)

3. src/components/SongCompletionModal.tsx (동적 곡명 바인딩)
   - 하드코딩된 '비행기 완곡 성공!' -> `${song.title} 완곡 성공! 🎉`으로 수정
   - 완곡 축하 문구도 곡명과 일관성 유지

4. src/components/SongPlayHeader.tsx (헤더 렌더링 격리)
   - React.memo 적용을 통해 불필요한 헤더 리렌더링 차단

5. tests/rhythmGame.test.ts (통합 테스트 하네스 확장)
   - 곡 완곡 모달 동적 타이틀 생성 검증
   - MISS 자동 확정 및 점수/콤보 상태 전이 불변성 검증
   - 동요 카탈로그 2곡(비행기, 나비야) 완곡 데이터 무결성 검증
```

---

## 3. 원자적 작업 체크리스트 (Mandatory Checklist)

> 모든 작업 단계는 통과 시 `- [x]`로 갱신되며 사후 전수 재검증(Post-Audit)을 수행합니다.

- [x] **Step 0: 사전 안전망 확보**
  - [x] 기존 6개 테스트 스위트 (`npm test`) 100% GREEN 확인 (Golden Master)
- [x] **Step 1: 동적 바인딩 결함 수정 (`SongCompletionModal.tsx`)**
  - [x] 하드코딩 타이틀을 `${song.title} 완곡 성공! 🎉`으로 수정
- [x] **Step 2: 60fps React State 분리 및 엔진 최적화 (`useRhythmGame.ts`)**
  - [x] `currentTimeSec` 매 프레임 setState 호출 제거 및 이벤트/스로틀 기반 갱신으로 전환
  - [x] 상태 초기화 팩토리 분리를 통한 중복 제거
- [x] **Step 3: 캔버스 및 헤더 컴포넌트 렌더 최적화 (`SheetMusicCanvas.tsx`, `SongPlayHeader.tsx`)**
  - [x] `React.memo` 적용 및 props 변경 시에만 리렌더링되도록 격리
- [x] **Step 4: 테스트 하네스 확장 및 검증 (`tests/rhythmGame.test.ts`)**
  - [x] 리듬 게임 상태 전이 및 완곡 로직 단위 테스트 추가
  - [x] `npm test` 6개 전 테스트 슈트 통과 확인
- [x] **Step 5: 전체 빌드 무결성 검증**
  - [x] `npm run build` TypeScript 컴파일 및 번들링 성공 확인
- [x] **Step 6: 아키텍처 맵 동기화 및 사후 감사 (Post-Audit)**
  - [x] `CODEMAP.md` 데이터 흐름 및 성능 최적화 내역 동기화
  - [x] 계획서 내 체크리스트 전수 대조 후 완료 확정

---

## 4. 보존 계약 (Interface Invariants)

- **UX/UI Invariants**: 높은음자리표 가로 스크롤 오선보, 무지개 음표, 타깃 판정선, 적중 파티클, 콤보 배지 시각 디자인 100% 동일 유지.
- **Timing & Audio Invariants**: 4/4박자 C/G7 반주(MR) 비트 스케줄링 및 ±0.38초 PERFECT/GOOD 판정 알고리즘 100% 보존.
- **Simulation Fallback**: Mac 키보드(`A~K`, `1~8`, 한글 자음) 및 마이크 입력 판정 동작 100% 보존.

---

## 5. 실행 절차 (Execution Gate)

본 계획서 작성 직후 **Zero Tool-Call Gate** 규칙에 따라 즉시 정지(Halt)합니다.  
사용자의 명시적 승인("승인", "Proceed", "실행") 확인 후 코드 수정을 순차 착수합니다.
