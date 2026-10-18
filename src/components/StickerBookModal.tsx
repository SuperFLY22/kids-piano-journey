/**
 * Kids Piano Journey - 내 스티커북 모달
 * 10개 커리큘럼 레벨 및 5곡 동요 완곡으로 수집한 스티커 확인 및 터치 애니메이션/차임벨 인터랙션
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Sparkles, Lock, CheckCircle2, BookOpen, Volume2 } from 'lucide-react';
import { STICKER_CATALOG, loadUnlockedStickers } from '../utils/stickerStorage';
import { RewardSticker } from '../types/sticker';
import { soundEffects } from '../utils/soundEffects';

interface StickerBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  newlyUnlockedSticker?: RewardSticker | null;
  onDismissNewSticker?: () => void;
}

export const StickerBookModal: React.FC<StickerBookModalProps> = ({
  isOpen,
  onClose,
  newlyUnlockedSticker = null,
  onDismissNewSticker,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'curriculum' | 'song'>('all');
  const [bouncingStickerId, setBouncingStickerId] = useState<string | null>(null);
  const [previewSticker, setPreviewSticker] = useState<RewardSticker | null>(null);
  const bounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 모달 열림 시점에만 LocalStorage 1회 로드 및 메모이제이션
  const unlockedIds = useMemo(() => {
    if (!isOpen) return [];
    return loadUnlockedStickers();
  }, [isOpen]);

  // 언마운트 시 바운스 타이머 클린업
  useEffect(() => {
    return () => {
      if (bounceTimerRef.current) {
        clearTimeout(bounceTimerRef.current);
      }
    };
  }, []);

  // 신규 획득 스티커가 전달되어 열린 경우 자동 포커스 및 바운스 연출
  useEffect(() => {
    if (isOpen && newlyUnlockedSticker) {
      setPreviewSticker(newlyUnlockedSticker);
      setBouncingStickerId(newlyUnlockedSticker.id);

      // 카테고리 탭도 자동 매칭
      if (newlyUnlockedSticker.category === 'curriculum') {
        setSelectedCategory('curriculum');
      } else if (newlyUnlockedSticker.category === 'song') {
        setSelectedCategory('song');
      }

      if (bounceTimerRef.current) clearTimeout(bounceTimerRef.current);
      bounceTimerRef.current = setTimeout(() => {
        setBouncingStickerId((prev) => (prev === newlyUnlockedSticker.id ? null : prev));
        if (onDismissNewSticker) onDismissNewSticker();
      }, 1200);
    }
  }, [isOpen, newlyUnlockedSticker, onDismissNewSticker]);

  if (!isOpen) return null;

  const totalCount = STICKER_CATALOG.length;
  const unlockedCount = unlockedIds.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  const filteredStickers = STICKER_CATALOG.filter((s) => {
    if (selectedCategory === 'curriculum') return s.category === 'curriculum';
    if (selectedCategory === 'song') return s.category === 'song';
    return true;
  });

  const handleStickerClick = (sticker: RewardSticker, isUnlocked: boolean) => {
    if (!isUnlocked) {
      setPreviewSticker(sticker);
      return;
    }

    // 딩동댕 차임벨 울림
    soundEffects.playSuccessDing();
    setBouncingStickerId(sticker.id);
    setPreviewSticker(sticker);

    // 0.8초 후 바운스 종료 (기존 타이머 안전 정리)
    if (bounceTimerRef.current) clearTimeout(bounceTimerRef.current);
    bounceTimerRef.current = setTimeout(() => {
      setBouncingStickerId((prev) => (prev === sticker.id ? null : prev));
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900/95 border-2 border-amber-300/80 rounded-3xl p-4 sm:p-6 shadow-[0_16px_50px_rgba(0,0,0,0.7)] text-white backdrop-blur-2xl flex flex-col overflow-hidden">
        {/* 우상단 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer z-10"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 상단 헤더: 타이틀 & 수집 통계 배지 */}
        <div className="flex flex-col items-center justify-center mb-3">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-yellow-400 text-slate-950 font-black text-xs sm:text-sm shadow-md mb-1.5">
            <BookOpen className="w-4 h-4" />
            <span>내 스티커북</span>
            <Sparkles className="w-3.5 h-3.5 text-slate-900" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            신나는 피아노 스티커 모음
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-300 text-center font-medium mt-0.5">
            피아노를 연주하고 별 2개 이상을 받으면 예쁜 스티커가 모여요!
          </p>

          {/* 수집 진행바 */}
          <div className="w-full max-w-sm mt-2.5 flex items-center gap-2.5 bg-black/30 px-3 py-1.5 rounded-2xl border border-white/15">
            <span className="text-[11px] font-black text-amber-300 shrink-0">
              {unlockedCount} / {totalCount}개
            </span>
            <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden border border-white/10">
              <div
                className="bg-gradient-to-r from-amber-400 via-pink-400 to-cyan-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-slate-300 shrink-0">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* 카테고리 탭 필터 */}
        <div className="flex items-center justify-center gap-1.5 mb-3">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'bg-white/10 text-white/80 hover:text-white hover:bg-white/15'
            }`}
          >
            전체 보기 ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('curriculum')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedCategory === 'curriculum'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'bg-white/10 text-white/80 hover:text-white hover:bg-white/15'
            }`}
          >
            모험 레벨 🗺️ (10)
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('song')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedCategory === 'song'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'bg-white/10 text-white/80 hover:text-white hover:bg-white/15'
            }`}
          >
            동요 완곡 🎵 (5)
          </button>
        </div>

        {/* 스티커 그리드 영역 (스크롤) */}
        <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 sm:gap-3 p-1">
            {filteredStickers.map((sticker) => {
              const isUnlocked = unlockedIds.includes(sticker.id);
              const isBouncing = bouncingStickerId === sticker.id;

              return (
                <div
                  key={sticker.id}
                  onClick={() => handleStickerClick(sticker, isUnlocked)}
                  className={`relative flex flex-col items-center justify-between p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer text-center select-none ${
                    isUnlocked
                      ? 'bg-white/[0.09] hover:bg-white/[0.18] border-white/30 shadow-[0_4px_16px_rgba(0,0,0,0.3)] active:scale-95'
                      : 'bg-black/30 border-white/10 opacity-60 hover:opacity-75'
                  } ${isBouncing ? 'animate-bounce ring-4 ring-amber-300 scale-105' : ''}`}
                >
                  {/* 스티커 이모지 / 자물쇠 */}
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center my-1">
                    {isUnlocked ? (
                      <span className="text-3xl sm:text-4xl filter drop-shadow-md transition-transform hover:scale-110">
                        {sticker.emoji}
                      </span>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                        <Lock className="w-5 h-5 text-slate-400" />
                      </div>
                    )}

                    {isUnlocked && (
                      <span className="absolute -top-1 -right-1 text-[9px] bg-amber-400 text-slate-950 font-black px-1 rounded-full shadow-sm">
                        ★
                      </span>
                    )}
                  </div>

                  {/* 스티커 이름 */}
                  <div className="w-full">
                    <p className="text-[11px] sm:text-xs font-black truncate text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {isUnlocked ? sticker.name : '???'}
                    </p>
                    <p className="text-[9px] text-slate-400 truncate mt-0.5">
                      {sticker.category === 'curriculum'
                        ? `Stage ${sticker.targetLevel}`
                        : '동요 완곡'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 하단 선택된 스티커 상세 미리보기 바 */}
        <div className="mt-3 p-3 rounded-2xl bg-slate-800/90 border border-white/15 flex items-center justify-between gap-3 shrink-0">
          {previewSticker ? (
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl sm:text-3xl shrink-0">
                {unlockedIds.includes(previewSticker.id) ? previewSticker.emoji : '🔒'}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-black text-amber-300">
                    {unlockedIds.includes(previewSticker.id)
                      ? previewSticker.name
                      : '아직 잠긴 스티커예요'}
                  </span>
                  {unlockedIds.includes(previewSticker.id) && (
                    <span className="text-[10px] text-teal-300 font-bold flex items-center gap-0.5">
                      <Volume2 className="w-3 h-3" />
                      터치 시 차임벨 울림
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 truncate">
                  {unlockedIds.includes(previewSticker.id)
                    ? previewSticker.description
                    : `획득 방법: ${previewSticker.unlockCondition}`}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>스티커를 터치해보세요! 딩동댕 소리와 함께 춤을 춰요 🎶</span>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs shrink-0 transition cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
