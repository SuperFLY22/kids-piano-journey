import React from 'react';
import { NoteInfo } from '../types/audio';
import { midiToFrequency } from '../utils/audioMath';

interface PianoRangeTesterProps {
  currentNote: NoteInfo | null;
}

export const PianoRangeTester: React.FC<PianoRangeTesterProps> = ({ currentNote }) => {
  // C4 ~ C5 (1옥타브 8음) 피아노 인식 검증 목록
  const targetNotes = [
    { name: 'C4', label: '도', midi: 60, isCore: true, color: '#EF4444' },
    { name: 'D4', label: '레', midi: 62, isCore: true, color: '#F97316' },
    { name: 'E4', label: '미', midi: 64, isCore: true, color: '#EAB308' },
    { name: 'F4', label: '파', midi: 65, isCore: true, color: '#22C55E' },
    { name: 'G4', label: '솔', midi: 67, isCore: true, color: '#06B6D4' },
    { name: 'A4', label: '라', midi: 69, isCore: true, color: '#6366F1' },
    { name: 'B4', label: '시', midi: 71, isCore: true, color: '#A855F7' },
    { name: 'C5', label: '높은도', midi: 72, isCore: true, color: '#EF4444' },
  ];

  return (
    <div className="w-full mx-auto bg-white/[0.12] backdrop-blur-2xl rounded-3xl border border-white/35 p-3 sm:p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[11px] sm:text-xs font-bold text-white uppercase tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          🎹 1옥타브(C4~C5) 피아노 인식 실시간 검증
        </h4>
        <span className="text-[10px] sm:text-[11px] text-amber-300 font-bold bg-amber-950/70 px-2 py-0.5 rounded-full border border-amber-500/50 shadow-inner">
          실시간 매칭
        </span>
      </div>

      <div className="grid grid-cols-8 gap-1 sm:gap-1.5">
        {targetNotes.map((item) => {
          const isMatched = currentNote?.fullName === item.name;
          const freq = midiToFrequency(item.midi).toFixed(1);

          return (
            <div
              key={item.name}
              className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl border transition-all duration-150 backdrop-blur-md ${
                isMatched
                  ? 'border-white bg-white/30 scale-105 shadow-md'
                  : item.isCore
                  ? 'border-white/20 bg-black/25'
                  : 'border-white/10 bg-black/20 opacity-80'
              }`}
              style={{
                borderColor: isMatched ? item.color : undefined,
                boxShadow: isMatched ? `0 0 14px ${item.color}80` : undefined,
              }}
            >
              <div
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full mb-1 transition-all"
                style={{
                  backgroundColor: isMatched ? item.color : '#475569',
                }}
              />
              <span
                className={`text-[11px] sm:text-xs md:text-sm font-black ${
                  isMatched ? 'text-white' : 'text-slate-300'
                }`}
              >
                {item.name}
              </span>
              <span className="text-[9px] sm:text-[10px] md:text-[11px] font-semibold text-slate-400 truncate max-w-full">
                {item.label}
              </span>
              <span className="text-[8px] sm:text-[9px] font-mono text-slate-500 mt-0.5 whitespace-nowrap">
                {freq}Hz
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
