import React from 'react';
import { RotateCcw, Music, Sparkles } from 'lucide-react';
import { CORE_PIANO_KEYS } from '../utils/audioMath';

interface TutorialCompletionModalProps {
  isOpen: boolean;
  onRestart: () => void;
  onFreePlay: () => void;
}

export const TutorialCompletionModal: React.FC<TutorialCompletionModalProps> = ({
  isOpen,
  onRestart,
  onFreePlay,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      {/* 배경 축하 폭죽 팡파르 (combo_firework.png) */}
      <img
        src="/images/effects/combo_firework.png"
        alt="축하 폭죽"
        className="absolute w-80 h-80 sm:w-96 sm:h-96 object-contain pointer-events-none opacity-80 animate-spin"
        style={{ animationDuration: '22s' }}
      />

      <div className="relative z-10 w-full max-w-lg bg-gradient-to-b from-slate-900/95 via-indigo-950/95 to-slate-950/95 border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-500/30 text-center flex flex-col items-center gap-4 backdrop-blur-2xl">
        {/* 상단 축하 엠블럼 (생성된 고해상도 대형 트로피 이미지) */}
        <div className="relative">
          <img
            src="/images/effects/trophy_reward.png"
            alt="축하 트로피"
            className="w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-[0_12px_30px_rgba(245,158,11,0.6)] animate-bounce"
          />
          <Sparkles className="w-8 h-8 text-amber-300 absolute -top-1 -right-1 animate-spin" />
        </div>

        {/* 텍스트 메시지 */}
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-950/80 px-3 py-1 rounded-full border border-amber-800">
            손가락 연습 미션 성공!
          </span>
          <h2 className="text-2xl font-black text-white mt-2">
            참 잘했어요! 🏆
          </h2>
          <p className="text-sm text-slate-300 mt-1 leading-relaxed">
            1번 엄지(도)부터 높은 도(C5)까지<br />
            1옥타브 피아노 건반과 손가락 자리를 완벽하게 익혔어요!
          </p>
        </div>

        {/* 5개 건반 뱃지 미니 리뷰 */}
        <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-2xl border border-slate-800">
          {CORE_PIANO_KEYS.map((k) => (
            <div
              key={k.fullName}
              className="flex flex-col items-center px-2 py-1 rounded-xl"
              style={{ backgroundColor: `${k.color}15`, border: `1px solid ${k.color}40` }}
            >
              <span className="text-[10px] font-bold text-slate-400">{k.finger}번</span>
              <span className="text-xs font-black" style={{ color: k.color }}>
                {k.koreanName}
              </span>
            </div>
          ))}
        </div>

        {/* 버튼 액션 그룹 */}
        <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
          <button
            type="button"
            onClick={onRestart}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all border border-slate-700 active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>다시 연습하기</span>
          </button>

          <button
            type="button"
            onClick={onFreePlay}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/30 active:scale-95 cursor-pointer"
          >
            <Music className="w-4 h-4 text-slate-950" />
            <span>자유 연주하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
