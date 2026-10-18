export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type KoreanNoteName = '도' | '도#' | '레' | '레#' | '미' | '파' | '파#' | '솔' | '솔#' | '라' | '라#' | '시';

export interface NoteInfo {
  midi: number;
  noteName: NoteName;
  octave: number;
  fullName: string;          // e.g. "C4"
  koreanName: KoreanNoteName;// e.g. "도"
  frequency: number;         // ideal Hz
  color: string;             // Boomwhackers hex
  fingerNumber?: number;     // 1 for C4, 2 for D4, etc.
}

export interface DetectedPitch {
  frequency: number;         // Detected raw Hz
  note: NoteInfo | null;     // Mapped note info (if in valid piano range)
  clarity: number;           // Confidence / clarity (0.0 ~ 1.0)
  volumeDb: number;          // Input volume in dB (-100 ~ 0)
  isGateOpen: boolean;       // True if volumeDb >= noiseThreshold
  timestamp: number;         // Performance timestamp
}

export interface AudioLogEntry {
  id: string;
  time: string;
  volumeDb: number;
  frequency: number;
  noteName: string | null;
  isGateOpen: boolean;
  message: string;
}

export interface PitchDetectionConfig {
  bufferSize?: number;       // FFT / Analyser size (e.g. 2048)
  noiseThresholdDb?: number; // e.g. -55 dB
  yinThreshold?: number;     // YIN algorithm tolerance (e.g. 0.15)
}
