# Post-Phase 7 리팩토링 & 기능 오류 수정 계획서

> **문서 타입**: 리팩토링 명세서 (Refactoring Specification)  
> **작성 기준**: PROJECT_AUDIT_REPORT.md + CODEMAP.md + 실제 소스 코드 직접 감사  
> **작성일**: 2026-10-17  
> **대상 버전**: Phase 7 완료 이후 (Post-Phase 7)  
> **상태**: 🚀 승인 완료 및 실행 중 (Approved by Hyeok)

---

## 🔍 감사 결과 요약 (Executive Summary)

전체 코드베이스를 직접 감사한 결과, **기능적 버그 3건**, **아키텍처 부채 4건**, **코드 품질 이슈 3건** 확인.  
심각도: 🔴 Critical (즉시) / 🟡 Major (릴리즈 전) / 🟢 Minor (품질)

---

## 🔴 기능적 버그 (Functional Bugs) — 즉시 수정 필요

### BUG-01: `App.tsx` — `SoundMixerModal` 이중 렌더링

**파일**: `src/App.tsx`  
**심각도**: 🔴 Critical  
**증상**: `SoundMixerModal`이 동일 JSX 트리에 **두 번** 렌더링됨. 볼륨 슬라이더 조절 시 두 모달이 동시에 마운트되어 `soundEffects.playSuccessDing()` 미리듣기가 **이중으로 발화**되고, LocalStorage 읽기가 경쟁 상태(Race Condition)에 노출됨.

```tsx
// App.tsx L510~513: 첫 번째 인스턴스 (유지)
<SoundMixerModal isOpen={showSoundMixerModal} onClose={() => setShowSoundMixerModal(false)} />

// App.tsx L564~567: 두 번째 인스턴스 ← 삭제 필요
<SoundMixerModal isOpen={showSoundMixerModal} onClose={() => setShowSoundMixerModal(false)} />
```

**수정**: L563~567 블록(엔지니어링 모니터 드로어 아래 중복 인스턴스) 전체 삭제.

---

### BUG-02: `usePitchDetection.ts` — AudioContext Singleton 우회 버그

**파일**: `src/hooks/usePitchDetection.ts`  
**심각도**: 🔴 Critical  
**증상**: `startListening()` 내부(L347)에서 `new AudioCtx()`로 **새 AudioContext를 직접 생성**함. `audioContextManager.ts`가 전역 싱글톤 매니저로 설계되어 있지만 마이크 전용 컨텍스트가 이를 우회. 결과:
- 마이크 시작 → 캘리브레이션 → 재시작 사이클마다 컨텍스트 누적 생성 위험
- 브라우저 AudioContext 동시 생성 한도(Chrome 기준 6개) 충돌 가능
- `simulateNote()`는 `audioContextManager.getContext()` 사용 → **마이크 컨텍스트와 다른 Audio 그래프**에 오실레이터 출력

```typescript
// usePitchDetection.ts L346~350
const AudioCtx = window.AudioContext || ...webkitAudioContext;
const ctx = new AudioCtx(); // ← audioContextManager를 우회한 직접 생성
```

**수정 방향**: `audioContextManager`에 `createDedicatedContext()` 또는 마이크 전용 컨텍스트 추적 레지스트리 추가. 수명주기(생성/close)를 매니저가 통합 관리하도록 리팩토링.

---

### BUG-03: `SongCompletionModal.tsx` — 연습 모드 정확도 오계산 + 하드코딩 폴백

**파일**: `src/components/SongCompletionModal.tsx`  
**심각도**: 🔴 Critical  

**버그 1 — 하드코딩 폴백 `26`**:
```tsx
const totalNotes = song.notes.length || 26;  // ← 비행기 음표 수 하드코딩!
```
`song.notes.length`가 0인 비정상 케이스에서 `26`으로 분모 계산. 다른 4곡은 실제로 `song.notes.length > 0`이므로 현재는 발현되지 않지만, 방어 코드 관점에서 수정 필요.

**버그 2 — 연습 모드 정확도 의미 불일치**:
```tsx
// 연습 모드에서는 완곡 = 모든 음표를 맞춘 것 → accuracy는 항상 100%여야 함
// 그러나 이를 명시적으로 보장하는 분기 없음
const accuracy = Math.min(100, Math.round((processedHits / totalNotes) * 100));
```

**수정**:
```tsx
const totalNotes = song.notes.length > 0 ? song.notes.length : 1;
const isPractice = gameState.playMode === 'practice';
const accuracy = isPractice
  ? 100  // 연습 모드 완곡 = 100% 보장
  : Math.min(100, Math.round(((gameState.perfectCount + gameState.goodCount) / totalNotes) * 100));
```

---

## 🟡 아키텍처 부채 (Architecture Debt) — 다음 릴리즈 전 수정

### ARCH-01: `useRhythmGame.ts` — 파생 변수 `totalBeats` useMemo 미처리

**파일**: `src/hooks/useRhythmGame.ts`  
**심각도**: 🟡 Major  

`currentSong` 파생값인 `totalBeats`, `totalSongDurationSec`가 `useEffect` 의존성 배열에 별도 포함됨(L451). React의 closure 갱신 과정에서 `currentSong` 변경 시 effect가 3회 재실행될 위험.

```typescript
// L98~99: 렌더 때마다 재계산
const totalBeats = currentSong.totalMeasures * currentSong.beatsPerMeasure;
const totalSongDurationSec = beatToSeconds(totalBeats, currentSong.bpm) + 1.5;

// L451: 세 항목이 별개 의존성으로 등록됨
}, [currentSong, totalSongDurationSec, totalBeats]);
```

**수정**: `useMemo` 처리 후 `useEffect` 의존성을 `[currentSong]` 단일 항목으로 정리.

---

### ARCH-02: `usePitchDetection.ts` — `config` 객체 매 렌더 재생성으로 `useCallback` 메모이제이션 무효화

**파일**: `src/hooks/usePitchDetection.ts`  
**심각도**: 🟡 Major  

`runDetectionLoop`의 `useCallback` 의존성에 `config.yinThreshold`가 포함됨(L336). `config` 자체가 렌더마다 `{ ...DEFAULT_CONFIG, ...customConfig }`로 **새 객체 참조**를 생성하므로 `useCallback`이 항상 재생성됨 → `startListening` 함수 참조도 매 렌더 교체됨.

```typescript
// 문제 코드: config가 매 렌더 신규 객체
const config = { ...DEFAULT_CONFIG, ...customConfig };  // L57
// ...
const runDetectionLoop = useCallback(() => { ... }, [addLog, config.yinThreshold]); // L336
```

**수정**: `const yinThreshold = customConfig?.yinThreshold ?? DEFAULT_CONFIG.yinThreshold`로 원시값 추출 후 의존성 사용.

---

### ARCH-03: `App.tsx` — `confirmedNote` effect 의존성에 `playMode` 포함 → 모드 전환 시 음표 재트리거 위험

**파일**: `src/App.tsx`  
**심각도**: 🟡 Major  

L98~106 `useEffect` 의존성 배열에 `[confirmedNote, playMode]` 포함. 모드 전환 시 `playMode`가 변경되면 effect 재실행 → **이전 `confirmedNote`가 새 모드의 핸들러에 재입력**되는 엣지 케이스 발생 가능.

```tsx
// 문제 코드
useEffect(() => {
  if (!confirmedNote) return;
  if (playMode === 'tutorial' && tutorialIsActiveRef.current) {
    tutorialHandleNoteInputRef.current(confirmedNote); // ← 모드 전환 직후 이전 음표 재입력!
  } else if (playMode === 'song' && rhythmGameIsPlayingRef.current) {
    rhythmGameHandleNoteInputRef.current(confirmedNote.fullName);
  }
}, [confirmedNote, playMode]); // ← playMode 의존성이 문제
```

**수정**: `playMode` 의존성 제거 + `playModeRef` 신규 추가로 effect 내부 ref 참조.

---

### ARCH-04: `useRhythmGame.ts` — `pauseGame()` 에서 MR 반주 정지 누락

**파일**: `src/hooks/useRhythmGame.ts`  
**심각도**: 🟡 Major  

`pauseGame()`은 게임 루프를 정지하지만 반주 엔진을 정지하지 않아, 일시정지 후에도 MR 반주가 계속 흘러나옴.

```typescript
const pauseGame = useCallback(() => {
  isPlayingRef.current = false;
  setGameState((prev) => ({ ...prev, isPlaying: false, isPaused: true }));
  // ← accompaniment.stop() 또는 accompaniment.pause() 누락!
}, []);

// resumeGame에는 accompaniment.resume()이 이미 있음 (L169)
const resumeGame = useCallback(() => {
  accompaniment.resume(); // ← 이미 존재
  isPlayingRef.current = true;
  ...
```

**수정**: `pauseGame` 내 `accompaniment.stop()` 추가. `accompanimentEngine`에 `stop()` API가 없으면 추가 구현.

---

## 🟢 코드 품질 이슈 (Code Quality)

### QUAL-01: `NOTE_META_MAP` — A4/B4/C5 확장 음역 손가락 번호 기본값 비교육적

**파일**: `src/utils/songParser.ts`  
현재 A4=`finger:1`, B4=`finger:2`, C5=`finger:3`. 5손가락 체계를 벗어난 확장 음역의 경우 운지법 교육 측면에서 혼란 초래 가능. `createSong` 튜플의 3번째 인자로 오버라이드 가능하지만, 미지정 시 기본값이 부적절.

---

### QUAL-02: `resumeGame` — export 되었으나 UI 미연결 (일시정지/재개 UX 미완성)

**파일**: `src/hooks/useRhythmGame.ts` / `src/App.tsx`  
`resumeGame`이 훅 반환값에 포함되나 `App.tsx`에서 destructuring되지 않고 `SongPlayHeader`에 전달되지 않음. 일시정지 후 재개 UX 흐름이 구현 불완전.

---

### QUAL-03: `cleanupAudio` — `audioContextManager` 컨텍스트 상태 미점검

**파일**: `src/hooks/usePitchDetection.ts`  
`cleanupAudio()`에서 로컬 컨텍스트를 close하지만, `audioContextManager` 싱글톤이 `suspended` 상태로 남아있으면 반주/효과음 묵음 현상 발생 가능. 마이크 중지 후 `audioContextManager.getContext()?.resume()` 호출을 추가하거나 상태 점검 로직 보완 필요.

---

## ✅ 실행 체크리스트 (Atomic Step Checklist)

### 블록 A — Critical 버그 수정

- [x] **A-1** `App.tsx` L563~567 중복 `<SoundMixerModal>` 블록 삭제
- [x] **A-2** 빌드 검증: `npm run build` 오류 없음 확인
- [x] **A-3** `SongCompletionModal.tsx` `totalNotes` 폴백 하드코딩 `26` → `1` 교정
- [x] **A-4** `SongCompletionModal.tsx` `isPractice` 분기로 연습 모드 accuracy `100` 고정 처리
- [x] **A-5** 빌드 검증 및 키보드 시뮬레이션으로 연습 완곡 → 정확도 100% 확인

### 블록 B — Architecture Debt

- [x] **B-1** `useRhythmGame.ts` `totalBeats` / `totalSongDurationSec`를 `useMemo`로 메모이제이션
- [x] **B-2** `useEffect` 의존성 배열 `[currentSong]` 단일화
- [x] **B-3** `usePitchDetection.ts` `yinThreshold` 원시값 추출 및 의존성 교체
- [x] **B-4** `App.tsx` `playMode` 의존성 제거 → `playModeRef` 추가 후 ref 참조
- [x] **B-5** `useRhythmGame.ts` `pauseGame()` 내부 `accompaniment.stop()` 호출 추가
- [x] **B-6** `accompanimentEngine.ts` `stop()` API 존재 확인 및 없으면 추가
- [x] **B-7** 빌드 검증 및 일시정지 → MR 반주 정지 동작 확인

### 블록 C — Code Quality

- [x] **C-1** `NOTE_META_MAP` A4/B4/C5 손가락 번호 기본값 재검토 (스케일 엄지 넘김 표준 규격 문서화)
- [x] **C-2** `resumeGame` UI 연결 결정 및 `SongPlayHeader` 일시정지/재개 UX 완성 (`onResume` 및 '이어하기' 버튼 연동)
- [x] **C-3** `usePitchDetection.ts` `cleanupAudio` — `audioContextManager` 상태 점검 추가 (마이크 컨텍스트 분리 및 싱글톤 헬스체크 연동)

### 블록 D — 사후 검증

- [x] **D-1** `npm run build` 최종 클린 빌드 확인 (경고 0건)
- [x] **D-2** `npm test` 테스트 스위트 전체 Green 확인
- [x] **D-3** 키보드 시뮬레이션으로 전체 5곡 연습/실전 모드 각각 완곡 플로우 수동 검증
- [x] **D-4** SoundMixerModal 단일 렌더링 확인 (DevTools Elements 탭)
- [x] **D-5** `CODEMAP.md` 변경 사항 반영 업데이트
