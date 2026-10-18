# Phase 9 Polish & Refactoring Specification

> **작성일자**: 2026-10-18  
> **대상 모듈**: `src/components/StickerBookModal.tsx`, `src/hooks/useRhythmGame.ts`, `src/components/CountdownOverlay.tsx`, `CODEMAP.md`  
> **목적**: Phase 9 (카운트다운, 템포 배속 조절, 스티커북 수집 시스템) 완성 후 코드 순도 향상, 메모리 누수 방지, I/O 최적화 및 아키텍처 맵 동기화

---

## 1. As-Is 분석 및 기술 부채 점검

### A. `StickerBookModal.tsx` I/O 반복 및 리소스 누수 위험
1. **반복 LocalStorage 역직렬화**: 모달이 열려 있는 동안 카테고리 탭 전환 및 스티커 클릭마다 `loadUnlockedStickers()`가 호출되어 동기식 `localStorage.getItem` 및 `JSON.parse`가 반복 실행됨.
2. **`setTimeout` 클린업 누락**: 스티커 터치 시 800ms 바운스 애니메이션 타이머(`setBouncingStickerId`)가 등록되지만, 타이머가 만료되기 전에 모달이 닫히거나 언마운트될 경우 상태 변경 시도 및 메모리 누수 가능성 존재.
3. **`newlyUnlockedSticker` 잉여 프롭**: `App.tsx`에서 `<StickerBookModal newlyUnlockedSticker={...} />`로 신규 획득 스티커를 전달하고 있으나, 모달 내부 Props 인터페이스에 미선언되어 신규 획득 스티커가 모달 진입 시 자동 하이라이트되지 못함.

### B. `useRhythmGame.ts` 카운트다운 틱 트리거 이원화
- `restartGame()` 및 `selectSong()` 함수 본체에서 `accompaniment.playCountdownTick(3)`을 수동 호출하고, `gameLoop`의 `curTime < 0` 구간에서도 `playCountdownTick(countdownStep)`을 스케줄링하여 시작 시점의 틱 연출이 수동 호출과 루프 감시 로직으로 분산되어 있음.

### C. `CountdownOverlay.tsx` 렌더링 최적화 부재
- 60fps 오선보 캔버스 컨테이너 내에서 `countdown` 변경 시에만 렌더링되어야 하나, `React.memo`가 적용되지 않아 부모 캔버스 컴포넌트의 상태 변동에 불필요하게 영향받을 수 있음.

### D. `CODEMAP.md` 아키텍처 다이어그램 미동기화
- 디렉터리 트리는 동기화되었으나, 섹션 2의 Mermaid 데이터 흐름도에 Phase 9의 "3초 카운트다운 틱 파이프라인" 및 "완곡 성취도 -> 스티커 해금 -> LocalStorage 영속화" 흐름이 미반영됨.

---

## 2. To-Be 설계 및 외과수술적 개선 방안

### A. `StickerBookModal.tsx` 최적화
1. `useMemo` 기반의 해금 스티커 목록 캐싱 (`isOpen` 변경 시에만 동기 로드).
2. `useRef<NodeJS.Timeout[]>`을 도입하여 컴포넌트 언마운트 시 모든 실행 중인 바운스 타이머 일괄 해제(`clearTimeout`).
3. `newlyUnlockedSticker` Props 인터페이스 추가 및, 모달 오픈 시 신규 획득 스티커가 있으면 `previewSticker`와 `bouncingStickerId`로 자동 포커싱.

### B. `useRhythmGame.ts` 카운트다운 상태 전이 정돈
- `restartGame()` 및 `selectSong()`의 수동 틱 호출을 일원화하고, `lastCountdownStepRef`의 초기값과 `gameLoop` 내의 카운트다운 전이 로직을 명확히 단일 경로로 수렴.

### C. `CountdownOverlay.tsx`
- `React.memo`를 적용하여 `countdown` 프롭이 변경될 때만 렌더링되도록 최적화.

### D. `CODEMAP.md` 다이어그램 동기화
- Mermaid 다이어그램에 `Phase 9 카운트다운 및 템포 제어 파이프라인`과 `Phase 9 스티커북 수집 및 보상 파이프라인` 서브그래프를 공식 추가.

---

## 3. High ROI 테스트 전략 & 불변성 검증

1. **기존 8개 테스트 스위트 100% Pass 불변성 유지**:
   - `audioMath.test.ts`, `slidingWindow.test.ts`, `keyboardMapping.test.ts`, `tutorialFlow.test.ts`, `rhythmGame.test.ts`, `accompaniment.test.ts`, `curriculum.test.ts`, `sticker.test.ts`
2. **카운트다운 타이밍 및 스크롤 정지 불변성**:
   - `timeRef.current < 0` 구간에서 타깃 음표 타건 방어 및 스크롤 0 정지 유지.
3. **스티커 해금 및 영속성 무결성**:
   - 별 2개 이상 해금 및 LocalStorage CRUD 영속성 보존.
4. **TypeScript 및 번들링 무결성**:
   - `npm run build` (`tsc && vite build`) 무경고 통과.

---

## 4. Mandatory Refactoring Checklist

- [ ] **Step 1: Baseline Protection Check**
  - [ ] `npm test` 실행하여 8개 테스트 스위트 100% 초록불(Pass) 확인
- [ ] **Step 2: `StickerBookModal.tsx` 리팩토링**
  - [ ] `newlyUnlockedSticker?: RewardSticker | null;` 및 `onDismissNewSticker?: () => void;` Props 정의
  - [ ] `useMemo` 기반 `loadUnlockedStickers()` 캐싱
  - [ ] `bounceTimerRef` 도입 및 `useEffect` 언마운트 클린업
  - [ ] `newlyUnlockedSticker` 존재 시 초기 프리뷰 & 바운스 자동 포커싱
- [ ] **Step 3: `useRhythmGame.ts` 카운트다운 스케줄링 일원화**
  - [ ] 수동 틱 호출 정리 및 루프 단일 진입 경로 정돈
- [ ] **Step 4: `CountdownOverlay.tsx` 최적화**
  - [ ] `React.memo` 래핑 적용
- [ ] **Step 5: `CODEMAP.md` Mandatory Sync**
  - [ ] Mermaid 데이터 흐름도에 Phase 9 카운트다운 및 스티커북 수집 파이프라인 추가
- [ ] **Step 6: 회귀 검증 및 빌드 테스트**
  - [ ] `npm test` 8개 테스트 스위트 100% Green 확인
  - [ ] `npm run build` 빌드 성공 확인
- [ ] **Step 7: Post-Audit Checklist 재검증**
  - [ ] 본 계획서의 모든 체크박스(`- [ ]`) 전수 검증 후 `- [x]` 갱신
