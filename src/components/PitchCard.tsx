import React from 'react';
import { NoteInfo } from '../types/audio';
import { getCentsDeviation } from '../utils/audioMath';

interface PitchCardProps {
  note: NoteInfo | null;
  rawFrequency: number;
  isListening: boolean;
  volumeDb: number;
  isGateOpen: boolean;
}

/**
 * 실시간 감지된 피치 정보 시각화 카드
 * - 건반 입력 여부나 마이크 On/Off 상태와 무관하게 **완벽히 동일한 고정 높이(Strict Height Invariance)** 유지
 * - 화면 흔들림(Layout Shift) 원천 차단
 */
export const PitchCard: React.FC<PitchCardProps> = ({
  note,
  rawFrequency,
  isListening,
  volumeDb,
  isGateOpen,
}) => {
  // 센트 오차 계산
  const cents = note ? getCentsDeviation(rawFrequency, note.midi) : 0;
  const noteColor = note ? note.color : '#64748B';

  const isIdle = !isListening && !note;

  return (
    <div
      className="w-full mx-auto h-[160px] sm:h-[168px] rounded-3xl bg-white/[0.12] border border-white/35 transition-all duration-200 p-2 sm:p-2.5 flex flex-col justify-between items-center shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-2xl relative overflow-hidden select-none shrink-0"
      style={{
        borderColor: note ? noteColor : isIdle ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.35)',
        boxShadow: note ? `0 0 24px ${noteColor}35` : 'none',
      }}
    >
      {/* 배경 은은한 무지개 글로우 */}
      {note && (
        <div
          className="absolute -top-16 -left-16 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-300"
          style={{ backgroundColor: noteColor }}
        />
      )}

      {/* 1. 상단: 상태 뱃지 (높이 16px) */}
      <div className="flex items-center gap-1.5 z-10 h-4">
        {isIdle ? (
          <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5 leading-none">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            마이크 대기 (건반/키보드 또는 마이크 켜기)
          </span>
        ) : (
          <>
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                isGateOpen ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
              }`}
            />
            <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 leading-none">
              {isGateOpen ? (note ? '음표 감지됨 (Locked)' : '소리 입력 중...') : '소음 게이트 닫힘'}
            </span>
          </>
        )}
      </div>

      {/* 2. 중앙: 대형 음이름 표시부 또는 대기 안내 (높이 60px) */}
      <div className="w-full h-[60px] flex flex-col items-center justify-center z-10">
        {note ? (
          <>
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-md transition-transform scale-105"
                style={{ color: noteColor }}
              >
                {note.fullName}
              </span>
              <span className="text-xl sm:text-2xl font-bold text-white">
                ({note.koreanName})
              </span>
            </div>
            {note.fingerNumber && (
              <div className="mt-0.5 px-2 py-0 rounded-full bg-slate-800/80 border border-slate-700 text-[9px] font-semibold text-amber-300 flex items-center gap-1 shadow-inner">
                <span>✋ 오른손 {note.fingerNumber}번 손가락</span>
              </div>
            )}
          </>
        ) : isIdle ? (
          <div className="flex flex-col items-center text-center">
            <img
              src="/images/characters/mascot_guide.png"
              alt="피아노 친구"
              className="w-7 h-7 object-contain mb-0.5 drop-shadow-md animate-bounce"
              style={{ animationDuration: '3.5s' }}
            />
            <span className="text-[11px] font-bold text-amber-300 leading-tight">건반 또는 마이크 입력 대기</span>
            <span className="text-[9px] text-slate-400 leading-tight">
              피아노 건반을 치거나 키보드 [A~K]를 눌러보세요
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-slate-500">
            <span className="text-2xl font-bold tracking-widest leading-none">---</span>
            <span className="text-[10px] mt-0.5 text-slate-500">피아노 건반을 쳐보세요</span>
          </div>
        )}
      </div>

      {/* 3. 피치 센트 편차 튜너 바 (높이 18px) */}
      <div className="w-full max-w-xs z-10 h-[18px] flex flex-col justify-center">
        {note ? (
          <>
            <div className="flex justify-between text-[8px] text-slate-400 font-mono mb-0.5 leading-none">
              <span>-50c (낮음)</span>
              <span className="font-bold text-slate-200">
                {cents > 0 ? `+${cents}c` : `${cents}c`}
              </span>
              <span>+50c (높음)</span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700">
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/40 z-10" />
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${Math.max(5, Math.min(95, 50 + cents))}%`,
                  backgroundColor: Math.abs(cents) < 15 ? '#10B981' : noteColor,
                }}
              />
            </div>
          </>
        ) : (
          <div className="w-full h-1 bg-slate-800/40 rounded-full border border-slate-700/50 relative">
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-600/40" />
          </div>
        )}
      </div>

      {/* 4. 하단 세부 수치 요약 (높이 38px, 잘림 현상 원천 해결) */}
      <div className="grid grid-cols-3 gap-1.5 w-full pt-1.5 border-t border-white/20 text-center z-10 h-[38px] shrink-0">
        <div className="bg-black/25 backdrop-blur-md rounded-xl py-0.5 px-0.5 flex flex-col justify-center border border-white/15">
          <div className="text-[8px] text-white/80 uppercase font-bold leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">측정 주파수</div>
          <div className="text-[10px] sm:text-[11px] font-bold font-mono text-white mt-0.5 leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {rawFrequency > 0 ? `${rawFrequency.toFixed(1)}Hz` : '0 Hz'}
          </div>
        </div>
        <div className="bg-black/25 backdrop-blur-md rounded-xl py-0.5 px-0.5 flex flex-col justify-center border border-white/15">
          <div className="text-[8px] text-white/80 uppercase font-bold leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">기준 주파수</div>
          <div className="text-[10px] sm:text-[11px] font-bold font-mono text-white mt-0.5 leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {note ? `${note.frequency.toFixed(1)}Hz` : '-'}
          </div>
        </div>
        <div className="bg-black/25 backdrop-blur-md rounded-xl py-0.5 px-0.5 flex flex-col justify-center border border-white/15">
          <div className="text-[8px] text-white/80 uppercase font-bold leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">입력 볼륨</div>
          <div className={`text-[10px] sm:text-[11px] font-bold font-mono mt-0.5 leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${volumeDb > -30 ? 'text-emerald-300' : 'text-white'}`}>
            {volumeDb} dB
          </div>
        </div>
      </div>
    </div>
  );
};
