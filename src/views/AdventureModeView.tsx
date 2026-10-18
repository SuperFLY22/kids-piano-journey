/**
 * Kids Piano Journey - 10단계 모험 커리큘럼 뷰
 * 모험 지도 뷰 및 스테이지별 오선보 연주 뷰 관리
 */

import React from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { CurriculumMap } from '../components/CurriculumMap';
import { SheetMusicCanvas } from '../components/SheetMusicCanvas';
import { VirtualPiano } from '../components/VirtualPiano';
import { SongModeSoundMonitor } from '../components/SongModeSoundMonitor';
import { CurriculumLevel, LevelProgress } from '../types/curriculum';
import { NoteInfo, DetectedPitch } from '../types/audio';
import { useRhythmGame } from '../hooks/useRhythmGame';

interface AdventureModeViewProps {
  isCurriculumPlaying: boolean;
  curriculumProgress: LevelProgress;
  activeCurriculumLevel: CurriculumLevel | null;
  rhythmGame: ReturnType<typeof useRhythmGame>;
  confirmedNote: NoteInfo | null;
  debugInfo: DetectedPitch;
  isListening: boolean;
  noiseThreshold: number;
  currentTargetNoteName: string | null;
  onSelectLevel: (level: CurriculumLevel) => void;
  onResetProgress: () => void;
  onReturnToMap: () => void;
  onKeyClick: (fullName: string | null) => void;
  onThresholdChange: (val: number) => void;
  onRestartStage: () => void;
  onOpenStickerBook?: () => void;
}

export const AdventureModeView: React.FC<AdventureModeViewProps> = React.memo(({
  isCurriculumPlaying,
  curriculumProgress,
  activeCurriculumLevel,
  rhythmGame,
  confirmedNote,
  debugInfo,
  isListening,
  noiseThreshold,
  currentTargetNoteName,
  onSelectLevel,
  onResetProgress,
  onReturnToMap,
  onKeyClick,
  onThresholdChange,
  onRestartStage,
  onOpenStickerBook,
}) => {
  if (!isCurriculumPlaying) {
    return (
      <CurriculumMap
        progress={curriculumProgress}
        onSelectLevel={onSelectLevel}
        onResetProgress={onResetProgress}
        onOpenStickerBook={onOpenStickerBook}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:gap-2.5">
      {/* 상단 스테이지 정보 & 지도로 돌아가기 바 */}
      <div className="w-full flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-900/80 border border-amber-400/40 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReturnToMap}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>모험 지도로</span>
          </button>
          <div className="flex items-center gap-1.5">
            <span className="text-base sm:text-lg">{activeCurriculumLevel?.songData.icon || '🌟'}</span>
            <span className="text-xs sm:text-sm font-black text-amber-300">
              STAGE {activeCurriculumLevel?.level}: {activeCurriculumLevel?.title}
            </span>
            <span className="hidden md:inline text-xs text-slate-300">
              • {activeCurriculumLevel?.subtitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 연주 속도 조절 토글 */}
          <button
            type="button"
            onClick={rhythmGame.toggleSpeed}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black transition cursor-pointer active:scale-95 shadow-sm ${
              rhythmGame.speed === 0.75
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-amber-100 border border-amber-300/80 shadow-amber-950/30'
                : 'bg-gradient-to-r from-sky-600 to-indigo-600 text-sky-100 border border-sky-300/80 shadow-sky-950/30'
            }`}
            title={rhythmGame.speed === 0.75 ? '거북이 모드(0.75배속): 클릭 시 토끼 1.0배속' : '토끼 모드(1.0배속): 클릭 시 거북이 0.75배속'}
          >
            <span>{rhythmGame.speed === 0.75 ? '🐢 0.75x' : '🐰 1.0x'}</span>
          </button>
          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30">
            진행: {rhythmGame.notes.filter((n) => n.hit).length} / {rhythmGame.notes.length} 음표
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-teal-400/20 text-teal-300 border border-teal-400/30">
            연습(Wait) 모드
          </span>
          <button
            type="button"
            onClick={onRestartStage}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="처음부터 다시 연주"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 팁 안내 띠 배너 */}
      {activeCurriculumLevel && (
        <div className="w-full px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs font-medium flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-bold text-amber-300">💡 학습 팁:</span>
            <span className="truncate">{activeCurriculumLevel.handTip}</span>
          </div>
          <span className="hidden sm:inline-block text-[11px] text-amber-300/80 shrink-0 ml-2">
            음표가 멈추면 건반을 톡 눌러주세요!
          </span>
        </div>
      )}

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
