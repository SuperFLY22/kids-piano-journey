/**
 * Kids Piano Journey - 커리큘럼 진행도 LocalStorage 영속화 유틸리티
 */

import { LevelProgress } from '../types/curriculum';

export const CURRICULUM_STORAGE_KEY = 'kids_piano_curriculum_progress';

function getDefaultProgress(): LevelProgress {
  return {
    unlockedLevel: 1,
    levelScores: {},
  };
}

/**
 * 저장된 커리큘럼 진행도를 로드합니다.
 */
export function loadCurriculumProgress(): LevelProgress {
  if (typeof window === 'undefined' && typeof globalThis.localStorage === 'undefined') {
    return getDefaultProgress();
  }

  const storage = typeof window !== 'undefined' ? window.localStorage : globalThis.localStorage;

  try {
    const raw = storage.getItem(CURRICULUM_STORAGE_KEY);
    if (!raw) {
      return getDefaultProgress();
    }
    const parsed = JSON.parse(raw) as LevelProgress;
    return {
      unlockedLevel: Math.max(1, Math.min(10, parsed.unlockedLevel || 1)),
      levelScores: parsed.levelScores || {},
    };
  } catch (err) {
    console.error('Failed to load curriculum progress:', err);
    return getDefaultProgress();
  }
}

/**
 * 특정 레벨 클리어 결과(정답률, 별점)를 저장하고, 70% 이상 달성 시 다음 레벨을 자동 해금합니다.
 */
export function saveLevelClear(
  level: number,
  accuracy: number,
  stars: number
): LevelProgress {
  const current = loadCurriculumProgress();
  const prevRecord = current.levelScores[level];

  // 기존 기록보다 더 높은 별점이나 점수일 때 갱신 (최고 기록 보존)
  const bestStars = prevRecord ? Math.max(prevRecord.stars, stars) : stars;
  const bestAccuracy = prevRecord ? Math.max(prevRecord.accuracy, accuracy) : accuracy;

  current.levelScores[level] = {
    stars: bestStars,
    accuracy: bestAccuracy,
    completedAt: new Date().toISOString(),
  };

  // 70% 이상 달성 시 다음 단계 해금 (최대 10레벨)
  if (accuracy >= 70) {
    current.unlockedLevel = Math.max(current.unlockedLevel, Math.min(10, level + 1));
  }

  const storage = typeof window !== 'undefined' ? window.localStorage : globalThis.localStorage;
  if (storage) {
    try {
      storage.setItem(CURRICULUM_STORAGE_KEY, JSON.stringify(current));
    } catch (err) {
      console.error('Failed to save curriculum progress:', err);
    }
  }

  return current;
}

/**
 * 커리큘럼 진행도를 1레벨로 완전 초기화합니다.
 */
export function resetCurriculumProgress(): LevelProgress {
  const storage = typeof window !== 'undefined' ? window.localStorage : globalThis.localStorage;
  if (storage) {
    try {
      storage.removeItem(CURRICULUM_STORAGE_KEY);
    } catch (err) {
      console.error('Failed to reset curriculum progress:', err);
    }
  }
  return getDefaultProgress();
}
