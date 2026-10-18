import React from 'react';
import { Play, Pause, RotateCcw, Flame, Trophy, Volume2, VolumeX, Sparkles, Zap, SlidersHorizontal } from 'lucide-react';
import { SongMetadata, RhythmGameState } from '../types/sheet';
import { beatToSeconds, SONG_CATALOG } from '../utils/songData';

interface SongPlayHeaderProps {
  song: SongMetadata;
  gameState: RhythmGameState;
  songList?: SongMetadata[];
  isMrMuted?: boolean;
  onPlay: () => void;
  onResume?: () => void;
  onPause: () => void;
  onRestart: () => void;
  onSelectSong?: (song: SongMetadata) => void;
  onToggleMr?: () => void;
  onTogglePlayMode?: () => void;
  onOpenSoundMixer?: () => void;
}

export const SongPlayHeader: React.FC<SongPlayHeaderProps> = React.memo(({
  song,
  gameState,
  songList = SONG_CATALOG,
  isMrMuted = false,
  onPlay,
  onResume,
  onPause,
  onRestart,
  onSelectSong,
  onToggleMr,
  onTogglePlayMode,
  onOpenSoundMixer,
}) => {
  const totalDurationSec = beatToSeconds(song.totalMeasures * song.beatsPerMeasure, song.bpm);
  const progressRatio = Math.max(
    0,
    Math.min(1, Math.max(0, gameState.currentTimeSec) / totalDurationSec)
  );

  const activeNote = gameState.activeTargetNote;
  const isPractice = gameState.playMode === 'practice';

  return (
    <div className="w-full bg-white/[0.12] backdrop-blur-2xl border border-white/35 rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
      {/* 상단: 곡 정보 & 5곡 탭 & 컨트롤 버튼 & 점수 (단일 고밀도 행) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* 마스코트 & 곡 제목 & 5곡 빠른 전환 칩 & 모드 토글 */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <img
              src="/images/characters/mascot_guide.png"
              alt="피아노 지휘자 마스코트"
              className={`w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-md transition-transform ${
                gameState.combo > 1 ? 'animate-bounce scale-110' : ''
              }`}
            />
            {gameState.combo > 2 && (
              <span className="absolute -top-1.5 -right-1 text-[8px] font-black bg-amber-400 text-slate-950 px-1 py-0.1 rounded-full shadow-md animate-pulse">
                최고!
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] whitespace-nowrap">
                {song.title}
              </h3>

              {/* 곡 전환 탭 버튼 (동요 5곡 전곡 빠른 원터치 전환) */}
              {onSelectSong && (
                <div className="flex items-center gap-1 bg-black/25 backdrop-blur-md p-0.5 rounded-xl border border-white/20 shadow-inner overflow-x-auto max-w-full scrollbar-none">
                  {songList.map((s) => {
                    const isSelected = song.id === s.id;
                    const cleanTitle = s.title.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').replace('동요', '').trim();
                    const label = `${s.icon || '🎵'} ${cleanTitle}`;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => onSelectSong(s)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-black transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0 ${
                          isSelected
                            ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Phase 6: Wait Mode(연습: 기다려주기) vs Play(실전 리듬) 토글 */}
              {onTogglePlayMode && (
                <button
                  type="button"
                  onClick={onTogglePlayMode}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-black transition active:scale-95 cursor-pointer shadow-sm ${
                    isPractice
                      ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white border border-amber-200/90 shadow-[0_2px_10px_rgba(245,158,11,0.4)]'
                      : 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white border border-emerald-200/90 shadow-[0_2px_10px_rgba(16,185,129,0.4)]'
                  }`}
                  title={isPractice ? '연습 모드: 칠 때까지 기다려줌 (클릭 시 실전 리듬 모드로 전환)' : '실전 모드: 멈춤 없이 리듬 진행 (클릭 시 연습 모드로 전환)'}
                >
                  {isPractice ? (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-100 animate-spin" />
                      <span>연습(대기)</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3 text-emerald-100" />
                      <span>실전(리듬)</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="text-[10px] text-white/80 font-bold leading-tight truncate mt-0.5 max-w-[280px] sm:max-w-md drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {gameState.isPlaying
                ? gameState.currentTimeSec < 0
                  ? `준비 중... (${Math.ceil(Math.abs(gameState.currentTimeSec))}초)`
                  : gameState.isWaitingForInput && activeNote
                  ? `🎹 [${activeNote.solfege}] 음을 칠 때까지 기다리고 있어요!`
                  : isPractice
                  ? '연습 중! 음표가 올 때까지 기다립니다'
                  : '실전 연주 중! 타이밍에 맞춰 피아노를 누르세요'
                : gameState.isPaused
                ? '일시정지됨'
                : '시작 버튼을 눌러 연주를 시작하세요'}
            </p>
          </div>
        </div>

        {/* 현재 타깃 가이드 뱃지 */}
        {activeNote && (
          <div className="hidden md:flex items-center gap-1.5 bg-black/25 backdrop-blur-md border border-white/20 px-2 py-0.5 rounded-xl">
            <span className="text-[10px] text-white/80 font-bold">타깃:</span>
            <div
              className="px-2 py-0.5 rounded-lg text-white font-black text-xs shadow-sm flex items-center gap-1"
              style={{ backgroundColor: activeNote.color }}
            >
              <span>{activeNote.solfege}</span>
              <span className="text-[9px] bg-black/20 px-1 rounded">{activeNote.finger}번</span>
            </div>
          </div>
        )}

        {/* 컨트롤러 & 점수 & MR 반주 토글 */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 점수 & 콤보 */}
          <div className="flex items-center gap-1.5 bg-black/25 backdrop-blur-md px-2 py-0.5 rounded-xl border border-white/20">
            <div className="flex items-center gap-1 text-amber-300 font-bold text-xs drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              <Trophy className="w-3 h-3" />
              <span>{gameState.score}</span>
            </div>
            {gameState.combo > 1 && (
              <div className="flex items-center gap-0.5 text-orange-400 font-extrabold text-xs animate-pulse">
                <Flame className="w-3 h-3" />
                <span>{gameState.combo}연타!</span>
              </div>
            )}
          </div>

          {/* MR 반주 토글 버튼 */}
          {onToggleMr && (
            <button
              type="button"
              onClick={onToggleMr}
              className={`p-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition active:scale-95 shadow-sm cursor-pointer backdrop-blur-md ${
                !isMrMuted
                  ? 'bg-sky-500/30 text-sky-200 border-sky-400/50 hover:bg-sky-500/40'
                  : 'bg-black/25 text-white/70 border-white/20 hover:text-white'
              }`}
              title={!isMrMuted ? 'MR 배경 반주 켜짐 (클릭 시 끄기)' : 'MR 배경 반주 꺼짐 (클릭 시 켜기)'}
            >
              {!isMrMuted ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-sky-300" />
                  <span className="hidden lg:inline text-[10px]">MR ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-white/50" />
                  <span className="hidden lg:inline text-[10px]">MR OFF</span>
                </>
              )}
            </button>
          )}

          {/* 사운드 볼륨 믹서 버튼 */}
          {onOpenSoundMixer && (
            <button
              type="button"
              onClick={onOpenSoundMixer}
              className="p-1.5 rounded-xl border border-white/20 bg-black/25 hover:bg-white/10 text-white/80 hover:text-white transition active:scale-95 shadow-sm cursor-pointer backdrop-blur-md flex items-center gap-1"
              title="사운드 볼륨 조절"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden xl:inline text-[10px] font-bold">볼륨</span>
            </button>
          )}

          {/* 조작 버튼 */}
          <div className="flex items-center gap-1">
            {!gameState.isPlaying ? (
              <button
                onClick={gameState.isPaused ? (onResume || onPlay) : onPlay}
                className="px-2.5 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{gameState.isPaused ? '이어하기' : '시작'}</span>
              </button>
            ) : (
              <button
                onClick={onPause}
                className="px-2.5 py-1 sm:py-1.5 rounded-xl bg-black/30 hover:bg-black/40 border border-white/25 text-white font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition cursor-pointer backdrop-blur-md"
              >
                <Pause className="w-3 h-3 fill-current" />
                <span>일시정지</span>
              </button>
            )}

            <button
              onClick={onRestart}
              className="p-1 sm:p-1.5 rounded-xl bg-black/25 hover:bg-black/40 border border-white/25 text-white transition active:scale-95 shadow-sm cursor-pointer backdrop-blur-md"
              title="처음부터 다시 연주"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 하단 진행 바 */}
      <div className="mt-1.5 w-full bg-black/30 backdrop-blur-md rounded-full h-1 sm:h-1.5 overflow-hidden border border-white/15">
        <div
          className="bg-gradient-to-r from-sky-500 via-indigo-500 to-pink-500 h-full rounded-full transition-all duration-150 ease-out"
          style={{ width: `${progressRatio * 100}%` }}
        />
      </div>
    </div>
  );
});
