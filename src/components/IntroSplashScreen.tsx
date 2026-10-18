import React from 'react';
import { Play, Sliders, Sparkles } from 'lucide-react';

interface IntroSplashScreenProps {
  onStartPlay: () => void;
  onOpenCalibration: () => void;
}

export const IntroSplashScreen: React.FC<IntroSplashScreenProps> = ({
  onStartPlay,
  onOpenCalibration,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center select-none overflow-hidden bg-slate-950 animate-fadeIn">
      {/* 16:9 와이드 고화질 환상의 음악 섬 스플래시 배경 */}
      <img
        src="/images/splash/splash_bg.png"
        alt="스플래시 배경"
        className="absolute inset-0 w-full h-full object-cover object-center filter saturate-125 brightness-95 scale-105 animate-pulse"
        style={{ animationDuration: '8s' }}
      />
      {/* 부드러운 주변 비네팅 오버레이 (배경이 온전히 느껴지는 투명 비네팅) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

      {/* 중앙 메인 히어로 카드 (초투명 글래스) */}
      <div className="relative z-10 flex flex-col items-center text-center p-6 sm:p-8 max-w-xl mx-auto backdrop-blur-2xl bg-white/[0.15] border border-white/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
        {/* 1:1 고해상도 앱 아이콘 */}
        <div className="relative mb-3">
          <img
            src="/images/app_icon/app_icon.png"
            alt="키즈 피아노 저니 앱 아이콘"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl shadow-2xl shadow-cyan-500/40 object-contain ring-4 ring-white/30 animate-bounce"
            style={{ animationDuration: '3s' }}
          />
          <Sparkles className="w-8 h-8 text-amber-300 absolute -top-2 -right-2 animate-spin" style={{ animationDuration: '6s' }} />
        </div>

        {/* 타이틀 및 소개 */}
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] flex items-center gap-2">
          Kids Piano Journey
        </h1>
        <p className="text-xs sm:text-sm font-bold text-amber-300 mt-1 drop-shadow-md">
          ✨ 마이크로 듣는 신나는 디지털 피아노 모험!
        </p>

        {/* 귀여운 마스코트 고양이와 안내 말풍선 */}
        <div className="flex items-center gap-3.5 my-3 sm:my-4 bg-black/40 backdrop-blur-2xl px-5 py-3 rounded-2xl border border-white/30 shadow-xl max-w-lg">
          <img
            src="/images/characters/mascot_guide.png"
            alt="피아노 마스코트"
            className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-md shrink-0"
          />
          <div className="text-left">
            <span className="text-xs sm:text-sm font-bold text-amber-300 block mb-0.5">피아노 친구의 초대:</span>
            <span className="text-lg sm:text-2xl font-black text-white tracking-tight leading-snug drop-shadow-md block">
              실제 피아노 앞에 앉아서 '시작하기'를 눌러봐요! 🎵
            </span>
          </div>
        </div>

        {/* 액션 버튼 그룹 */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-2">
          {/* 메인 시작 버튼 */}
          <button
            type="button"
            onClick={onStartPlay}
            className="flex-1 w-full py-3 sm:py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-cyan-400 hover:from-amber-300 hover:to-cyan-300 shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer ring-2 ring-white/40"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>피아노 모험 시작하기! 🚀</span>
          </button>

          {/* 피아노 조율 맞춤 버튼 */}
          <button
            type="button"
            onClick={onOpenCalibration}
            className="w-full sm:w-auto py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm text-white bg-black/30 hover:bg-black/40 border border-white/30 backdrop-blur-md flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
            title="사용자 피아노 소리 자동 맞춤 조율"
          >
            <Sliders className="w-4 h-4 text-cyan-300" />
            <span>피아노 조율 맞춤</span>
          </button>
        </div>
      </div>
    </div>
  );
};
