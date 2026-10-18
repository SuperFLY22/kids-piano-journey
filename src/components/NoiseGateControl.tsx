import React from 'react';
import { Sliders, Volume2, ShieldCheck, ShieldAlert } from 'lucide-react';

interface NoiseGateControlProps {
  volumeDb: number;
  noiseThreshold: number;
  isGateOpen: boolean;
  onThresholdChange: (threshold: number) => void;
}

export const NoiseGateControl: React.FC<NoiseGateControlProps> = ({
  volumeDb,
  noiseThreshold,
  isGateOpen,
  onThresholdChange,
}) => {
  // -80dB ~ 0dB 기준 퍼센트 계산
  const volumePercent = Math.max(0, Math.min(100, ((volumeDb + 80) / 80) * 100));
  const thresholdPercent = Math.max(0, Math.min(100, ((noiseThreshold + 80) / 80) * 100));

  return (
    <section 
      aria-label="노이즈 게이트 감도 조절"
      className="w-full mx-auto bg-white/[0.12] rounded-2xl border border-white/35 p-2 sm:p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-2xl transition-all"
    >
      <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-white/20">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              노이즈 게이트 감도
            </span>
            <span className="hidden sm:inline-block text-[11px] text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ml-1.5">
              (배경 소음 차단)
            </span>
          </div>
        </div>

        {/* 실시간 게이트 상태 배지 */}
        <div className="flex items-center gap-1.5">
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-colors ${
              isGateOpen
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 shadow-sm shadow-emerald-900/30'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/50'
            }`}
          >
            {isGateOpen ? (
              <>
                <ShieldCheck className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>열림</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3 h-3 text-slate-500" />
                <span>닫힘</span>
              </>
            )}
          </div>
          <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
            {noiseThreshold}dB
          </span>
        </div>
      </div>

      {/* 볼륨 미터 바 & 게이트 기준선 시각화 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-white/80 font-mono font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-cyan-300" />
            현재: <strong className="text-white">{volumeDb} dB</strong>
          </span>
          <span>임계값: <strong className="text-amber-300">{noiseThreshold} dB</strong></span>
        </div>

        {/* 레벨 미터 게이지 */}
        <div className="w-full h-2.5 bg-black/30 backdrop-blur-md rounded-md overflow-hidden relative border border-white/20">
          {/* 노이즈 게이트 임계선 */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-amber-400 z-20 shadow-md transition-all pointer-events-none"
            style={{ left: `calc(${thresholdPercent}% - 2px)` }}
            title={`게이트 임계값: ${noiseThreshold}dB`}
          />
          {/* 실시간 입력 볼륨 게이지 */}
          <div
            className={`h-full transition-all duration-75 ${
              isGateOpen
                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400'
                : 'bg-white/20'
            }`}
            style={{ width: `${volumePercent}%` }}
          />
        </div>

        {/* 조절 슬라이더 */}
        <div className="pt-0.5">
          <input
            id="noise-gate-slider"
            type="range"
            min="-70"
            max="-20"
            step="1"
            value={noiseThreshold}
            onChange={(e) => onThresholdChange(Number(e.target.value))}
            className="w-full h-1.5 bg-black/30 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:accent-amber-300 transition-all border border-white/10"
            aria-label="노이즈 게이트 감도 임계값 슬라이더"
          />
          <div className="flex justify-between text-[9px] text-white/70 font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            <span>-70dB (민감)</span>
            <span className="text-amber-300 font-bold">← 감도 슬라이더 →</span>
            <span>-20dB (둔감)</span>
          </div>
        </div>
      </div>
    </section>
  );
};
