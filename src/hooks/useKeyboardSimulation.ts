import { useEffect, useRef } from 'react';

// 1. 물리적 키보드 위치 코드 (e.code 기준 - 한/영 자판 무관하게 100% 작동)
export const KEYBOARD_CODE_MAP: Record<string, string> = {
  'KeyA': 'C4',
  'KeyS': 'D4',
  'KeyD': 'E4',
  'KeyF': 'F4',
  'KeyG': 'G4',
  'KeyH': 'A4',
  'KeyJ': 'B4',
  'KeyK': 'C5',
  'Digit1': 'C4',
  'Digit2': 'D4',
  'Digit3': 'E4',
  'Digit4': 'F4',
  'Digit5': 'G4',
  'Digit6': 'A4',
  'Digit7': 'B4',
  'Digit8': 'C5',
};

// 2. 문자 기준 fallback (e.key 기준 - 영문 및 한글 두벌식 자음/모음 대응)
export const KEYBOARD_FALLBACK_MAP: Record<string, string> = {
  'a': 'C4', 'A': 'C4', 'ㅁ': 'C4',
  's': 'D4', 'S': 'D4', 'ㄴ': 'D4',
  'd': 'E4', 'D': 'E4', 'ㅇ': 'E4',
  'f': 'F4', 'F': 'F4', 'ㄹ': 'F4',
  'g': 'G4', 'G': 'G4', 'ㅎ': 'G4',
  'h': 'A4', 'H': 'A4', 'ㅗ': 'A4',
  'j': 'B4', 'J': 'B4', 'ㅓ': 'B4',
  'k': 'C5', 'K': 'C5', 'ㅏ': 'C5',
  '1': 'C4', '2': 'D4', '3': 'E4', '4': 'F4', '5': 'G4', '6': 'A4', '7': 'B4', '8': 'C5',
};

/**
 * 키보드 이벤트로부터 피아노 음이름(C4~G4)을 추출하는 순수 헬퍼
 */
export function resolveKeyboardNote(code?: string, key?: string): string | null {
  if (code && KEYBOARD_CODE_MAP[code]) {
    return KEYBOARD_CODE_MAP[code];
  }
  if (key && KEYBOARD_FALLBACK_MAP[key]) {
    return KEYBOARD_FALLBACK_MAP[key];
  }
  return null;
}

/**
 * Mac 키보드 물리키 및 한글 자음 입력을 피아노 타건 시뮬레이션으로 연결하는 커스텀 훅
 */
export function useKeyboardSimulation(onPlayNote: (fullName: string | null) => void): void {
  const onPlayNoteRef = useRef(onPlayNote);

  useEffect(() => {
    onPlayNoteRef.current = onPlayNote;
  }, [onPlayNote]);

  useEffect(() => {
    let activeIdentifier: string | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      const targetNote = resolveKeyboardNote(e.code, e.key);
      if (targetNote) {
        activeIdentifier = e.code || e.key;
        onPlayNoteRef.current(targetNote);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const match = resolveKeyboardNote(e.code, e.key);
      if (match && (activeIdentifier === e.code || activeIdentifier === e.key)) {
        activeIdentifier = null;
        onPlayNoteRef.current(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
}
