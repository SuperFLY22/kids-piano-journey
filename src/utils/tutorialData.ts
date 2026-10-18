import { TutorialStep } from '../types/tutorial';
import { CORE_PIANO_KEYS } from './audioMath';

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    stepIndex: 0,
    key: CORE_PIANO_KEYS[0], // C4 (도)
    fingerNumber: 1,
    fingerName: '엄지',
    prompt: '1번 엄지손가락으로 빨간색 \'도(C4)\' 건반을 쳐보세요!',
  },
  {
    stepIndex: 1,
    key: CORE_PIANO_KEYS[1], // D4 (레)
    fingerNumber: 2,
    fingerName: '검지',
    prompt: '2번 집게손가락(검지)으로 주황색 \'레(D4)\' 건반을 쳐보세요!',
  },
  {
    stepIndex: 2,
    key: CORE_PIANO_KEYS[2], // E4 (미)
    fingerNumber: 3,
    fingerName: '중지',
    prompt: '3번 가운뎃손가락(중지)으로 노란색 \'미(E4)\' 건반을 쳐보세요!',
  },
  {
    stepIndex: 3,
    key: CORE_PIANO_KEYS[3], // F4 (파)
    fingerNumber: 4,
    fingerName: '약지',
    prompt: '4번 넷째손가락(약지)으로 초록색 \'파(F4)\' 건반을 쳐보세요!',
  },
  {
    stepIndex: 4,
    key: CORE_PIANO_KEYS[4], // G4 (솔)
    fingerNumber: 5,
    fingerName: '새끼',
    prompt: '5번 새끼손가락으로 하늘색 \'솔(G4)\' 건반을 쳐보세요!',
  },
  {
    stepIndex: 5,
    key: CORE_PIANO_KEYS[5], // A4 (라)
    fingerNumber: 1,
    fingerName: '엄지',
    prompt: '손을 옆으로 살짝 옮겨 1번 엄지손가락으로 남색 \'라(A4)\' 건반을 쳐보세요!',
  },
  {
    stepIndex: 6,
    key: CORE_PIANO_KEYS[6], // B4 (시)
    fingerNumber: 2,
    fingerName: '검지',
    prompt: '2번 집게손가락(검지)으로 보라색 \'시(B4)\' 건반을 쳐보세요!',
  },
  {
    stepIndex: 7,
    key: CORE_PIANO_KEYS[7], // C5 (높은도)
    fingerNumber: 3,
    fingerName: '중지',
    prompt: '3번 가운뎃손가락(중지)으로 빨간색 \'높은 도(C5)\' 건반을 쳐보세요!',
  },
];

/**
 * 주어진 음표가 현재 튜토리얼 스텝의 타깃과 일치하는지 순수 판정
 */
export function isNoteMatchingStep(
  detectedFullName: string | undefined | null,
  stepIndex: number
): boolean {
  if (!detectedFullName) return false;
  const targetStep = TUTORIAL_STEPS[stepIndex];
  if (!targetStep) return false;
  return detectedFullName === targetStep.key.fullName;
}
