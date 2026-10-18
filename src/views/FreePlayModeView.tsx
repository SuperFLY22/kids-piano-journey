/**
 * Kids Piano Journey - 자유 건반 연주 뷰
 * 대형 PitchCard, 노이즈 게이트 및 3D 피아노 건반
 */

import React from 'react';
import { PitchCard } from '../components/PitchCard';
import { NoiseGateControl } from '../components/NoiseGateControl';
import { VirtualPiano } from '../components/VirtualPiano';
import { NoteInfo, DetectedPitch } from '../types/audio';

interface FreePlayModeViewProps {
  confirmedNote: NoteInfo | null;
  debugInfo: DetectedPitch;
  isListening: boolean;
  noiseThreshold: number;
  onKeyClick: (fullName: string | null) => void;
  onThresholdChange: (val: number) => void;
}

export const FreePlayModeView: React.FC<FreePlayModeViewProps> = React.memo(({
  confirmedNote,
  debugInfo,
  isListening,
  noiseThreshold,
  onKeyClick,
  onThresholdChange,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 items-stretch">
      <div className="md:col-span-5 flex flex-col gap-2.5 justify-between">
        <PitchCard
          note={confirmedNote || debugInfo.note}
          rawFrequency={debugInfo.frequency}
          isListening={isListening}
          volumeDb={debugInfo.volumeDb}
          isGateOpen={debugInfo.isGateOpen}
        />
        <NoiseGateControl
          volumeDb={debugInfo.volumeDb}
          noiseThreshold={noiseThreshold}
          isGateOpen={debugInfo.isGateOpen}
          onThresholdChange={onThresholdChange}
        />
      </div>
      <div className="md:col-span-7 flex flex-col justify-center">
        <VirtualPiano
          activeNote={confirmedNote || debugInfo.note}
          targetNoteFullName={null}
          onKeyClick={onKeyClick}
        />
      </div>
    </div>
  );
});
