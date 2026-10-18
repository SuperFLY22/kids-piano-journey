/**
 * Kids Piano Journey - 보상 스티커 도메인 모델
 * 커리큘럼 10단계 및 동요 완곡 성취 동기부여를 위한 스티커북 시스템
 */

export interface RewardSticker {
  id: string;
  name: string;
  emoji: string;
  category: 'curriculum' | 'song';
  targetLevel?: number;
  targetSongId?: string;
  description: string;
  unlockCondition: string;
  themeColor: string;
}

export interface StickerBookProgress {
  unlockedIds: string[];
  lastUnlockedId: string | null;
  totalCount: number;
}
