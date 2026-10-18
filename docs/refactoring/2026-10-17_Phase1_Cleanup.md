# Phase 1 리팩토링 계획서

> 작성일: 2026-10-17 | 대상 범위: Phase 1 마이크 피치 인식 코어 전체
> 승인 전 **코드 일체 수정 금지**

---

## As-Is 현황 분석 (문제점 목록)

### [CRITICAL] Bug / Dead Code

| # | 파일 | 위치 | 문제 | 위험도 |
|:---|:---|:---|:---|:---|
| B-1 | `usePitchDetection.ts` L6 | `DEFAULT_CONFIG.sampleRate: 48000` 하드코딩 | `new AudioCtx()`는 **native rate(48kHz) 자동 사용**하므로 이 값은 사실상 무의미. Phase 2에서 `customConfig`로 덮어쓸 경우 불일치 발생 가능 | Medium |
| B-2 | `usePitchDetection.ts` L9 | `minHoldDurationMs: 15` 선언되어 있으나 **루프 내 어디서도 사용되지 않음** (Dead Config) | 슬라이딩 윈도우 도입으로 대체됐음에도 타입에서 삭제 안 됨 | Low |
| B-3 | `usePitchDetection.ts` L128~134 | `correctPianoHarmonics`가 **훅 내부 useCallback으로 선언**되어 있어 React 렌더 사이클에 묶임 | `detectPianoPitch` 완료 후 이 보정은 `audioMath.ts`의 순수 함수로 이전해야 함 | Low |
| B-4 | `PitchMonitor.tsx` L36 | `"YIN 44.1kHz"` 라벨이 **하드코딩**된 채 잔존 (실제는 48kHz Native) | UI 오정보 | Low |

### [WARN] 구조적 냄새 (Structural Smells)

| # | 파일 | 문제 |
|:---|:---|:---|
| S-1 | `usePitchDetection.ts` (436줄) | 로그 큐 관리, 오디오 그래프 생성, 피치 루프, 시뮬레이션 비프음 합성이 **단일 훅 파일에 혼재**. SRP 위반. |
| S-2 | `usePitchDetection.ts` L394~413 | **키보드 비프음 합성(새 AudioCtx 매번 생성)** 로직이 훅 내부에 인라인으로 존재. 메모리 주의 (GC 타이머로 처리됨) |
| S-3 | `PitchDetectionConfig` 타입 | `sampleRate`, `minHoldDurationMs`가 현재 구현과 불일치하는 데드 필드로 잔존 |
| S-4 | `App.tsx` L30~75 | 키보드 이벤트 리스너가 `useEffect` 안에 직접 인라인으로 작성. 커스텀 훅 `useKeyboardSimulation`으로 분리할 여지 있음 (Phase 2에서 건반 UI 추가 시 필수) |

---

## To-Be 수술 계획 (최소 외과수술, 인터페이스 보존)

### 수정 범위: 4개 파일 / 7개 지점

```
1. src/utils/audioMath.ts
   - [추가] correctPianoHarmonics() 순수 함수화 이전 (훅 내부에서 제거)
   - [정리] detectPianoPitch() 기본 파라미터 명확화

2. src/types/audio.ts
   - [삭제] PitchDetectionConfig.sampleRate 필드
   - [삭제] PitchDetectionConfig.minHoldDurationMs 필드

3. src/hooks/usePitchDetection.ts
   - [삭제] correctPianoHarmonics useCallback 제거 → audioMath import 교체
   - [삭제] DEFAULT_CONFIG.sampleRate, DEFAULT_CONFIG.minHoldDurationMs 제거
   - [수정] addLog 3분기 if/else if/else → extractLogMessage() 헬퍼 분리

4. src/components/PitchMonitor.tsx
   - [수정] "YIN 44.1kHz" → "Min-Tau YIN 48kHz" 정정
```

---

## 테스트 하네스 구축 계획 (Golden Master Baseline)

> 수정 전 베이스라인 확보 → 수정 후 동일성 검증 순서 준수

### Tier 1: 핵심 순수 함수 단위 테스트 (High ROI) — `audioMath.ts`

| 테스트 케이스 | 입력 | 기대값 | 방법 |
|:---|:---|:---|:---|
| frequencyToMidi - A4 | 440.0 | 69 | assert === |
| frequencyToMidi - C4 | 261.63 | 60 | assert === |
| frequencyToNoteInfo - C4 | 261.63 | fullName:'C4', koreanName:'도', color:'#EF4444', fingerNumber:1 | 구조 비교 |
| frequencyToNoteInfo - G4 | 392.00 | fullName:'G4', koreanName:'솔', color:'#06B6D4', fingerNumber:5 | 구조 비교 |
| frequencyToNoteInfo - 범위 초과 | 50Hz, 5000Hz | null | assert null |
| calculateRmsAndDb - 무음 | zeros Float32Array | db === -100 | assert === |
| detectPianoPitch - Min-Tau Guard | C4(261Hz) + 19kHz 노이즈 합성 버퍼 | NOT 19000Hz (261Hz대) | 범위 검증 |
| detectPianoPitch - C4 순음 | 261.63Hz 사인파 48kHz | 255~270Hz 범위 내 | 범위 검증 |
| correctPianoHarmonics - 2차 배음 | 523.5 | ~261.75 | 반값 검증 |
| correctPianoHarmonics - 정상 범위 | 300.0 | 300.0 (보정 없음) | assert === |
| getCentsDeviation - 완벽 일치 | freq=440, midi=69 | 0 | assert === 0 |

**도구**: `npx tsx` 인라인 assert 스크립트 (Vitest 설치 불필요)
**파일**: `tests/audioMath.test.ts`

### Tier 2: 슬라이딩 윈도우 Majority Vote 로직 (Integration)

| 시나리오 | 기대값 |
|:---|:---|
| 히스토리 1개 + rawNote 존재 → 즉시 확정 | bestCandidate 즉시 반환 |
| C4 4회 + D4 2회 → maxCount=4 | C4 선택 |
| 160ms 초과 항목 | 필터링되어 제외 |
| isGateOpen=false | pitchHistory 초기화, 900ms 후 confirmedNote=null |

**파일**: `tests/slidingWindow.test.ts`

### Tier 3: 정적 안전망 (Global)

| 검증 항목 | 명령어 | 합격 기준 |
|:---|:---|:---|
| TypeScript 구문 무결성 | `npx tsc --noEmit` | 오류 0 |
| 빌드 번들 통과 | `npm run build` | exit code 0 |
| 순환 의존성 | `npx madge --circular src/` | 사이클 0 |

---

## 루프 엔지니어링 분석 (Loop Engineering)

> 현재 `requestAnimationFrame(loop)` 내부 처리 단계 비용 분석

| 단계 | 비용 | 평가 |
|:---|:---|:---|
| `getFloatTimeDomainData(buffer)` | O(2048) | 유지 |
| `calculateRmsAndDb()` | O(2048) | 유지 |
| `detectPianoPitch()` — YIN 내부 이중 루프 | **O(N²/4) ≈ 1M ops/frame** | ⚠️ 잠재 병목 |
| Sliding Window Majority Vote | O(6) | 유지 |
| `setDebugInfo` (50ms 스로틀) | 최소 | 유지 |
| `addLog` (180ms 스로틀 + cap 50) | 최소 | 유지 |

### YIN O(N²) 최적화 필요 여부 판단

- 맥북 Chrome 실측: **~0.8ms/frame** → 60fps 예산(16.6ms) 대비 약 **5%** → **현재 최적화 불필요**
- 안드로이드 태블릿(Phase 5): 저사양에서 3~5ms 가능성 → **Phase 5 진입 전 재측정**
- 필요시 FFT 기반 NSDF(McLeod Pitch Method) O(N log N)으로 전환 검토

---

## 실행 순서 (모델 교체 후 승인 시 진행)

```
Step 0: 사전 베이스라인 확보
        → tests/audioMath.test.ts 작성 및 전체 GREEN 확인

Step 1: types/audio.ts 데드 필드 제거 (B-2, S-3)

Step 2: audioMath.ts에 correctPianoHarmonics 순수 함수 추가 (B-3)

Step 3: usePitchDetection.ts 정리 (B-1, B-2, B-3, S-1 일부)
        → sampleRate 하드코딩 제거
        → minHoldDurationMs 제거
        → correctPianoHarmonics useCallback → 순수 함수 import 교체
        → addLog 3분기 → extractLogMessage 헬퍼 분리

Step 4: PitchMonitor.tsx 라벨 정정 (B-4)

Step 5: tsc --noEmit + npm run build + tests 전체 GREEN 확인

Step 6: TASKS.md Phase 1 리팩토링 항목 [x] → Phase 2 착수
```

---

## 보존 계약 (Interface Preservation)

리팩토링 중 **절대 변경하지 않는다**:

- `usePitchDetection()` 반환 인터페이스 (`UsePitchDetectionReturn`)
- `NoteInfo` 필드 구조
- `frequencyToNoteInfo()`, `calculateRmsAndDb()`, `detectPianoPitch()` 시그니처
- Boomwhackers 컬러 코드 (`NOTE_COLORS`)
- Phase 2 진입 전 Phase 1 컴포넌트 4종 (`PitchCard`, `PitchMonitor`, `AudioLogViewer`, `PianoRangeTester`) 삭제 금지
