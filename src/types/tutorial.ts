import { CorePianoKeyDef } from '../utils/audioMath';

export interface TutorialStep {
  stepIndex: number;          // 0 ~ 4
  key: CorePianoKeyDef;       // C4, D4, E4, F4, G4 메타데이터
  fingerNumber: number;       // 1 ~ 5
  fingerName: string;         // '엄지', '검지', '중지', '약지', '새끼'
  prompt: string;             // 아이 대상 안내 메시지
}

export interface TutorialState {
  isActive: boolean;
  currentStepIndex: number;
  isCompleted: boolean;
  isCelebrating: boolean;
  lastSuccessNote: string | null;
}
