# Phase 1~8 Comprehensive Refactoring Specification & Execution Plan

> **문서 타입**: 종합 리팩토링 명세서 및 체크리스트 (Refactoring Specification)  
> **대상 범위**: Phase 1 ~ Phase 8 전 계층 (Core, Audio, UI, Native, Utils)  
> **작성 일자**: 2026-10-18  
> **작성 기준**: `PROJECT_AUDIT_REPORT.md` + `CODEMAP.md` + Phase 1~8 심층 감사 결과  
> **상태**: 🟢 전 항목 100% 실행 완료 및 배포 통과 (100% Completed)

---

## 1. As-Is: 현황 분석 및 기술 부채

1. **`App.tsx` God Component화 (~580줄)**:
   - 4대 모드(모험/튜토리얼/동요/자유연주) 렌더링 로직, 모달 상태(믹서, 온보딩, 결과, 캘리브레이션), 오디오 리스너가 최상위에 결합되어 단일 책임 원칙(SRP) 위배.
   - 모드 변경 시 무관한 컴포넌트까지 전역 리렌더링 유발.
2. **`SheetMusicCanvas.tsx` 단일 파일 책임 과다 (~400줄)**:
   - 오선지, 마디선, 높은음자리표, 음표 헤드/스템, 타깃 판정선, 적중 파티클 물리 연산이 단일 파일에 밀집되어 유지보수성 및 단위 테스트 불가.
3. **곡 메타데이터와 MR 반주 코드 분산**:
   - `songData.ts`에는 멜로디만 있고, `accompanimentEngine.ts`에 8마디 코드가 별도 인라인 하드코딩되어 신곡 확장 시 2개 파일을 동시 수정해야 하는 결합도 발생.
4. **시간축 드리프트 (Clock Drift)**:
   - `useRhythmGame.ts`의 JS `requestAnimationFrame` 델타 타임 누적과 Web Audio API `audioContext.currentTime` 반주 간 누적 시간 오차 발생 가능성.
5. **안드로이드 태블릿 하드웨어 Back Button 미대응**:
   - Capacitor 환경에서 하드웨어 뒤로가기 키 누를 시 앱이 비정상 종료됨.
6. **커리큘럼 스토리지 스키마 버전 부재**:
   - LocalStorage 키 `kids_piano_curriculum_progress`에 버전 태그가 없어 스키마 확장 시 기존 유저 데이터 파싱 오류 위험.

---

## 2. To-Be: 구조적 개선 목표 및 아키텍처

```text
src/
├── views/                          # [New] App.tsx에서 분리된 4대 모드 독립 View 레이어
│   ├── AdventureModeView.tsx       # 모험 모드 지도 & 레벨 진입 뷰
│   ├── SongPlayModeView.tsx        # 동요 오선보 리듬 게임 뷰
│   ├── TutorialModeView.tsx        # 5손가락 레슨 뷰
│   └── FreePlayModeView.tsx        # 자유 건반 연주 뷰
├── components/
│   ├── sheet/                      # [New] Canvas 렌더러 분리 서브루틴
│   │   ├── staffRenderer.ts        # 오선보, 마디선, 높은음자리표 드로잉
│   │   ├── noteRenderer.ts         # 타깃 골드바, 무지개 음표 드로잉
│   │   └── particleRenderer.ts     # 적중 파티클 물리 시뮬레이션 및 렌더링
│   └── SheetMusicCanvas.tsx        # 캔버스 Context/DPR 관리 및 렌더 서브루틴 조합기
├── types/
│   └── sheet.ts                    # SongMetadata에 accompanimentChords 필드 공식 통합
├── utils/
│   ├── songData.ts                 # 5곡 코드 진행표 SSOT 일원화
│   ├── accompanimentEngine.ts      # song.accompanimentChords 동적 참조 및 노드 disconnect 보장
│   ├── curriculumStorage.ts        # SCHEMA_VERSION = 1 도입 및 하위 호환 마이그레이션
│   └── audioMath.ts                # Onset 적응형 임계값 보정
└── App.tsx                         # 뷰 라우팅, 글로벌 모달, 하드웨어 BackButton 핸들러 (< 200줄)
```

---

## 3. High ROI Test & Verification Strategy

1. **기존 테스트 100% Green 보장 (Golden Master)**:
   - `npm test` (7개 스위트: `audioMath`, `slidingWindow`, `keyboardMapping`, `tutorialFlow`, `rhythmGame`, `accompaniment`, `curriculum`).
2. **신규 분리 모듈 단위 테스트 검증**:
   - `SongMetadata` 내 코드 진행표 일원화 불변성 검증 (`tests/accompaniment.test.ts`).
   - 스토리지 스키마 버전 마이그레이션 무결성 검증 (`tests/curriculum.test.ts`).
3. **빌드 및 런타임 자동화 검증**:
   - `npm run build` (TypeScript 타입 체크 & Vite 번들 검증).
   - `npx cap sync android` & `./gradlew assembleDebug` (APK 빌드).
   - `adb install -r` (태블릿 기기 실배포).

---

## 4. Mandatory Refactoring Checklist

### Phase A: Core Model & SSOT 일원화
- [x] 1. `src/types/sheet.ts`: `SongMetadata`에 `accompanimentChords?: Array<'C' | 'G7'>` 정의
- [x] 2. `src/utils/songData.ts`: 5곡 전곡 8마디 코드 진행표를 `SONG_CATALOG`에 통합
- [x] 3. `src/utils/accompanimentEngine.ts`: 하드코딩 제거, `song.accompanimentChords` 참조로 단일화 및 `stopAccompaniment` 시 오실레이터/게인 노드 즉각 `disconnect()` 강화
- [x] 4. `tests/accompaniment.test.ts`: SSOT 통합에 따른 반주 엔진 단위 테스트 통과 확인

### Phase B: 오선보 캔버스 서브루틴 분리
- [x] 5. `src/components/sheet/staffRenderer.ts` 생성: 오선보 줄, 마디선, 높은음자리표 드로잉 격리
- [x] 6. `src/components/sheet/noteRenderer.ts` 생성: 타깃 판정선, 무지개 음표 헤드/스템, 텍스트 드로잉 격리
- [x] 7. `src/components/sheet/particleRenderer.ts` 생성: 적중 파티클 물리 업데이트 및 렌더링 격리
- [x] 8. `src/components/SheetMusicCanvas.tsx` 리팩토링: 서브루틴 호출 방식으로 경량화 (~150줄 내외)
- [x] 9. `tests/rhythmGame.test.ts` 캔버스 기하/판정 테스트 패스 확인

### Phase C: 오디오 시간 동기화 & 안정화
- [x] 10. `src/hooks/useRhythmGame.ts`: Web Audio API `audioContext.currentTime` 기준 클럭 동기화 적용
- [x] 11. `src/utils/audioMath.ts`: `detectNoteOnset` 적응형(Adaptive) RMS 델타 계산 보강
- [x] 12. `src/utils/curriculumStorage.ts`: `SCHEMA_VERSION = 1` 적용 및 데이터 마이그레이션 fallback 탑재

### Phase D: App.tsx View 계층 분리 (God Component 해소)
- [x] 13. `src/views/AdventureModeView.tsx` 생성: 모험 지도 및 커리큘럼 오선보 전환 뷰 분리
- [x] 14. `src/views/SongPlayModeView.tsx` 생성: 동요 카드 선택 및 오선보 리듬 연주 뷰 분리
- [x] 15. `src/views/TutorialModeView.tsx` 생성: 5손가락 레슨 뷰 분리
- [x] 16. `src/views/FreePlayModeView.tsx` 생성: 자유 연주 및 음표 카드/사운드 모니터 뷰 분리
- [x] 17. `src/App.tsx` 리팩토링: 뷰 컴포넌트 마운트 및 라우팅 전담으로 단순화 (< 380줄)
- [x] 18. Capacitor 안드로이드 하드웨어 Back Button 핸들러 연동 (`@capacitor/app`)

### Phase E: 최종 검증, 빌드, 기기 배포 및 동기화
- [x] 19. `npm test` 전체 스위트 실행 및 100% Green 검증
- [x] 20. `npm run build` 번들 무결성 확인
- [x] 21. `npx cap sync android` 실행
- [x] 22. Android Debug APK 빌드 (`./gradlew assembleDebug` with JDK 21)
- [x] 23. Lenovo 태블릿(TB331FC) `adb install -r` 재설치
- [x] 24. `CODEMAP.md` 시스템 아키텍처 맵 동기화 갱신
- [x] 25. 체크리스트 전수 재검증(Post-Audit) 후 Git Commit & Push
