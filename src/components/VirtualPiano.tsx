import React from 'react';
import { NoteInfo } from '../types/audio';
import { CORE_PIANO_KEYS } from '../utils/audioMath';

interface VirtualPianoProps {
  activeNote: NoteInfo | null;
  targetNoteFullName?: string | null;
  onKeyClick?: (fullName: string) => void;
  className?: string;
}

export const VirtualPiano: React.FC<VirtualPianoProps> = ({
  activeNote,
  targetNoteFullName,
  onKeyClick,
  className = '',
}) => {
  return (
    <div className={`w-full mx-auto flex flex-col items-center select-none ${className}`}>
      {/* 건반 상단 쉘 헤더 (어린이 피아노 스타일 라운드 목재/투명 글래스 쉘) */}
      <div className="w-full bg-white/[0.15] backdrop-blur-2xl px-3 sm:px-4 py-1.5 sm:py-2 rounded-t-2xl sm:rounded-t-3xl border-t border-x border-white/35 shadow-[0_8px_32px_rgba(0,0,0,0.18)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
          <span className="text-xs sm:text-sm font-black tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            피아노 1옥타브 건반 (도 ~ 높은 도)
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          <span className="hidden sm:inline">실제 피아노 타건 / 터치</span>
          <span className="px-1.5 py-0.5 rounded-lg bg-black/25 backdrop-blur-md text-cyan-300 font-mono text-[9px] sm:text-[10px] border border-white/20 shadow-inner">
            C4 ~ C5
          </span>
        </div>
      </div>

      {/* 8개 대형 건반 컨테이너 (초투명 글래스모피즘) */}
      <div className="w-full bg-white/[0.10] backdrop-blur-2xl p-1.5 sm:p-2.5 pb-2.5 sm:pb-3 rounded-b-2xl sm:rounded-b-3xl border-b border-x border-white/35 shadow-[0_8px_32px_rgba(0,0,0,0.18)] relative overflow-hidden">
        {/* 상단 붉은색 펠트 천 (피아노 해머 댐퍼 펠트 느낌 디테일) */}
        <div className="w-full h-1 sm:h-1.5 bg-gradient-to-r from-rose-800 via-rose-500 to-rose-800 rounded-full mb-1 sm:mb-1.5 shadow-inner opacity-90" />

        <div className="grid grid-cols-8 gap-1 sm:gap-1.5 h-26 sm:h-28 md:h-32">
          {CORE_PIANO_KEYS.map((k) => {
            const isActive = activeNote?.fullName === k.fullName;
            const isTarget = targetNoteFullName === k.fullName;

            return (
              <button
                key={k.fullName}
                type="button"
                onClick={() => onKeyClick?.(k.fullName)}
                className={`group relative flex flex-col justify-between items-center pb-2 sm:pb-2.5 pt-1 sm:pt-1.5 rounded-xl sm:rounded-2xl transition-all duration-100 outline-none cursor-pointer select-none active:scale-[0.98] ${
                  isActive
                    ? 'translate-y-2 shadow-lg brightness-105'
                    : isTarget
                    ? '-translate-y-1 shadow-[0_8px_0_0_#0284c7,0_12px_20px_rgba(2,132,199,0.4)] ring-2 ring-cyan-400'
                    : 'hover:-translate-y-0.5 shadow-[0_6px_0_0_#94a3b8,0_10px_14px_rgba(0,0,0,0.5)]'
                }`}
                style={{
                  background: isActive
                    ? `linear-gradient(to bottom, #ffffff 0%, #f1f5f9 60%, ${k.color}25 100%)`
                    : isTarget
                    ? `linear-gradient(to bottom, #ffffff 0%, #f0fdf4 70%, ${k.color}20 100%)`
                    : 'linear-gradient(to bottom, #ffffff 0%, #f8fafc 80%, #e2e8f0 100%)',
                  boxShadow: isActive
                    ? `0 2px 0 0 #64748b, 0 0 24px ${k.color}90`
                    : isTarget
                    ? `0 6px 0 0 ${k.color}, 0 0 18px ${k.color}60`
                    : undefined,
                  border: isActive
                    ? `2px solid ${k.color}`
                    : isTarget
                    ? `2px solid ${k.color}`
                    : '1px solid #cbd5e1',
                }}
                aria-label={`${k.koreanName} (${k.fullName}) 건반`}
              >
                {/* 타깃 건반 안내 포인터 */}
                {isTarget && !isActive && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center animate-bounce">
                    <span
                      className="text-[9px] font-black text-white px-1.5 py-0.2 rounded-full shadow-md whitespace-nowrap"
                      style={{ backgroundColor: k.color }}
                    >
                      눌러요!
                    </span>
                  </div>
                )}
                {/* 1. 상단 무지개 컬러 팁 (Boomwhackers 표준 컬러 바) */}
                <div
                  className="w-full h-2.5 sm:h-3 rounded-t-lg transition-all duration-150"
                  style={{
                    backgroundColor: k.color,
                    boxShadow: isActive ? `0 0 10px ${k.color}` : 'none',
                  }}
                />

                {/* 2. 중앙 손가락 번호 원형 배지 */}
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-black text-[11px] sm:text-xs md:text-sm transition-all duration-150 shadow-sm ${
                    isActive
                      ? 'scale-110 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                  }`}
                  style={{
                    backgroundColor: isActive ? k.color : undefined,
                    boxShadow: isActive ? `0 0 12px ${k.color}` : undefined,
                  }}
                >
                  {k.finger}
                </div>

                {/* 3. 하단 음이름 & 키보드 단축키 */}
                <div className="flex flex-col items-center">
                  <span
                    className="text-xs sm:text-sm md:text-lg font-black tracking-tight leading-none truncate max-w-full"
                    style={{ color: isActive ? k.color : '#0f172a' }}
                  >
                    {k.koreanName}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 font-mono leading-none mt-0.5">
                    {k.fullName}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-semibold text-slate-400 mt-0.5 px-0.5 sm:px-1 py-0.2 rounded bg-slate-200/80 leading-none whitespace-nowrap">
                    {k.shortcut}
                  </span>
                </div>

                {/* 4. 활성화 시 바닥 네온 반사광 */}
                {isActive && (
                  <div
                    className="absolute -bottom-1 left-2 right-2 h-1 rounded-full blur-[2px] animate-pulse"
                    style={{ backgroundColor: k.color }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
