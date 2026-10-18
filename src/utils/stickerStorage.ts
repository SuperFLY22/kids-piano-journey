/**
 * Kids Piano Journey - 스티커북 메타데이터 및 LocalStorage 영속화 매니저
 * 10개 커리큘럼 레벨 및 5곡 동요 완곡 성취 스티커 SSOT
 */

import { RewardSticker } from '../types/sticker';

export const STICKER_STORAGE_KEY = 'kids_piano_unlocked_stickers';

// 15종 고유 보상 스티커 카탈로그 (SSOT)
export const STICKER_CATALOG: RewardSticker[] = [
  // 10개 커리큘럼 레벨 스티커
  {
    id: 'sticker-lv1',
    name: '빨간 사과',
    emoji: '🍎',
    category: 'curriculum',
    targetLevel: 1,
    description: '1번 엄지손가락으로 가온 도(C4)를 톡톡 쳤어요!',
    unlockCondition: '1단계 모험을 별 2개 이상으로 클리어',
    themeColor: '#EF4444',
  },
  {
    id: 'sticker-lv2',
    name: '퐁당 징검다리',
    emoji: '🪨',
    category: 'curriculum',
    targetLevel: 2,
    description: '도와 레를 번갈아 징검다리 건너듯 연주했어요!',
    unlockCondition: '2단계 모험을 별 2개 이상으로 클리어',
    themeColor: '#F97316',
  },
  {
    id: 'sticker-lv3',
    name: '노란 미끄럼틀',
    emoji: '🛝',
    category: 'curriculum',
    targetLevel: 3,
    description: '도-레-미 3개 음표 계단을 미끄럼틀처럼 슈웅 탔어요!',
    unlockCondition: '3단계 모험을 별 2개 이상으로 클리어',
    themeColor: '#EAB308',
  },
  {
    id: 'sticker-lv4',
    name: '꼬마 비행기',
    emoji: '✈️',
    category: 'curriculum',
    targetLevel: 4,
    description: '3손가락으로 첫 동요 비행기를 멋지게 조종했어요!',
    unlockCondition: '4단계 모험을 별 2개 이상으로 클리어',
    themeColor: '#38BDF8',
  },
  {
    id: 'sticker-lv5',
    name: '아기 개구리',
    emoji: '🐸',
    category: 'curriculum',
    targetLevel: 5,
    description: '4번 약지손가락에 힘을 주어 파(F4)를 폴짝 뛰었어요!',
    unlockCondition: '5단계 모험을 별 2개 이상으로 클리어',
    themeColor: '#22C55E',
  },
  {
    id: 'sticker-lv6',
    name: '파란 무지개',
    emoji: '🌈',
    category: 'curriculum',
    targetLevel: 6,
    description: '1번부터 5번 손가락까지 다섯 손가락 무지개를 완성했어요!',
    unlockCondition: '6단계 모험을 별 2개 이상으로 클리어',
    themeColor: '#06B6D4',
  },
  {
    id: 'sticker-lv7',
    name: '춤추는 나비',
    emoji: '🦋',
    category: 'curriculum',
    targetLevel: 7,
    description: '솔-미, 파-레 건너뛰기 징검다리를 나비처럼 춤췄어요!',
    unlockCondition: '7단계 모험을 별 2개 이상으로 클리어',
    themeColor: '#A855F7',
  },
  {
    id: 'sticker-lv8',
    name: '똑딱 시계',
    emoji: '⏰',
    category: 'curriculum',
    targetLevel: 8,
    description: '하얀 2분음표를 쿵-쿵 2박자 동안 지긋이 눌렀어요!',
    unlockCondition: '8단계 모험을 별 2개 이상으로 클리어',
    themeColor: '#EC4899',
  },
  {
    id: 'sticker-lv9',
    name: '아기곰',
    emoji: '🐻',
    category: 'curriculum',
    targetLevel: 9,
    description: '씩씩한 도미솔 아르페지오로 아빠곰을 깨웠어요!',
    unlockCondition: '9단계 모험을 별 2개 이상으로 클리어',
    themeColor: '#F59E0B',
  },
  {
    id: 'sticker-lv10',
    name: '황금 트로피',
    emoji: '🏆',
    category: 'curriculum',
    targetLevel: 10,
    description: '10단계 모험을 마스터하고 어린이 피아니스트가 되었어요!',
    unlockCondition: '10단계 졸업식을 별 2개 이상으로 클리어',
    themeColor: '#FACC15',
  },

  // 5곡 동요 완곡 스티커
  {
    id: 'sticker-song-airplane',
    name: '은빛 날개',
    emoji: '🛫',
    category: 'song',
    targetSongId: 'song-airplane',
    description: '동요 비행기를 하늘 높이 완곡 연주했어요!',
    unlockCondition: '동요 [비행기] 별 2개 이상 달성',
    themeColor: '#0EA5E9',
  },
  {
    id: 'sticker-song-butterfly',
    name: '꽃과 나비',
    emoji: '🌸',
    category: 'song',
    targetSongId: 'song-butterfly',
    description: '동요 나비야의 솔-솔-미 멜로디를 예쁘게 노래했어요!',
    unlockCondition: '동요 [나비야] 별 2개 이상 달성',
    themeColor: '#F43F5E',
  },
  {
    id: 'sticker-song-twinkle',
    name: '반짝이는 별',
    emoji: '⭐',
    category: 'song',
    targetSongId: 'song-twinkle',
    description: '밤하늘의 작은 별을 6개 음표로 반짝이게 연주했어요!',
    unlockCondition: '동요 [작은 별] 별 2개 이상 달성',
    themeColor: '#FBBF24',
  },
  {
    id: 'sticker-song-three-bears',
    name: '아빠 곰',
    emoji: '🐻',
    category: 'song',
    targetSongId: 'song-three-bears',
    description: '곰 세 마리 가족의 신나는 리듬을 연주했어요!',
    unlockCondition: '동요 [곰 세 마리] 별 2개 이상 달성',
    themeColor: '#D97706',
  },
  {
    id: 'sticker-song-ode-to-joy',
    name: '마법 음표',
    emoji: '🎶',
    category: 'song',
    targetSongId: 'song-ode-to-joy',
    description: '베토벤의 환희의 송가를 웅장하게 완곡했어요!',
    unlockCondition: '동요 [환희의 송가] 별 2개 이상 달성',
    themeColor: '#8B5CF6',
  },
];

/**
 * LocalStorage에서 해금된 스티커 ID 목록 로드
 */
export function loadUnlockedStickers(): string[] {
  try {
    const raw = localStorage.getItem(STICKER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * 스티커 ID 목록 LocalStorage 저장
 */
export function saveUnlockedStickers(ids: string[]): void {
  try {
    localStorage.setItem(STICKER_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // 무시
  }
}

/**
 * 특정 스티커 해금 여부 확인
 */
export function isStickerUnlocked(id: string): boolean {
  const list = loadUnlockedStickers();
  return list.includes(id);
}

/**
 * 레벨 클리어 결과(별 2개 이상)에 따른 스티커 해금 검사
 * 새로 해금된 경우 해당 RewardSticker 객체 반환, 이미 해금되었거나 조건 미달 시 null
 */
export function checkAndUnlockLevelSticker(level: number, stars: number): RewardSticker | null {
  if (stars < 2) return null;

  const targetSticker = STICKER_CATALOG.find(
    (s) => s.category === 'curriculum' && s.targetLevel === level
  );
  if (!targetSticker) return null;

  const currentUnlocked = loadUnlockedStickers();
  if (currentUnlocked.includes(targetSticker.id)) {
    return null; // 이미 획득함
  }

  const nextList = [...currentUnlocked, targetSticker.id];
  saveUnlockedStickers(nextList);
  return targetSticker;
}

/**
 * 동요 완곡 결과(별 2개 이상)에 따른 스티커 해금 검사
 */
export function checkAndUnlockSongSticker(songId: string, stars: number): RewardSticker | null {
  if (stars < 2) return null;

  const targetSticker = STICKER_CATALOG.find(
    (s) => s.category === 'song' && s.targetSongId === songId
  );
  if (!targetSticker) return null;

  const currentUnlocked = loadUnlockedStickers();
  if (currentUnlocked.includes(targetSticker.id)) {
    return null; // 이미 획득함
  }

  const nextList = [...currentUnlocked, targetSticker.id];
  saveUnlockedStickers(nextList);
  return targetSticker;
}

/**
 * 스티커북 전체 초기화
 */
export function resetStickers(): void {
  try {
    localStorage.removeItem(STICKER_STORAGE_KEY);
  } catch {
    // 무시
  }
}
