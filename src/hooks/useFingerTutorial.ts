import { useState, useCallback, useRef, useEffect } from 'react';
import { TUTORIAL_STEPS, isNoteMatchingStep } from '../utils/tutorialData';
import { soundEffects } from '../utils/soundEffects';
import { TutorialStep } from '../types/tutorial';
import { NoteInfo } from '../types/audio';

export interface UseFingerTutorialReturn {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: TutorialStep;
  isCompleted: boolean;
  isCelebrating: boolean;
  lastSuccessNote: string | null;
  startTutorial: () => void;
  stopTutorial: () => void;
  restartTutorial: () => void;
  handleNoteInput: (note: NoteInfo | string | null) => void;
  dismissCelebration: () => void;
}

export function useFingerTutorial(): UseFingerTutorialReturn {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [lastSuccessNote, setLastSuccessNote] = useState<string | null>(null);

  // 진행 중 타이머 및 인덱스 동기화 레프
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLockRef = useRef(false);
  const currentStepIndexRef = useRef(0);

  // currentStepIndex state와 ref 상시 동기화
  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

  const currentStep = TUTORIAL_STEPS[currentStepIndex] || TUTORIAL_STEPS[0];

  const startTutorial = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    setIsActive(true);
    setCurrentStepIndex(0);
    currentStepIndexRef.current = 0;
    setIsCompleted(false);
    setIsCelebrating(false);
    setLastSuccessNote(null);
    isLockRef.current = false;
  }, []);

  const stopTutorial = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    setIsActive(false);
    setIsCompleted(false);
    setIsCelebrating(false);
    isLockRef.current = false;
  }, []);

  const restartTutorial = useCallback(() => {
    startTutorial();
  }, [startTutorial]);

  const dismissCelebration = useCallback(() => {
    setIsCelebrating(false);
  }, []);

  /**
   * 마이크 피치(NoteInfo) 또는 가상 건반/키보드(string fullName)로부터 들어오는 음표 판정
   * currentStepIndexRef를 사용하여 함수 참조를 안정적으로 유지
   */
  const handleNoteInput = useCallback(
    (note: NoteInfo | string | null) => {
      if (!isActive || isCompleted || isLockRef.current) return;
      if (!note) return;

      const detectedFullName = typeof note === 'string' ? note : note.fullName;
      const stepIdx = currentStepIndexRef.current;
      const isMatch = isNoteMatchingStep(detectedFullName, stepIdx);
      if (!isMatch) return;

      // 정답 매칭 성공!
      isLockRef.current = true;
      setLastSuccessNote(detectedFullName);
      setIsCelebrating(true);

      const isLastStep = stepIdx >= TUTORIAL_STEPS.length - 1;

      if (isLastStep) {
        // 전체 튜토리얼 완료 (5단계)
        soundEffects.playFanfare();
        advanceTimerRef.current = setTimeout(() => {
          setIsCompleted(true);
          setIsCelebrating(false);
          isLockRef.current = false;
          advanceTimerRef.current = null;
        }, 1200);
      } else {
        // 다음 단계로 전진
        soundEffects.playSuccessDing();
        advanceTimerRef.current = setTimeout(() => {
          setCurrentStepIndex((prev) => {
            const next = prev + 1;
            currentStepIndexRef.current = next;
            return next;
          });
          setIsCelebrating(false);
          isLockRef.current = false;
          advanceTimerRef.current = null;
        }, 1100);
      }
    },
    [isActive, isCompleted]
  );

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
    };
  }, []);

  return {
    isActive,
    currentStepIndex,
    currentStep,
    isCompleted,
    isCelebrating,
    lastSuccessNote,
    startTutorial,
    stopTutorial,
    restartTutorial,
    handleNoteInput,
    dismissCelebration,
  };
}
