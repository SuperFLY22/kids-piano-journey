import React from 'react';
import { Volume2, Sliders, Keyboard, Activity } from 'lucide-react';
import { DetectedPitch } from '../types/audio';

interface PitchMonitorProps {
  debugInfo: DetectedPitch;
  noiseThreshold: number;
  onThresholdChange: (value: number) => void;
  onSimulateNote: (fullName: string | null) => void;
}

export const PitchMonitor: React.FC<PitchMonitorProps> = ({
  debugInfo,
  noiseThreshold,
  onThresholdChange,
  onSimulateNote,
}) => {
  const { volumeDb, frequency, isGateOpen, clarity } = debugInfo;

  // 볼륨 미터 퍼센티지 변환 (-80dB ~ 0dB)
  const volumePercent = Math.max(0, Math.min(100, ((volumeDb + 80) / 80) * 100));
  const thresholdPercent = Math.max(0, Math.min(100, ((noiseThreshold + 80) / 80) * 100));

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-900/60 rounded-2xl border border-slate-800 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>오디오 엔지니어링 모니터 (Debug Overlay)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
            {frequency > 0 ? `${frequency.toFixed(1)}Hz` : '0Hz'} ({Math.round(clarity * 100)}%)
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            Min-Tau YIN 48kHz
          </span>
        </div>
      </div>

      {/* 1. 실시간 볼륨 레벨 & 노이즈 게이트 */}
      <div className="space-y-2 mb-5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            마이크 입력 볼륨 (RMS / dBFS)
          </span>
          <span className="font-mono text-slate-200 font-semibold">
            {volumeDb} dB {isGateOpen ? '🟢 [GATE OPEN]' : '⚪ [GATE CLOSED]'}
          </span>
        </div>

        {/* 볼륨 미터 바 */}
        <div className="w-full h-4 bg-slate-950 rounded-lg overflow-hidden relative border border-slate-800">
          {/* 노이즈 게이트 임계선 */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 shadow-sm"
            style={{ left: `${thresholdPercent}%` }}
            title={`임계값: ${noiseThreshold}dB`}
          />
          {/* 볼륨 게이지 */}
          <div
            className={`h-full transition-all duration-75 ${
              isGateOpen ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-slate-700'
            }`}
            style={{ width: `${volumePercent}%` }}
          />
        </div>
      </div>

      {/* 2. 노이즈 게이트 임계값 조절 슬라이더 */}
      <div className="space-y-1.5 mb-5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            노이즈 게이트 감도 (Threshold)
          </span>
          <span className="font-mono text-amber-400 font-bold">{noiseThreshold} dB</span>
        </div>
        <input
          type="range"
          min="-70"
          max="-20"
          step="1"
          value={noiseThreshold}
          onChange={(e) => onThresholdChange(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
        />
        <p className="text-[11px] text-slate-400">
          * 피아노를 치지 않을 때 잡음이 감지되면 슬라이더를 오른쪽(더 큰 소리만 인식)으로 옮기세요.
        </p>
      </div>

      {/* 3. 키보드 시뮬레이션 모드 (Mac Keyboard Fallback) */}
      <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between text-xs mb-2.5">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Keyboard className="w-3.5 h-3.5 text-purple-400" />
            키보드 시뮬레이터 (빠른 검증용 Fallback)
          </span>
          <span className="text-[11px] text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
            Mac 키: A S D F G H J K 또는 1~8
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {[
            { key: 'A / 1', note: 'C4', label: '도', color: 'hover:border-red-500' },
            { key: 'S / 2', note: 'D4', label: '레', color: 'hover:border-orange-500' },
            { key: 'D / 3', note: 'E4', label: '미', color: 'hover:border-yellow-500' },
            { key: 'F / 4', note: 'F4', label: '파', color: 'hover:border-green-500' },
            { key: 'G / 5', note: 'G4', label: '솔', color: 'hover:border-cyan-500' },
            { key: 'H / 6', note: 'A4', label: '라', color: 'hover:border-indigo-500' },
            { key: 'J / 7', note: 'B4', label: '시', color: 'hover:border-purple-500' },
            { key: 'K / 8', note: 'C5', label: '높은도', color: 'hover:border-rose-500' },
          ].map((item) => (
            <button
              key={item.note}
              type="button"
              onMouseDown={() => onSimulateNote(item.note)}
              onMouseUp={() => onSimulateNote(null)}
              onTouchStart={() => onSimulateNote(item.note)}
              onTouchEnd={() => onSimulateNote(null)}
              className={`flex flex-col items-center justify-center py-2 px-1 bg-slate-800 active:bg-slate-700 rounded-lg border border-slate-700 ${item.color} transition-all active:scale-95`}
            >
              <span className="text-xs font-bold text-slate-100">{item.note}</span>
              <span className="text-[10px] text-slate-400">{item.label}</span>
              <span className="text-[9px] font-mono text-purple-400 mt-0.5">[{item.key}]</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
