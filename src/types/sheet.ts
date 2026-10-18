/**
 * Kids Piano Journey - 오선보 및 리듬 게임 도메인 모델
 * 가로 스크롤 오선보 렌더링, 악보 시퀀스, 타이밍 판정에 필요한 타입 정의
 */

export type ClefType = 'treble';

export type NotePitch = 'C4' | 'D4' | 'E4' | 'F4' | 'G4' | 'A4' | 'B4' | 'C5';

export type HitRating = 'PERFECT' | 'GOOD' | 'MISS' | null;

export interface SheetNote {
  id: string;
  pitch: NotePitch;
  stepIndex: number;
  /** 곡 시작점 기준 비트 (예: 0, 1, 2, 3...) */
  beat: number;
  /** 음표 길이 (1 = 4분음표, 2 = 2분음표, 4 = 온음표) */
  duration: number;
  /** 권장 손가락 번호 (1:엄지 ~ 5:새끼) */
  finger: number;
  /** 계이름 ('도', '레', '미', '파', '솔', '라', '시') */
  solfege: string;
  /** Boomwhackers 무지개 색상 코드 */
  color: string;
  /** 판정 완료 여부 */
  hit?: boolean;
  rating?: HitRating;
}

export interface SongMetadata {
  id: string;
  title: string;
  composer: string;
  bpm: number;
  beatsPerMeasure: number;
  totalMeasures: number;
  difficulty?: '★☆☆' | '★★☆' | '★★★';
  description?: string;
  icon?: string;
  themeColor?: string;
  notes: SheetNote[];
  /** [Phase 7 & Refactor] 8마디 코드 진행표 (마디당 4박) */
  accompanimentChords?: Array<'C' | 'G7'>;
}

export type RhythmPlayMode = 'practice' | 'play';
export type PlaybackSpeed = 0.75 | 1.0;

export interface RhythmGameState {
  isPlaying: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  playMode: RhythmPlayMode;
  isWaitingForInput: boolean;
  currentTimeSec: number;
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  goodCount: number;
  missCount: number;
  activeTargetNote: SheetNote | null;
  speed?: PlaybackSpeed;
  countdown?: number | 'GO' | null;
}


export interface SongEvaluation {
  stars: 1 | 2 | 3;
  title: string;
  subtitle: string;
  badgeText: string;
  imageSrc: string;
  scorePercent: number;
}
