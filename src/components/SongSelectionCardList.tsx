import React, { useState } from 'react';
import { SongMetadata } from '../types/sheet';
import { Music, Sparkles, Clock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface SongSelectionCardListProps {
  songs: SongMetadata[];
  selectedSongId: string;
  isPlaying: boolean;
  onSelectSong: (song: SongMetadata) => void;
  defaultExpanded?: boolean;
}

export const SongSelectionCardList: React.FC<SongSelectionCardListProps> = React.memo(({
  songs,
  selectedSongId,
  isPlaying,
  onSelectSong,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const currentSong = songs.find((s) => s.id === selectedSongId) || songs[0];

  return (
    <div className="w-full">
      {/* 아코디언 토글 헤더 바 (컴팩트 글래스 캡슐) */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-2xl bg-black/45 hover:bg-black/60 border border-white/35 backdrop-blur-xl transition-all cursor-pointer active:scale-[0.99] shadow-md mb-1"
        title="동요 곡집 카드 열기/접기"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-amber-400/25 text-amber-300 border border-amber-300/60 shadow-sm">
            <Music className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            동요 앨범 (5곡)
          </span>
          <span className="text-[10px] font-black text-amber-300 bg-black/60 px-2 py-0.5 rounded-full border border-amber-400/50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            현재: {currentSong.icon || '🎵'} {currentSong.title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-black text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          <span className="text-[10px] hidden sm:inline">
            {isExpanded ? '곡 목록 닫기' : '다른 곡 골라보기 🎶'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-amber-300" />
          ) : (
            <ChevronDown className="w-4 h-4 text-amber-300" />
          )}
        </div>
      </button>

      {/* 가로 스크롤 카드 슬라이더 트랙 (펼침 상태에서만 표시) */}
      {isExpanded && (
        <div className="flex items-stretch gap-2.5 sm:gap-3 overflow-x-auto pb-2 pt-1 px-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent animate-fadeIn">
          {songs.map((s) => {
            const isSelected = s.id === selectedSongId;
            const noteCount = s.notes.length;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onSelectSong(s);
                  // 모바일/패드 환경에서 곡 선택 후 자동 접힘으로 연주 공간 확보
                  setIsExpanded(false);
                }}
                className={`group relative flex flex-col justify-between text-left p-2.5 sm:p-3 rounded-2xl transition-all duration-200 cursor-pointer shrink-0 w-52 sm:w-60 min-h-[105px] border active:scale-95 ${
                  isSelected
                    ? 'bg-slate-900/95 border-amber-400 shadow-[0_8px_24px_rgba(251,191,36,0.35)] ring-2 ring-amber-400/70'
                    : 'bg-slate-900/85 hover:bg-slate-900/95 border-white/30 hover:border-amber-300/60 shadow-[0_4px_16px_rgba(0,0,0,0.3)]'
                } backdrop-blur-2xl`}
              >
                {/* 상단: 아이콘 + 제목 + 난이도 */}
                <div className="w-full">
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl filter drop-shadow-md group-hover:scale-110 transition-transform">
                        {s.icon || '🎵'}
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-white leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                          {s.title}
                        </h4>
                        <p className="text-[10px] text-sky-300 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                          {s.composer}
                        </p>
                      </div>
                    </div>

                    {/* 난이도 별 뱃지 */}
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-black/60 text-amber-300 border border-amber-300/40 shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {s.difficulty || '★☆☆'}
                    </span>
                  </div>

                  {/* 곡 설명 */}
                  <p className="text-[10px] text-slate-200 font-bold line-clamp-1 leading-snug drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                    {s.description || '재미있게 연주해보아요!'}
                  </p>
                </div>

                {/* 하단: 메타 정보 태그 + 상태 뱃지 */}
                <div className="w-full flex items-center justify-between pt-1.5 border-t border-white/15 mt-1.5">
                  <div className="flex items-center gap-1 text-[10px] text-white font-bold">
                    <span className="flex items-center gap-0.5 bg-black/60 px-1.5 py-0.5 rounded border border-white/20">
                      <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                      {noteCount}음
                    </span>
                    <span className="flex items-center gap-0.5 bg-black/60 px-1.5 py-0.5 rounded border border-white/20">
                      <Clock className="w-2.5 h-2.5 text-sky-300" />
                      {s.bpm}BPM
                    </span>
                  </div>

                  {isSelected ? (
                    <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-sm">
                      <CheckCircle className="w-3 h-3 fill-current" />
                      {isPlaying ? '연주 중' : '선택됨'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-amber-300 group-hover:text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] transition-colors">
                      연주하기 →
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});
