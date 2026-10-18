import { CORE_PIANO_KEYS } from './audioMath';

export interface PianoCalibrationProfile {
  calibratedAt: string;
  isCustom: boolean;
  notes: Record<string, number>; // { 'C4': 261.63, 'D4': 293.66, ... }
  baseA4: number;               // 계산된 기준 A4 주파수 (예: 440.5)
}

const STORAGE_KEY_PROFILE = 'kids_piano_calibration_profile';
const STORAGE_KEY_ONBOARDING_DONE = 'kids_piano_calibration_onboarding_done';

/**
 * 기본 표준 440Hz 기반 8음 프로파일
 */
export function getDefaultCalibrationProfile(): PianoCalibrationProfile {
  const notes: Record<string, number> = {};
  CORE_PIANO_KEYS.forEach((key) => {
    notes[key.fullName] = key.frequency;
  });

  return {
    calibratedAt: new Date().toISOString(),
    isCustom: false,
    notes,
    baseA4: 440.0,
  };
}

/**
 * 저장된 피아노 캘리브레이션 프로파일 불러오기
 */
export function loadCalibrationProfile(): PianoCalibrationProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.notes && typeof parsed.notes === 'object') {
      return parsed as PianoCalibrationProfile;
    }
  } catch (err) {
    console.error('Failed to load calibration profile:', err);
  }
  return null;
}

/**
 * 피아노 캘리브레이션 프로파일 저장
 */
export function saveCalibrationProfile(profile: PianoCalibrationProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    localStorage.setItem(STORAGE_KEY_ONBOARDING_DONE, 'true');
  } catch (err) {
    console.error('Failed to save calibration profile:', err);
  }
}

/**
 * 첫 실행 캘리브레이션 완료 여부 확인
 */
export function isCalibrationOnboardingDone(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_ONBOARDING_DONE) === 'true';
  } catch {
    return false;
  }
}

/**
 * 첫 실행 캘리브레이션 건너뛰기/완료 표시
 */
export function markCalibrationOnboardingDone(): void {
  try {
    localStorage.setItem(STORAGE_KEY_ONBOARDING_DONE, 'true');
  } catch (err) {
    console.error('Failed to mark calibration onboarding done:', err);
  }
}

/**
 * 캘리브레이션 프로파일 초기화
 */
export function resetCalibrationProfile(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_PROFILE);
    localStorage.removeItem(STORAGE_KEY_ONBOARDING_DONE);
  } catch (err) {
    console.error('Failed to reset calibration profile:', err);
  }
}
