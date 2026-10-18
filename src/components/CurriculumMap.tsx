/**
 * Kids Piano Journey - 모험 커리큘럼 지도 컴포넌트
 * 1~10단계 구불구불 이어지는 길 위에 배치된 스테이지 발판 및 잠금해제 시각화
 */

import React from 'react';
import { Lock, Star, Sparkles, Trophy, Award, RotateCcw } from 'lucide-react';
import { CurriculumLevel, LevelProgress } from '../types/curriculum';
import { CURRICULUM_LEVELS } from '../utils/curriculumData';

interface CurriculumMapProps {
  progress: LevelProgress;
  onSelectLevel: (level: CurriculumLevel) => void;
  onResetProgress?: () => void;
}

export const CurriculumMap: React.FC<CurriculumMapProps> = ({
  progress,
  onSelectLevel,
  onResetProgress,
}) => {
  const { unlockedLevel, levelScores } = progress;

  // 전체 별 개수 및 클리어 스테이지 계산
  const totalStars = Object.values(levelScores).reduce((acc, curr) => acc + curr.stars, 0);
  const clearedCount = Object.keys(levelScores).length;

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col gap-3 p-3 sm:p-5 rounded-3xl border border-white/30 backdrop-blur-2xl bg-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.35)] select-none">
      {/* 상단 통계 및 배너 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1 bg-black/25 rounded-2xl border border-white/15 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/30">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              <span>피아노 모험 지도 (10단계 커리큘럼)</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            </h2>
            <p className="text-[10px] sm:text-[11px] text-white/80">
              1단계부터 차근차근 도장 깨기! 70% 이상 달성 시 다음 레벨이 열려요.
            </p>
          </div>
        </div>

        {/* 진행도 뱃지 및 리셋 */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-black shadow-sm">
            <Star className="w-3.5 h-3.5 fill-current text-amber-300" />
            <span>{totalStars} / 30 별</span>
          </div>

          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-400/20 border border-sky-300/40 text-sky-200 text-xs font-black shadow-sm">
            <Award className="w-3.5 h-3.5 text-sky-300" />
            <span>{clearedCount} / 10 완료</span>
          </div>

          {onResetProgress && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('모험 진행도를 처음(1단계)으로 초기화할까요?')) {
                  onResetProgress();
                }
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-400/30 transition text-xs cursor-pointer"
              title="진행도 초기화"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 10단계 구불구불 모험 맵 영역 */}
      <div className="relative w-full py-4 px-2 sm:px-6">
        {/* 구불구불 이어지는 배경 트랙 경로 (SVG 패스) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 relative z-10">
          {CURRICULUM_LEVELS.map((levelItem) => {
            const isUnlocked = levelItem.level <= unlockedLevel;
            const scoreRecord = levelScores[levelItem.level];
            const isCleared = !!scoreRecord;
            const stars = scoreRecord?.stars || 0;
            const isCurrentTarget = levelItem.level === unlockedLevel && !isCleared;

            return (
              <div
                key={levelItem.id}
                onClick={() => {
                  if (isUnlocked) {
                    onSelectLevel(levelItem);
                  }
                }}
                className={`relative flex flex-col items-center justify-between p-3.5 rounded-3xl border transition-all duration-300 select-none ${
                  isUnlocked
                    ? 'cursor-pointer hover:scale-105 active:scale-95 shadow-lg'
                    : 'cursor-not-allowed opacity-50 grayscale shadow-none'
                } ${
                  isCurrentTarget
                    ? 'bg-gradient-to-b from-amber-500/30 via-slate-900/90 to-slate-950 border-amber-400 ring-2 ring-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.5)]'
                    : isCleared
                    ? 'bg-slate-900/80 border-emerald-400/50 hover:border-emerald-300 shadow-emerald-950/30'
                    : isUnlocked
                    ? 'bg-slate-900/75 border-sky-400/40 hover:border-sky-300'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                {/* 상단 레벨 번호 & 펄스 뱃지 */}
                <div className="w-full flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full ${
                      isCurrentTarget
                        ? 'bg-amber-400 text-slate-950 animate-pulse'
                        : isCleared
                        ? 'bg-emerald-400/30 text-emerald-200 border border-emerald-400/40'
                        : isUnlocked
                        ? 'bg-sky-400/30 text-sky-200'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    LV.{levelItem.level}
                  </span>

                  {isCurrentTarget && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                  )}

                  {!isUnlocked && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                </div>

                {/* 중앙 원형 발판 아이콘 */}
                <div className="relative my-1">
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-inner transition-transform ${
                      isUnlocked
                        ? 'shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]'
                        : 'bg-slate-800 text-slate-600'
                    }`}
                    style={{
                      backgroundColor: isUnlocked
                        ? levelItem.songData.themeColor || '#06B6D4'
                        : '#334155',
                    }}
                  >
                    {levelItem.songData.icon || '🎵'}
                  </div>

                  {/* 잠긴 경우 자물쇠 오버레이 */}
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center backdrop-blur-[1px]">
                      <Lock className="w-6 h-6 text-slate-300 drop-shadow" />
                    </div>
                  )}
                </div>

                {/* 스테이지 제목 및 부제목 */}
                <div className="w-full text-center mt-1">
                  <div className="text-xs sm:text-sm font-black text-white truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    {levelItem.title}
                  </div>
                  <div className="text-[10px] text-slate-300 truncate font-medium">
                    {levelItem.subtitle}
                  </div>
                </div>

                {/* 하단 획득 별점 (1~3개) */}
                <div className="flex items-center justify-center gap-1 mt-2.5 pt-1.5 border-t border-white/10 w-full">
                  {[1, 2, 3].map((starIdx) => (
                    <Star
                      key={starIdx}
                      className={`w-3.5 h-3.5 ${
                        starIdx <= stars
                          ? 'text-amber-400 fill-current drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                          : 'text-slate-700'
                      }`}
                    />
                  ))}
                  {isCleared && (
                    <span className="text-[10px] font-extrabold text-emerald-300 ml-1">
                      {scoreRecord.accuracy}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
