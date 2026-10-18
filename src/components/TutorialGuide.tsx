import React from 'react';
import { Star, Sparkles, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { TutorialStep } from '../types/tutorial';
import { HandGuideGraphic } from './HandGuideGraphic';
import { TUTORIAL_STEPS } from '../utils/tutorialData';

interface TutorialGuideProps {
  currentStep: TutorialStep;
  currentStepIndex: number;
  isCelebrating: boolean;
  onClose: () => void;
}

export const TutorialGuide: React.FC<TutorialGuideProps> = ({
  currentStep,
  currentStepIndex,
  isCelebrating,
  onClose,
}) => {
  const { key, fingerNumber, fingerName, prompt } = currentStep;

  return (
    <div className="w-full bg-white/[0.12] backdrop-blur-2xl border border-white/35 rounded-3xl p-3.5 sm:p-4 shadow-[0_8px_32px_rgba(0,0,0,0.18)] flex flex-col gap-3 relative overflow-hidden">
      {/* 상단 띠 & 헤더 */}
      <div className="flex items-center justify-between pb-2 border-b border-white/20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs border border-cyan-400/30">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              손가락 연습 튜토리얼
              <span className="text-[10px] font-semibold text-cyan-200 bg-cyan-950/70 px-2 py-0.5 rounded-full border border-cyan-700/60 shadow-inner">
                {currentStepIndex + 1} / 5 단계
              </span>
            </span>
          </div>
        </div>

        {/* 닫기 (자유 연주로 복귀) 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          title="튜토리얼 종료하고 자유 연주 모드로 가기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 5개 별 진행 바 */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-black/25 backdrop-blur-md rounded-xl border border-white/20">
        {TUTORIAL_STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div key={step.stepIndex} className="flex items-center gap-1 flex-1 justify-center">
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  isDone
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                    : isCurrent
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/80 shadow-sm shadow-amber-500/30 scale-105'
                    : 'text-slate-600'
                }`}
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    isDone
                      ? 'fill-emerald-400 text-emerald-400'
                      : isCurrent
                      ? 'fill-amber-400 text-amber-400 animate-pulse'
                      : 'text-slate-700'
                  }`}
                />
                <span className="text-[11px] font-mono">
                  {step.fingerNumber}번 {step.key.koreanName}
                </span>
              </div>
              {idx < 4 && <ChevronRight className="w-3 h-3 text-slate-700 shrink-0 hidden sm:block" />}
            </div>
          );
        })}
      </div>

      {/* 핵심 안내 영역: 좌측 손 그래픽 / 우측 타깃 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* 좌측: 오른손 5손가락 SVG 시각 안내 */}
        <div className="sm:col-span-5 flex justify-center">
          <HandGuideGraphic activeFinger={fingerNumber} />
        </div>

        {/* 우측: 타깃 음표 대형 카드 및 지시 */}
        <div className="sm:col-span-7 flex flex-col justify-between h-full gap-2">
          {/* 상태 배너: 정답 축하 vs 목표 안내 */}
          {isCelebrating ? (
            <div className="flex-1 flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-emerald-950/80 border-2 border-emerald-400 text-center animate-bounce shadow-lg shadow-emerald-950">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-1" />
              <span className="text-base sm:text-lg font-black text-emerald-300">
                딩동댕! 아주 잘했어요! ✨
              </span>
              <span className="text-xs text-emerald-200 mt-0.5">
                {fingerNumber}번 손가락 {key.koreanName}({key.fullName}) 성공! 다음 음으로 갑니다!
              </span>
            </div>
          ) : (
            <div
              className="flex-1 flex flex-col justify-between p-3.5 rounded-2xl border transition-all"
              style={{
                backgroundColor: `${key.color}15`,
                borderColor: `${key.color}60`,
                boxShadow: `0 0 20px ${key.color}20`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-black/40 text-white border border-white/30 backdrop-blur-md">
                  {fingerNumber}번 손가락 ({fingerName})
                </span>
                <span className="text-xs font-bold text-white/90 font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  건반 키: {key.shortcut}
                </span>
              </div>

              {/* 목표 음표 대형 텍스트 */}
              <div className="flex items-baseline gap-3 my-2">
                <span
                  className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-md"
                  style={{ color: key.color }}
                >
                  '{key.koreanName}'
                </span>
                <span className="text-base sm:text-lg font-black text-white font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  ({key.fullName})
                </span>
                <span className="text-xs text-white/80 font-bold ml-auto drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  실제 피아노 또는 키보드로 타건!
                </span>
              </div>

              {/* 안내 문구 */}
              <p className="text-xs sm:text-sm font-semibold text-slate-200 leading-snug">
                👉 {prompt}
              </p>
            </div>
          )}

          {/* 하단 힌트 팁 & 마스코트 */}
          <div className="text-[11px] text-slate-300 bg-slate-950/70 p-2 sm:p-2.5 rounded-xl border border-slate-800/80 flex items-center gap-3">
            <img
              src="/images/characters/mascot_guide.png"
              alt="마스코트"
              className="w-10 h-10 object-contain drop-shadow-md shrink-0 animate-bounce"
              style={{ animationDuration: '4s' }}
            />
            <div className="flex-1 leading-snug">
              <span className="text-amber-400 font-bold mr-1">피아노 친구의 팁:</span>
              <span>
                화면 아래 <span className="text-cyan-300 font-bold">{key.koreanName}</span> 건반의 손가락 번호(
                <strong className="text-white font-extrabold">{fingerNumber}번</strong>)를 확인하고 실제 피아노로 눌러보세요!
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
