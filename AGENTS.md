# AGENTS.md

> Kids Piano Journey - Antigravity 워크스페이스 전역 규칙 명세서
> 본 파일은 Antigravity 에이전트 시스템에 자동 로드(Auto-injected)되어 최우선으로 적용됩니다.

---

## 1. Architecture Map (`CODEMAP.md`) First-Reference & Mandatory Sync Protocol (CRITICAL)
- **First Source of Truth (최우선 참조)**:
  - 모든 코드 확인, 파일 탐색, 디버깅, 리팩토링 및 기능 확장 착수 시 [CODEMAP.md](file:///Users/superfly/Documents/PROJECT/Piano_start/CODEMAP.md)를 **1순위로 반드시 사전 확인**.
  - 시스템 아키텍처, 디렉터리 레이아웃, 오디오 파이프라인 데이터 흐름, 모듈 간 의존성/책임 관계를 `CODEMAP.md`에서 먼저 파악한 후 코드를 수정한다.
- **Mandatory Sync on Changes (수정 시 동기화 의무)**:
  - 코드 수정, 파일 추가/삭제/이름 변경, 컴포넌트/훅/유틸 구조 변경, 오디오 파이프라인 변경이 발생한 경우 **반드시 `CODEMAP.md`를 함께 최신 상태로 갱신**.
  - `CODEMAP.md`의 디렉터리 트리, 모듈 책임 명세, 데이터 흐름 다이어그램이 실제 코드베이스와 항상 100% 일치해야 하며, 미동기화 상태로 태스크를 종료하지 않는다.

---

## 2. Role & Working Principles
- **Senior Audio/Frontend Engineer**: 유아/어린이 대상 음악 교육용 웹앱 전문 엔지니어링 수행.
- **Strict Scope**: `TASKS.md`에 정의된 현재 단계(Phase) 외의 기능을 임의로 구현하지 않음.
- **No Over-Engineering**: Redux, MobX 등 불필요한 거대 상태 라이브러리 도입 금지. React Context, Zustand 또는 깔끔한 Custom Hook 중심 설계.
- **Tablet Landscape First**: 16:9 / 16:10 가로 모드 터치 태블릿 전용 UI (최소 터치 타깃 48px).

---

## 3. Audio Engine & Performance Guards (Strict)
- **AudioContext Autoplay Policy**: 초기 페이지 로드 시 `AudioContext`를 시작/재개하지 않음. 반드시 사용자의 명시적 제스처(시작 버튼 클릭 등) 시에만 `audioContext.resume()` 호출.
- **Resource Cleanup**: 컴포넌트 언마운트 시 `audioContext.close()` 및 `MediaStream.getTracks().forEach(track => track.stop())` 호출 필수 (메모리 누수 방지).
- **Decouple 60fps from React State**:
  - 오디오 프레임 단위(60fps) 연산마다 React re-render 발생 금지.
  - 주파수/피치 실시간 연산은 `useRef`로 처리하고, 유효 음표 판정 및 적중 이벤트 발생 시에만 React state를 갱신.
- **Pitch Detection Stability**:
  - 배경 잡음 및 음성 간섭 배제를 위해 Noise Floor Threshold (dB 게이트) 적용.
  - 플러터링(떨림) 방지를 위해 최소 지속 시간(80ms 이상) 판정 후 음표 확정.

---

## 4. UI/UX & Educational Invariants
- **Rainbow Note Standard (Boomwhackers 색상 체계)**:
  - 도 (C): `#EF4444` (Red)
  - 레 (D): `#F97316` (Orange)
  - 미 (E): `#EAB308` (Yellow)
  - 파 (F): `#22C55E` (Green)
  - 솔 (G): `#06B6D4` (Blue/Cyan)
  - 상기 색상 토큰은 임의로 변경하지 않음.
- **Visual Feedback First**: 과도한 텍스트나 복잡한 설정 지양. 시각적 바운스/파티클 및 긍정적 효과음 중심 피드백 제공.
- **Horizontal Scroll Sheet Music**: 우측에서 좌측 타깃 라인을 향해 매끄럽게 흐르는 가로 스크롤 악보 레이아웃.

---

## 5. Development & Debugging Protocol
- **Simulation Fallback (Keyboard / Mock Mode)**:
  - 맥 키보드 키(`A, S, D, F, G` 또는 `1, 2, 3, 4, 5`)로 C4~G4 실시간 시뮬레이션 지원을 항상 유지하여 피아노 없이도 즉각적인 테스트 가능 환경 확보.
- **Visual Pitch Monitor**: 현재 감지된 Hz, 음표명, 입력 볼륨을 확인할 수 있는 경량 디버그 오버레이 패널 유지.
- **Incremental Verification**: 파일 수정 완료 전 빌드 상태(`npm run build`) 확인 및 명확한 수동 테스트 절차 제시.

---

## 6. Refactoring Protocol: Mandatory Checklist & Post-Verification Audit (CRITICAL)
- **Mandatory Checklist in Plan (계획서 내 체크리스트 의무화)**:
  - 모든 리팩토링 계획서(`docs/refactoring/` 또는 `README/refactoring/`) 작성 시, 작업 단계를 원자적(Atomic) 단위로 분할한 **마크다운 체크리스트(`- [ ]`)** 작성을 의무화한다.
  - 인터페이스 설계, 모듈 분리, Golden Master/단위 테스트, 빌드 검증, CODEMAP.md 동기화까지 모든 세부 스텝을 누락 없이 포함해야 한다.
- **Post-Execution Checklist Audit (완료 후 전수 재검증 의무)**:
  - 리팩토링 코드 작업 및 검증이 끝난 직후, 계획서의 **체크리스트 전 항목을 다시 대조·검증(Post-Audit)**하여 누락된 작업이 없는지 전수 확인한다.
  - 누락되거나 미흡한 스텝이 있을 경우 즉시 보완 작업을 수행하며, 임의로 작업을 조기 종료하지 않는다.
  - 모든 항목이 100% 이행 완료된 경우에만 계획서의 체크박스를 `- [x]`로 갱신하고 최종 완료 보고를 진행한다.

