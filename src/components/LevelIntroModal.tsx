/**
 * Kids Piano Journey - 레벨 인트로 안내 모달
 * 스테이지 선택 시 손가락 위치 및 연주 팁, 목표 건반을 미리 보여주고 연습 모드로 시작
 */

import React from 'react';
import { Play, Sparkles, X, Music, CheckCircle2, Hand } from 'lucide-react';
import { CurriculumLevel } from '../types/curriculum';
import { NOTE_META_MAP } from '../utils/songParser';
import { NotePitch } from '../types/sheet';

interface LevelIntroModalProps {
  level: CurriculumLevel | null;
  isOpen: boolean;
  onClose: () => void;
  onStartPractice: (level: CurriculumLevel) => void;
}

export const LevelIntroModal: React.FC<LevelIntroModalProps> = ({
  level,
  isOpen,
  onClose,
  onStartPractice,
}) => {
  if (!isOpen || !level) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-slate-900/95 border-2 border-amber-300/80 rounded-3xl p-5 sm:p-7 shadow-[0_16px_50px_rgba(0,0,0,0.7)] text-white backdrop-blur-2xl">
        {/* 우상단 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 상단 레벨 배지 */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs sm:text-sm shadow-md">
            <span>{level.songData.icon || '🌟'}</span>
            <span>STAGE {level.level}</span>
          </div>
        </div>

        {/* 타이틀 & 부제목 */}
        <h2 className="text-xl sm:text-2xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-400 mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          {level.title}
        </h2>
        <p className="text-xs sm:text-sm text-center text-slate-300 mb-4 font-medium">
          {level.subtitle}
        </p>

        {/* 목표 건반 미리보기 배지 */}
        <div className="bg-slate-800/80 rounded-2xl p-3 border border-white/10 mb-3.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2 px-1">
            <span className="flex items-center gap-1">
              <Music className="w-3.5 h-3.5 text-cyan-400" />
              <span>이번 스테이지 목표 음표</span>
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              총 {level.songData.notes.length}개 음표
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {level.targetNotes.map((pitchStr) => {
              const meta = NOTE_META_MAP[pitchStr as NotePitch] || {
                solfege: pitchStr,
                color: '#EF4444',
                finger: 1,
              };
              return (
                <div
                  key={pitchStr}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-950 font-black text-xs sm:text-sm shadow-md transition-transform hover:scale-105"
                  style={{ backgroundColor: meta.color }}
                >
                  <span className="w-5 h-5 rounded-full bg-black/20 text-white flex items-center justify-center text-[10px]">
                    {meta.finger}
                  </span>
                  <span>{meta.solfege}</span>
                  <span className="text-[10px] opacity-80">({pitchStr})</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 손가락 위치 팁 & 연주 팁 */}
        <div className="flex flex-col gap-2.5 mb-5 text-left">
          <div className="bg-sky-950/50 border border-sky-400/30 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 text-sky-300 font-bold text-xs mb-1">
              <Hand className="w-3.5 h-3.5" />
              <span>손가락 위치 팁</span>
            </div>
            <p className="text-xs sm:text-[13px] text-sky-100 leading-relaxed font-medium">
              {level.handTip}
            </p>
          </div>

          <div className="bg-amber-950/40 border border-amber-400/30 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>선생님의 연주 팁</span>
            </div>
            <p className="text-xs sm:text-[13px] text-amber-100 leading-relaxed font-medium">
              {level.playTip}
            </p>
          </div>
        </div>

        {/* 시작 버튼 그룹 */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={() => onStartPractice(level)}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30 active:scale-95 transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>연습 시작하기 (Wait Mode)</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer backdrop-blur-md"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
            <span>지도로 돌아가기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
