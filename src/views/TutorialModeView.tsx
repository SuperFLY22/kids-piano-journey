/**
 * Kids Piano Journey - 5손가락 레슨 튜토리얼 뷰
 * 오른손 손가락 가이드, 3D 건반, 노이즈 게이트 조절 UI
 */

import React from 'react';
import { TutorialGuide } from '../components/TutorialGuide';
import { VirtualPiano } from '../components/VirtualPiano';
import { NoiseGateControl } from '../components/NoiseGateControl';
import { NoteInfo, DetectedPitch } from '../types/audio';
import { useFingerTutorial } from '../hooks/useFingerTutorial';

interface TutorialModeViewProps {
  tutorial: ReturnType<typeof useFingerTutorial>;
  confirmedNote: NoteInfo | null;
  debugInfo: DetectedPitch;
  noiseThreshold: number;
  currentTargetNoteName: string | null;
  onClose: () => void;
  onKeyClick: (fullName: string | null) => void;
  onThresholdChange: (val: number) => void;
}

export const TutorialModeView: React.FC<TutorialModeViewProps> = React.memo(({
  tutorial,
  confirmedNote,
  debugInfo,
  noiseThreshold,
  currentTargetNoteName,
  onClose,
  onKeyClick,
  onThresholdChange,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 items-start">
      <div className="md:col-span-6 flex flex-col gap-2.5">
        <TutorialGuide
          currentStep={tutorial.currentStep}
          currentStepIndex={tutorial.currentStepIndex}
          isCelebrating={tutorial.isCelebrating}
          onClose={onClose}
          onRestart={tutorial.restartTutorial}
        />
      </div>
      <div className="md:col-span-6 flex flex-col gap-2.5">
        <VirtualPiano
          activeNote={confirmedNote || debugInfo.note}
          targetNoteFullName={currentTargetNoteName}
          onKeyClick={onKeyClick}
        />
        <NoiseGateControl
          volumeDb={debugInfo.volumeDb}
          noiseThreshold={noiseThreshold}
          isGateOpen={debugInfo.isGateOpen}
          onThresholdChange={onThresholdChange}
        />
      </div>
    </div>
  );
});
