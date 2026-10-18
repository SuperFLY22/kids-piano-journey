/**
 * Kids Piano Journey - 연주 시작 3초 카운트다운 오버레이
 * 3, 2, 1, 출발! 🚀 시각 연출을 통해 아이들의 연주 준비 시간을 확보
 */

import React from 'react';
import { Sparkles, Rocket } from 'lucide-react';

interface CountdownOverlayProps {
  countdown: number | 'GO' | null;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = React.memo(({ countdown }) => {
  if (countdown === null) return null;

  const isGo = countdown === 'GO';

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none select-none">
      <div className="flex flex-col items-center justify-center transition-all duration-200">
        {isGo ? (
          <div className="flex items-center gap-2 px-6 py-3 rounded-3xl bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 border-2 border-white shadow-[0_0_35px_rgba(245,158,11,0.8)] animate-bounce text-white">
            <Rocket className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-200 animate-pulse" />
            <span className="text-3xl sm:text-4xl font-black tracking-wider drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
              출발! 🚀
            </span>
          </div>
        ) : (
          <div className="relative flex items-center justify-center">
            {/* 후광 펄스 링 */}
            <div className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/20 blur-xl animate-ping" />
            {/* 메인 숫자 원형 배지 */}
            <div
              key={countdown}
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center border-4 border-white shadow-[0_0_30px_rgba(255,255,255,0.7)] backdrop-blur-md transform transition-transform animate-scale-in ${
                countdown === 3
                  ? 'bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-cyan-400/60'
                  : countdown === 2
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-400/60'
                  : 'bg-gradient-to-br from-rose-400 to-pink-500 shadow-rose-400/60'
              }`}
            >
              <span className="text-4xl sm:text-5xl font-black text-white drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)]">
                {countdown}
              </span>
              <span className="text-[10px] font-bold text-white/90 -mt-1 flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 text-yellow-200" />
                준비!
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
