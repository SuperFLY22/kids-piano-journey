/**
 * Kids Piano Journey - 동요 자유 연주 뷰
 * 5곡 선택 카드 슬라이더, 리듬 헤더, 오선보 캔버스, 가상 건반 및 사운드 모니터
 */

import React from 'react';
import { SongSelectionCardList } from '../components/SongSelectionCardList';
import { SongPlayHeader } from '../components/SongPlayHeader';
import { SheetMusicCanvas } from '../components/SheetMusicCanvas';
import { VirtualPiano } from '../components/VirtualPiano';
import { SongModeSoundMonitor } from '../components/SongModeSoundMonitor';
import { SongMetadata } from '../types/sheet';
import { NoteInfo, DetectedPitch } from '../types/audio';
import { useRhythmGame } from '../hooks/useRhythmGame';
import { SONG_CATALOG } from '../utils/songData';

interface SongPlayModeViewProps {
  rhythmGame: ReturnType<typeof useRhythmGame>;
  confirmedNote: NoteInfo | null;
  debugInfo: DetectedPitch;
  isListening: boolean;
  noiseThreshold: number;
  currentTargetNoteName: string | null;
  onSelectSong: (song: SongMetadata) => void;
  onPlay: () => void;
  onRestart: () => void;
  onKeyClick: (fullName: string | null) => void;
  onThresholdChange: (val: number) => void;
  onOpenSoundMixer: () => void;
}

export const SongPlayModeView: React.FC<SongPlayModeViewProps> = React.memo(({
  rhythmGame,
  confirmedNote,
  debugInfo,
  isListening,
  noiseThreshold,
  currentTargetNoteName,
  onSelectSong,
  onPlay,
  onRestart,
  onKeyClick,
  onThresholdChange,
  onOpenSoundMixer,
}) => {
  return (
    <div className="flex flex-col gap-2 sm:gap-2.5">
      {/* 알록달록 동요 5곡 선택 카드 슬라이더 */}
      <SongSelectionCardList
        songs={SONG_CATALOG}
        selectedSongId={rhythmGame.song.id}
        isPlaying={rhythmGame.gameState.isPlaying}
        onSelectSong={onSelectSong}
      />

      {/* 상단 컨트롤러 및 진행바 & MR 반주 토글 & 곡 선택 & 속도 조절 */}
      <SongPlayHeader
        song={rhythmGame.song}
        gameState={rhythmGame.gameState}
        isMrMuted={rhythmGame.isMrMuted}
        speed={rhythmGame.speed}
        onPlay={onPlay}
        onResume={rhythmGame.resumeGame}
        onPause={rhythmGame.pauseGame}
        onRestart={onRestart}
        onSelectSong={onSelectSong}
        onToggleMr={rhythmGame.toggleMr}
        onTogglePlayMode={rhythmGame.togglePlayMode}
        onToggleSpeed={rhythmGame.toggleSpeed}
        onOpenSoundMixer={onOpenSoundMixer}
      />

      {/* 가로 스크롤 오선보 캔버스 */}
      <SheetMusicCanvas
        song={rhythmGame.song}
        getCurrentTime={rhythmGame.getCurrentTimeSec}
        isPlaying={rhythmGame.gameState.isPlaying}
        activeTargetNote={rhythmGame.gameState.activeTargetNote}
        lastHitEvent={rhythmGame.lastHitEvent}
        isWaitingForInput={rhythmGame.gameState.isWaitingForInput}
        speed={rhythmGame.speed}
        countdown={rhythmGame.gameState.countdown}
      />

      {/* 하단 3D 건반 및 실시간 통합 모니터 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-2.5 items-stretch">
        <div className="md:col-span-8 flex flex-col">
          <VirtualPiano
            activeNote={confirmedNote || debugInfo.note}
            targetNoteFullName={currentTargetNoteName}
            onKeyClick={onKeyClick}
          />
        </div>
        <div className="md:col-span-4 flex flex-col">
          <SongModeSoundMonitor
            note={confirmedNote || debugInfo.note}
            rawFrequency={debugInfo.frequency}
            isListening={isListening}
            volumeDb={debugInfo.volumeDb}
            isGateOpen={debugInfo.isGateOpen}
            noiseThreshold={noiseThreshold}
            onThresholdChange={onThresholdChange}
          />
        </div>
      </div>
    </div>
  );
});
