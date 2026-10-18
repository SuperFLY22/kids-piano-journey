import React, { useState, useEffect } from 'react';
import { Trophy, Star, RotateCcw, CheckCircle2, Award, Sparkles, BookOpen } from 'lucide-react';
import { RhythmGameState, SongMetadata } from '../types/sheet';
import { RewardSticker } from '../types/sticker';

import { evaluateSongPerformance } from '../utils/songData';

interface SongCompletionModalProps {
  song: SongMetadata;
  gameState: RhythmGameState;
  onRestart: () => void;
  onClose: () => void;
  isCurriculumMode?: boolean;
  hasNextLevel?: boolean;
  onNextLevel?: () => void;
  unlockedSticker?: RewardSticker | null;
  onOpenStickerBook?: () => void;
}

export const SongCompletionModal: React.FC<SongCompletionModalProps> = ({
  song,
  gameState,
  onRestart,
  onClose,
  isCurriculumMode = false,
  hasNextLevel = false,
  onNextLevel,
  unlockedSticker = null,
  onOpenStickerBook,
}) => {

  const [imageFailed, setImageFailed] = useState(false);
  const [animatedStars, setAnimatedStars] = useState<number>(0);

  const isPractice = gameState.playMode === 'practice';
  const totalNotes = song.notes.length > 0 ? song.notes.length : 1;
  const processedHits = gameState.perfectCount + gameState.goodCount;
  const accuracy = isPractice
    ? 100
    : Math.min(100, Math.round((processedHits / totalNotes) * 100));

  // 3단계 완주 성취도 평가
  const evalResult = evaluateSongPerformance(gameState.score, totalNotes);
  const starsCount = evalResult.stars;

  // 음성 칭찬(Web Speech API) 및 별 순차 점등 연출
  useEffect(() => {
    // 1. 별 1~3개 순차 애니메이션 (0.25초 간격으로 점등)
    const timers: NodeJS.Timeout[] = [];
    for (let i = 1; i <= starsCount; i++) {
      timers.push(
        setTimeout(() => {
          setAnimatedStars(i);
        }, i * 250)
      );
    }

    // 2. 브라우저 내장 Web Speech API로 유아 맞춤 한국어 칭찬 음성 출력
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // 이전 발화 취소
        const praiseMessages: Record<1 | 2 | 3, string> = {
          3: '와아! 완벽해요! 참 잘했어요! 피아노 마스터예요!',
          2: '참 잘했어요! 정말 멋진 연주예요!',
          1: '끝까지 완주 성공! 정말 대단해요!',
        };
        const text = praiseMessages[starsCount as 1 | 2 | 3] || '참 잘했어요!';
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.rate = 1.0;
        utterance.pitch = 1.25; // 아이들에게 친근한 밝고 높은 피치
        utterance.volume = 0.9;

        // 약간의 팡파르 사운드 이후 발화 (350ms 딜레이)
        const speechTimer = setTimeout(() => {
          try {
            window.speechSynthesis.speak(utterance);
          } catch {
            // Speech synthesis failed or blocked
          }
        }, 350);
        timers.push(speechTimer);
      }
    } catch {
      // SpeechSynthesis unsupported in this environment
    }

    return () => {
      timers.forEach((t) => clearTimeout(t));
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [starsCount]);


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      {/* 배경 회전 축하 폭죽 (combo_firework.png) */}
      <img
        src="/images/effects/combo_firework.png"
        alt="축하 폭죽"
        className="absolute w-80 h-80 sm:w-[480px] sm:h-[480px] object-contain pointer-events-none opacity-85 animate-spin"
        style={{ animationDuration: '24s' }}
      />

      <div className="relative z-10 w-full max-w-lg bg-slate-900/90 border-2 border-amber-300/80 rounded-3xl p-5 sm:p-7 shadow-[0_16px_50px_rgba(0,0,0,0.6)] text-center text-white backdrop-blur-2xl">
        {/* 상단 엠블럼 (생성된 고해상도 별점 엠블럼 대형 렌더링) */}
        <div className="mx-auto mb-2 flex items-center justify-center min-h-[130px] relative">
          {!imageFailed ? (
            <img
              src={evalResult.imageSrc}
              alt={evalResult.title}
              onError={() => setImageFailed(true)}
              className="w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-[0_12px_28px_rgba(245,158,11,0.65)] animate-bounce"
            />
          ) : (
            <div
              className={`w-28 h-28 rounded-full flex items-center justify-center shadow-lg animate-bounce ${
                starsCount === 3
                  ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-amber-500/40'
                  : starsCount === 2
                  ? 'bg-gradient-to-tr from-sky-500 to-teal-300 shadow-sky-500/40'
                  : 'bg-gradient-to-tr from-emerald-500 to-lime-300 shadow-emerald-500/40'
              }`}
            >
              {starsCount === 3 ? (
                <Trophy className="w-14 h-14 text-slate-900" />
              ) : starsCount === 2 ? (
                <Award className="w-14 h-14 text-slate-900" />
              ) : (
                <Star className="w-14 h-14 text-slate-900 fill-current" />
              )}
            </div>
          )}
        </div>

        {/* 곡명 및 모드 태그 */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-300/40 text-amber-200 text-xs font-bold mb-2 shadow-sm">
          <span>{song.title}</span>
          <span className="text-amber-400">•</span>
          <span>{isPractice ? '연습 모드 완곡' : '실전 리듬 완곡'}</span>
          <span className="text-amber-400">•</span>
          <span>{evalResult.badgeText}</span>
        </div>

        {/* 타이틀 & 칭찬 문구 */}
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-400 mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <span>{evalResult.title}</span>
          <Sparkles className="w-5 h-5 text-amber-300" />
        </h2>
        <p className="text-xs sm:text-sm text-slate-200 mb-4 font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {evalResult.subtitle}
        </p>

        {/* 별점 순차 점등 애니메이션 (1~3개) */}
        <div className="flex justify-center items-center gap-3.5 mb-5">
          {[1, 2, 3].map((starIdx) => {
            const isEarned = starIdx <= animatedStars;
            return (
              <div
                key={starIdx}
                className={`transition-all duration-500 transform ${
                  isEarned
                    ? 'text-amber-300 scale-125 drop-shadow-[0_0_16px_rgba(250,204,21,0.8)] rotate-0'
                    : 'text-slate-700 scale-90 -rotate-12 opacity-60'
                }`}
              >
                <Star className="w-10 h-10 sm:w-11 sm:h-11 fill-current" />
              </div>
            );
          })}
        </div>

        {/* 정답률(Accuracy) 프로그레스 게이지 */}
        <div className="w-full bg-slate-800/80 rounded-2xl p-3 border border-white/10 mb-4 shadow-inner">
          <div className="flex items-center justify-between text-xs font-black mb-1.5 px-1">
            <span className="text-slate-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>정답률 (Accuracy)</span>
            </span>
            <span className="text-emerald-300 font-extrabold text-sm">{accuracy}%</span>
          </div>
          <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-300 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              style={{ width: `${accuracy}%` }}
            />
          </div>
        </div>

        {/* Phase 9: 새로 해금된 스티커 획득 축하 배너 */}
        {unlockedSticker && (
          <div className="w-full bg-gradient-to-r from-amber-500/30 via-pink-500/25 to-purple-500/30 border-2 border-amber-300 rounded-2xl p-2.5 sm:p-3 mb-4 shadow-[0_0_25px_rgba(251,191,36,0.4)] flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-3xl sm:text-4xl drop-shadow-md shrink-0 animate-bounce">
                {unlockedSticker.emoji}
              </span>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full shadow-sm">
                    NEW 스티커!
                  </span>
                  <span className="text-xs sm:text-sm font-black text-white truncate">
                    {unlockedSticker.name}
                  </span>
                </div>
                <p className="text-[11px] text-amber-200 mt-0.5 font-medium truncate">
                  {unlockedSticker.description}
                </p>
              </div>
            </div>
            {onOpenStickerBook && (
              <button
                type="button"
                onClick={onOpenStickerBook}
                className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>스티커북</span>
              </button>
            )}
          </div>
        )}

        {/* 상세 통계 카드 그리드 */}
        <div className="grid grid-cols-3 gap-2 bg-slate-800/80 rounded-2xl p-2.5 sm:p-3 border border-white/10 mb-5">

          <div className="flex flex-col items-center">
            <span className="text-[11px] text-slate-400 font-bold">총 점수</span>
            <span className="text-base sm:text-lg font-black text-amber-300">{gameState.score}점</span>
          </div>
          <div className="flex flex-col items-center border-x border-white/10">
            <span className="text-[11px] text-slate-400 font-bold">최고 콤보</span>
            <span className="text-base sm:text-lg font-black text-orange-400">{gameState.maxCombo}연타</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-slate-400 font-bold">퍼펙트</span>
            <span className="text-base sm:text-lg font-black text-emerald-400">{gameState.perfectCount}개</span>
          </div>
        </div>

        {/* 버튼 그룹 */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          {isCurriculumMode && hasNextLevel && accuracy >= 70 && onNextLevel && (
            <button
              type="button"
              onClick={onNextLevel}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30 active:scale-95 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>다음 레벨 도전! 🚀</span>
            </button>
          )}
          <button
            type="button"
            onClick={onRestart}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>다시 연주하기</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer backdrop-blur-md"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{isCurriculumMode ? '지도로 돌아가기' : '확인'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

