import { NoteInfo, NoteName, KoreanNoteName } from '../types/audio';

// 12음계 영문 및 한글 명칭
export const NOTE_NAMES: readonly NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const KOREAN_NOTE_NAMES: readonly KoreanNoteName[] = ['도', '도#', '레', '레#', '미', '파', '파#', '솔', '솔#', '라', '라#', '시'];

// Boomwhackers 표준 컬러 팔레트 (아이 친화적 고채도 컬러)
export const NOTE_COLORS: Record<NoteName, string> = {
  'C': '#EF4444',  // 빨강 (도)
  'C#': '#F43F5E', // 로즈
  'D': '#F97316',  // 주황 (레)
  'D#': '#FB923C', // 연주황
  'E': '#EAB308',  // 노랑 (미)
  'F': '#22C55E',  // 초록 (파)
  'F#': '#10B981', // 에메랄드
  'G': '#06B6D4',  // 하늘/파랑 (솔)
  'G#': '#3B82F6', // 블루
  'A': '#6366F1',  // 남색 (라)
  'A#': '#8B5CF6', // 바이올렛
  'B': '#A855F7',  // 보라 (시)
};

// C4~C5 1옥타브 오른손 기본 손가락 번호 (1~5번 및 엄지 넘김 스케일)
export const C4_G4_FINGERS: Record<string, number> = {
  'C4': 1,
  'D4': 2,
  'E4': 3,
  'F4': 4,
  'G4': 5,
  'A4': 1, // 스케일 엄지 넘김 (또는 6)
  'B4': 2,
  'C5': 3,
};

// 가온 C ~ 높은 C (C4~C5) 핵심 8건반 메타데이터 (SSOT 단일 진실 공급원)
export interface CorePianoKeyDef {
  fullName: string;
  noteName: NoteName;
  koreanName: KoreanNoteName;
  shortcut: string;
  color: string;
  finger: number;
  midi: number;
  frequency: number;
}

export const CORE_PIANO_KEYS: readonly CorePianoKeyDef[] = [
  { fullName: 'C4', noteName: 'C', koreanName: '도', shortcut: 'A / 1', color: NOTE_COLORS['C'], finger: 1, midi: 60, frequency: 261.63 },
  { fullName: 'D4', noteName: 'D', koreanName: '레', shortcut: 'S / 2', color: NOTE_COLORS['D'], finger: 2, midi: 62, frequency: 293.66 },
  { fullName: 'E4', noteName: 'E', koreanName: '미', shortcut: 'D / 3', color: NOTE_COLORS['E'], finger: 3, midi: 64, frequency: 329.63 },
  { fullName: 'F4', noteName: 'F', koreanName: '파', shortcut: 'F / 4', color: NOTE_COLORS['F'], finger: 4, midi: 65, frequency: 349.23 },
  { fullName: 'G4', noteName: 'G', koreanName: '솔', shortcut: 'G / 5', color: NOTE_COLORS['G'], finger: 5, midi: 67, frequency: 392.00 },
  { fullName: 'A4', noteName: 'A', koreanName: '라', shortcut: 'H / 6', color: NOTE_COLORS['A'], finger: 1, midi: 69, frequency: 440.00 },
  { fullName: 'B4', noteName: 'B', koreanName: '시', shortcut: 'J / 7', color: NOTE_COLORS['B'], finger: 2, midi: 71, frequency: 493.88 },
  { fullName: 'C5', noteName: 'C', koreanName: '도', shortcut: 'K / 8', color: NOTE_COLORS['C'], finger: 3, midi: 72, frequency: 523.25 },
];

/**
 * C4~C5 건반 명칭에 따른 표준 NoteInfo 객체 생성 헬퍼 (SSOT)
 */
export function getCoreKeyNoteInfo(fullName: string): NoteInfo | null {
  const key = CORE_PIANO_KEYS.find((k) => k.fullName === fullName);
  if (!key) return null;
  return {
    fullName: key.fullName,
    noteName: key.noteName,
    koreanName: key.koreanName,
    octave: key.fullName.startsWith('C5') ? 5 : 4,
    frequency: key.frequency,
    color: key.color,
    fingerNumber: key.finger,
    midi: key.midi,
  };
}

// 피아노 지원 음역대: C3(약 130.81Hz, MIDI 48) ~ C7(약 2093.00Hz, MIDI 96) (3옥타브부터 6옥타브 전체 포함)
export const MIN_PIANO_MIDI = 48; // C3
export const MAX_PIANO_MIDI = 96; // C7 (6옥타브 C6~B6 및 C7 포함)

export function frequencyToMidi(frequency: number, baseA4: number = 440): number {
  if (frequency <= 0) return 0;
  return Math.round(69 + 12 * Math.log2(frequency / baseA4));
}

export function midiToFrequency(midi: number, baseA4: number = 440): number {
  return baseA4 * Math.pow(2, (midi - 69) / 12);
}

export function getCentsDeviation(frequency: number, midi: number, baseA4: number = 440): number {
  const targetFreq = midiToFrequency(midi, baseA4);
  if (frequency <= 0 || targetFreq <= 0) return 0;
  return Math.round(1200 * Math.log2(frequency / targetFreq));
}

export function frequencyToNoteInfo(
  frequency: number,
  calibrationProfile?: { notes: Record<string, number>; baseA4?: number } | null
): NoteInfo | null {
  // 65Hz (C2) ~ 2300Hz (C7 상단) 전 대역 수용
  if (!frequency || frequency < 65 || frequency > 2300) {
    return null;
  }

  const baseA4 = calibrationProfile?.baseA4 || 440;

  // 1. 사용자 피아노 8음 캘리브레이션 프로파일이 있는 경우 최근접 매칭 우선 시도 (C4~C5 범위)
  if (calibrationProfile && calibrationProfile.notes) {
    let closestKey: string | null = null;
    let minCentsDiff = 999;

    for (const [keyName, calibratedFreq] of Object.entries(calibrationProfile.notes)) {
      if (calibratedFreq > 0) {
        const centsDiff = Math.abs(1200 * Math.log2(frequency / calibratedFreq));
        // ±45 센트(반음의 45%) 이내로 가장 가까운 음표 탐색
        if (centsDiff < 45 && centsDiff < minCentsDiff) {
          minCentsDiff = centsDiff;
          closestKey = keyName;
        }
      }
    }

    if (closestKey) {
      const coreInfo = getCoreKeyNoteInfo(closestKey);
      if (coreInfo) {
        return coreInfo;
      }
    }
  }

  // 2. 캘리브레이션 baseA4 기준 동적 MIDI 매핑 (3옥타브 C3~B3 및 6옥타브 C6~B6 전 구간 수용)
  const midi = frequencyToMidi(frequency, baseA4);
  if (midi < MIN_PIANO_MIDI || midi > MAX_PIANO_MIDI) {
    return null;
  }

  const noteIndex = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const noteName = NOTE_NAMES[noteIndex];
  const koreanName = KOREAN_NOTE_NAMES[noteIndex];
  const fullName = `${noteName}${octave}`;

  return {
    midi,
    noteName,
    octave,
    fullName,
    koreanName,
    frequency: midiToFrequency(midi, baseA4),
    color: NOTE_COLORS[noteName],
    fingerNumber: C4_G4_FINGERS[fullName] ?? undefined,
  };
}

export function calculateRmsAndDb(buffer: Float32Array): { rms: number; db: number } {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    const val = buffer[i];
    sum += val * val;
  }
  const rms = Math.sqrt(sum / buffer.length);
  const db = rms > 0.00001 ? 20 * Math.log10(rms) : -100;
  return { rms, db: Math.max(-100, Math.min(0, db)) };
}

/**
 * 피아노 음향학 특화 YIN 피치 검출기 (Min-Tau Guard 내장)
 * 19,000Hz 같은 초고주파 노이즈 lag(tau < 35)를 원천 차단하고
 * 피아노 가온 음역대(C3 130Hz ~ B5 987Hz)에 존재하는 기음 주파수만 정확히 추출합니다.
 */
export function detectPianoPitch(
  buffer: Float32Array,
  sampleRate: number = 48000,
  threshold: number = 0.15
): number | null {
  const bufferSize = buffer.length;
  const yinBufferLength = Math.floor(bufferSize / 2);
  const yinBuffer = new Float32Array(yinBufferLength);

  // 1. Difference function
  for (let t = 1; t < yinBufferLength; t++) {
    let diff = 0;
    for (let i = 0; i < yinBufferLength; i++) {
      const delta = buffer[i] - buffer[i + t];
      diff += delta * delta;
    }
    yinBuffer[t] = diff;
  }

  // 2. Cumulative mean normalized difference
  yinBuffer[0] = 1;
  let runningSum = 0;
  for (let t = 1; t < yinBufferLength; t++) {
    runningSum += yinBuffer[t];
    yinBuffer[t] = runningSum > 0 ? (yinBuffer[t] * t) / runningSum : 1;
  }

  // 3. Min-Tau Guard: 피아노 가온 및 확장 음역(80Hz ~ 2200Hz) 범위 탐색 (C3~C6 전구간 지원)
  // tau = sampleRate / freq
  // 2200Hz -> tau ~ 21 (48kHz 기준), 초고주파 노이즈 원천 배제
  const minTau = Math.max(16, Math.floor(sampleRate / 2200));
  const maxTau = Math.min(yinBufferLength - 2, Math.floor(sampleRate / 80));

  let tau = -1;
  for (let t = minTau; t < maxTau; t++) {
    if (yinBuffer[t] < threshold) {
      while (t + 1 < maxTau && yinBuffer[t + 1] < yinBuffer[t]) {
        t++;
      }
      tau = t;
      break;
    }
  }

  // 임계값 미만 골을 못 찾은 경우 피아노 음역대 내 최소 골 탐색
  if (tau === -1) {
    let minVal = 999;
    let minIdx = -1;
    for (let t = minTau; t < maxTau; t++) {
      if (yinBuffer[t] < minVal) {
        minVal = yinBuffer[t];
        minIdx = t;
      }
    }
    // 상대적으로 명확한 피크인 경우 채택 (신뢰도 기준 0.35 이하)
    if (minIdx > 0 && minVal < 0.35) {
      tau = minIdx;
    } else {
      return null;
    }
  }

  // 4. Parabolic interpolation for sub-sample accuracy
  const s1 = yinBuffer[tau];

  // 3-1. 저음(3옥타브 C3~B3) 2차 배음(Octave Error) 정밀 보정기:
  // 순음(s1 < 0.08)은 그대로 보존하고, 복합 피아노음에서 2차 배음 딥보다 기음 딥이 더 깊거나 유의미할 때만 전환
  const detectedRoughFreq = sampleRate / tau;
  if (s1 >= 0.08 && detectedRoughFreq >= 200 && detectedRoughFreq <= 600) {
    const doubleTau = tau * 2;
    if (doubleTau < maxTau) {
      let subMinVal = 999;
      let subMinTau = doubleTau;
      for (let dt = Math.max(minTau, doubleTau - 4); dt <= Math.min(maxTau, doubleTau + 4); dt++) {
        if (yinBuffer[dt] < subMinVal) {
          subMinVal = yinBuffer[dt];
          subMinTau = dt;
        }
      }
      if (subMinVal <= s1 * 1.05 && subMinVal < 0.25) {
        tau = subMinTau;
      }
    }
  }

  const s0Final = yinBuffer[tau - 1];
  const s1Final = yinBuffer[tau];
  const s2Final = yinBuffer[tau + 1];
  const denom = 2 * (2 * s1Final - s2Final - s0Final);
  const betterTau = denom !== 0 ? tau + (s2Final - s0Final) / denom : tau;

  if (betterTau <= 0) return null;
  return sampleRate / betterTau;
}

/**
 * 피아노 주파수 보정 함수 (순수 함수)
 * C4(261Hz) ~ C5(523Hz) 및 상위 옥타브의 기음이 훼손되지 않도록 보호합니다.
 * YIN 알고리즘의 Min-Tau Guard와 함께 작동하여 왜곡 없이 원음 주파수를 보존합니다.
 */
export function correctPianoHarmonics(rawFreq: number): number {
  // C5(523.25Hz) 타건 시 C4(261Hz)로 강제 변환되던 하드코딩 반감 로직을 안전하게 제거
  return rawFreq;
}

export interface EnergyHistoryEntry {
  rms: number;
  db: number;
  time: number;
}

export interface OnsetDetectionConfig {
  minRiseDb?: number;     // 30~50ms 사이 최소 데시벨 급상승 폭 (기본값: 4.5 dB)
  timeWindowMs?: number;  // 직전 에너지 비교 윈도우 (기본값: 50 ms)
  minTimeDiffMs?: number; // 1프레임 노이즈 방지를 위한 최소 시간차 (기본값: 15 ms)
  minRms?: number;        // 노이즈 플로어 방지를 위한 최소 유효 RMS (기본값: 0.005)
}

/**
 * 동음 연타(Repeated Notes) 인식을 위한 Energy Onset 감지기 (순수 함수)
 * 피아노 해머가 현을 때릴 때 발생하는 짧은 시간(30ms~50ms) 동안의
 * 급격한 RMS/dB 에너지 상승(Transient Attack Spike)을 감지합니다.
 * 서스테인 울림이 남아있는 상태에서 같은 음('미-미-미')을 재타건할 때
 * 새로운 노트 시작점(Onset)을 정확히 분리합니다.
 */
export function detectNoteOnset(
  currentRms: number,
  currentDb: number,
  history: EnergyHistoryEntry[],
  nowTimestamp: number,
  config?: OnsetDetectionConfig
): boolean {
  const minRiseDb = config?.minRiseDb ?? 4.5;
  const timeWindowMs = config?.timeWindowMs ?? 50;
  const minTimeDiffMs = config?.minTimeDiffMs ?? 15;
  const minRms = config?.minRms ?? 0.005;

  // 1. 현재 에너지가 최소 유효 RMS 미만이면 Onset 무시 (무음/극저음 노이즈 방지)
  if (currentRms < minRms || currentDb <= -70) {
    return false;
  }

  // 2. 최근 윈도우(minTimeDiffMs ~ timeWindowMs)에 속하는 직전 프레임들 탐색
  let minRecentDb = 999;
  let validHistoryCount = 0;

  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];
    const dt = nowTimestamp - entry.time;

    // 윈도우를 벗어난 너무 오래된 항목은 탐색 종료 (history가 시간순 정렬되어 있다고 가정)
    if (dt > timeWindowMs) {
      break;
    }

    // 너무 최근(예: < 15ms)은 동일 프레임 또는 동일 타건 진행 중이므로 제외
    if (dt >= minTimeDiffMs) {
      if (entry.db < minRecentDb) {
        minRecentDb = entry.db;
      }
      validHistoryCount++;
    }
  }

  // 비교할 수 있는 직전 이력이 없으면 Onset 판정 불가
  if (validHistoryCount === 0 || minRecentDb === 999) {
    return false;
  }

  // 3. 직전 최소 데시벨 대비 현재 데시벨의 급상승 폭(Attack Spike) 판정
  const dbRise = currentDb - minRecentDb;
  return dbRise >= minRiseDb;
}
