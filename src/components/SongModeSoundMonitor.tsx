import React from 'react';
import { NoteInfo } from '../types/audio';
import { getCentsDeviation } from '../utils/audioMath';
import { Volume2, ShieldCheck, ShieldAlert, Mic } from 'lucide-react';

interface SongModeSoundMonitorProps {
  note: NoteInfo | null;
  rawFrequency: number;
  isListening: boolean;
  volumeDb: number;
  isGateOpen: boolean;
  noiseThreshold: number;
  onThresholdChange: (threshold: number) => void;
}

/**
 * [Phase 7 & Tablet Pad Ratio Standard] 연주 모드 전용 통합 사운드 모니터
 * - VirtualPiano 건반과 1:1로 완벽히 동일한 높이(h-full)를 유지하여 태블릿 가로 화면에서 하단 잘림을 원천 차단
 * - PitchCard(실시간 음표/센트 편차)와 NoiseGateControl(볼륨 미터/게이트 임계치)을 단일 크리스탈 글래스 쉘로 통합
 */
export const SongModeSoundMonitor: React.FC<SongModeSoundMonitorProps> = React.memo(({
  note,
  rawFrequency,
  isListening,
  volumeDb,
  isGateOpen,
  noiseThreshold,
  onThresholdChange,
}) => {
  const cents = note ? getCentsDeviation(rawFrequency, note.midi) : 0;
  const noteColor = note ? note.color : '#38BDF8';
  const isIdle = !isListening && !note;

  // 볼륨 및 임계치 퍼센트 계산 (-80dB ~ 0dB)
  const volumePercent = Math.max(0, Math.min(100, ((volumeDb + 80) / 80) * 100));
  const thresholdPercent = Math.max(0, Math.min(100, ((noiseThreshold + 80) / 80) * 100));

  return (
    <div
      className="w-full h-full flex flex-col justify-between bg-white/[0.12] backdrop-blur-2xl border border-white/35 rounded-3xl p-2.5 sm:p-3 shadow-[0_8px_32px_rgba(0,0,0,0.18)] relative overflow-hidden select-none transition-all"
      style={{
        borderColor: note ? `${noteColor}80` : 'rgba(255,255,255,0.30)',
        boxShadow: note ? `0 0 24px ${noteColor}30` : undefined,
      }}
    >
      {/* 배경 은은한 무지개 글로우 */}
      {note && (
        <div
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-25 pointer-events-none transition-all duration-300"
          style={{ backgroundColor: noteColor }}
        />
      )}

      {/* 1. 상단: 상태 헤더 및 실시간 음표 표시부 */}
      <div className="w-full flex items-center justify-between gap-2 border-b border-white/15 pb-1.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              !isListening
                ? 'bg-slate-500'
                : isGateOpen
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-amber-400'
            }`}
          />
          <span className="text-[11px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            실시간 소리 모니터
          </span>
        </div>

        {/* 게이트 상태 뱃지 */}
        <div className="flex items-center gap-1">
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
              isGateOpen
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                : 'bg-black/30 text-white/50 border-white/10'
            }`}
          >
            {isGateOpen ? (
              <>
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                <span>열림</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-2.5 h-2.5 text-slate-400" />
                <span>닫힘</span>
              </>
            )}
          </div>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/30 text-amber-300 border border-white/10">
            {noiseThreshold}dB
          </span>
        </div>
      </div>

      {/* 2. 중앙: 감지된 음표 원형/카드 배지 & 센트 튜너 바 */}
      <div className="flex items-center justify-between gap-2 my-1 px-1">
        {note ? (
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex flex-col items-center justify-center font-black text-white shadow-lg transition-transform scale-105 shrink-0"
              style={{
                backgroundColor: noteColor,
                boxShadow: `0 4px 14px ${noteColor}60`,
              }}
            >
              <span className="text-base sm:text-lg leading-none">{note.koreanName}</span>
              <span className="text-[9px] font-mono opacity-90 leading-tight">{note.fullName}</span>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[11px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                <span>{note.koreanName} 감지됨!</span>
                {note.fingerNumber && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold">
                    ✋ {note.fingerNumber}번손
                  </span>
                )}
              </div>
              <p className="text-[10px] font-mono text-white/70">
                {rawFrequency.toFixed(1)}Hz · {cents > 0 ? `+${cents}c` : `${cents}c`}
              </p>
            </div>
          </div>
        ) : isIdle ? (
          <div className="flex items-center gap-2 text-white/70">
            <div className="w-9 h-9 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-center shrink-0">
              <Mic className="w-4 h-4 text-white/50 animate-pulse" />
            </div>
            <div className="leading-tight">
              <p className="text-[11px] font-bold text-amber-300">피아노 건반 대기 중</p>
              <p className="text-[9px] text-white/60">피아노를 치거나 마이크를 켜세요</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-white/60">
            <div className="w-9 h-9 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-mono font-bold">--</span>
            </div>
            <div className="leading-tight">
              <p className="text-[11px] font-bold text-white/80">소리 입력 감지 중</p>
              <p className="text-[9px] text-white/60">{volumeDb} dBFS</p>
            </div>
          </div>
        )}

        {/* 우측 콤팩트 센트 바 */}
        <div className="w-20 sm:w-24 flex flex-col justify-center">
          <div className="flex justify-between text-[8px] text-white/60 font-mono mb-0.5 leading-none">
            <span>-50</span>
            <span className="font-bold text-white">{cents !== 0 ? `${cents}c` : '0c'}</span>
            <span>+50</span>
          </div>
          <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden relative border border-white/15">
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/60 z-10" />
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${Math.max(5, Math.min(95, 50 + cents))}%`,
                backgroundColor: Math.abs(cents) < 15 ? '#10B981' : noteColor,
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. 하단: 슬림 볼륨 미터 바 & 노이즈 게이트 슬라이더 */}
      <div className="w-full pt-1.5 border-t border-white/15 space-y-1">
        <div className="flex items-center justify-between text-[10px] text-white/80 font-mono font-bold">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-cyan-300" />
            <span>볼륨: {volumeDb}dB</span>
          </span>
          <span className="text-[9px] text-white/60">소음 차단 게이트</span>
        </div>

        {/* 볼륨 게이지 바 */}
        <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden relative border border-white/15">
          <div
            className="absolute top-0 bottom-0 w-1 bg-amber-400 z-20 shadow-md transition-all pointer-events-none"
            style={{ left: `calc(${thresholdPercent}% - 2px)` }}
          />
          <div
            className={`h-full transition-all duration-75 ${
              isGateOpen
                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400'
                : 'bg-white/20'
            }`}
            style={{ width: `${volumePercent}%` }}
          />
        </div>

        {/* 노이즈 게이트 슬라이더 */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <input
            type="range"
            min="-70"
            max="-20"
            step="1"
            value={noiseThreshold}
            onChange={(e) => onThresholdChange(Number(e.target.value))}
            className="w-full h-1 bg-black/40 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:accent-amber-300 transition-all border border-white/10"
            aria-label="노이즈 게이트 감도 조절 슬라이더"
          />
        </div>
      </div>
    </div>
  );
});
