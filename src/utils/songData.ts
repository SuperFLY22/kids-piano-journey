/**
 * Kids Piano Journey - 동요 악보 데이터 및 오선보 기하 헬퍼
 * 순수 데이터 및 순수 판정 알고리즘
 */

import { SongMetadata, NotePitch, HitRating, SongEvaluation } from '../types/sheet';
import { createSong, NOTE_META_MAP, SongNoteTuple } from './songParser';

export { NOTE_META_MAP };

// ==========================================
// 1. 동요 5곡 정의 (createSong 간이 파서 기반)
// ==========================================

/**
 * 곡 1: 동요 '비행기' (전래 동요 / 난이도 ★☆☆)
 */
const AIRPLANE_TUPLES: SongNoteTuple[] = [
  // 1마디: 떴다 떴다 비행기 (미 레 도 레)
  ['E4', 1], ['D4', 1], ['C4', 1], ['D4', 1],
  // 2마디: 날아라 날아라 (미 미 미 -)
  ['E4', 1], ['E4', 1], ['E4', 2],
  // 3마디: 높이 높이 날아라 (레 레 레 -)
  ['D4', 1], ['D4', 1], ['D4', 2],
  // 4마디: 우리 비행기 (미 솔 솔 -)
  ['E4', 1], ['G4', 1], ['G4', 2],
  // 5마디: 내가 만든 비행기 (미 레 도 레)
  ['E4', 1], ['D4', 1], ['C4', 1], ['D4', 1],
  // 6마디: 날아라 날아라 (미 미 미 미)
  ['E4', 1], ['E4', 1], ['E4', 1], ['E4', 1],
  // 7마디: 높이 높이 날아라 (레 레 미 레)
  ['D4', 1], ['D4', 1], ['E4', 1], ['D4', 1],
  // 8마디: 우리 비행기 (도 - - -)
  ['C4', 4],
];

export const AIRPLANE_SONG: SongMetadata = createSong({
  id: 'song-airplane',
  title: '동요 비행기 ✈️',
  composer: '전래 동요',
  bpm: 76,
  beatsPerMeasure: 4,
  totalMeasures: 8,
  difficulty: '★☆☆',
  description: '손가락 1, 2, 3, 5번으로 경쾌하게 비행기를 날려보아요!',
  icon: '✈️',
  themeColor: 'from-sky-500 to-indigo-600',
  accompanimentChords: ['C', 'C', 'G7', 'C', 'C', 'C', 'G7', 'C'],
  notes: AIRPLANE_TUPLES,
});

/**
 * 곡 2: 동요 '나비야' (독일 민요 / 난이도 ★☆☆)
 */
const BUTTERFLY_TUPLES: SongNoteTuple[] = [
  // 1마디: 나비야 나비야 (솔 미 미 -)
  ['G4', 1], ['E4', 1], ['E4', 2],
  // 2마디: 이리 날아오너라 (파 레 레 -)
  ['F4', 1], ['D4', 1], ['D4', 2],
  // 3마디: 노랑나비 흰나비 (도 레 미 파)
  ['C4', 1], ['D4', 1], ['E4', 1], ['F4', 1],
  // 4마디: 춤을 추며 오너라 (솔 솔 솔 -)
  ['G4', 1], ['G4', 1], ['G4', 2],
  // 5마디: 봄바람에 꽃잎도 (솔 미 미 -)
  ['G4', 1], ['E4', 1], ['E4', 2],
  // 6마디: 방긋방긋 웃으며 (파 레 레 -)
  ['F4', 1], ['D4', 1], ['D4', 2],
  // 7마디: 참새도 짹짹짹 (도 미 솔 솔)
  ['C4', 1], ['E4', 1], ['G4', 1], ['G4', 1],
  // 8마디: 노래하며 춤춘다 (미 레 도 -)
  ['E4', 1], ['D4', 1], ['C4', 2],
];

export const BUTTERFLY_SONG: SongMetadata = createSong({
  id: 'song-butterfly',
  title: '동요 나비야 🦋',
  composer: '독일 민요',
  bpm: 76,
  beatsPerMeasure: 4,
  totalMeasures: 8,
  difficulty: '★☆☆',
  description: '1번부터 5번 손가락을 골고루 움직이며 봄 나비를 맞이해요.',
  icon: '🦋',
  themeColor: 'from-amber-400 to-rose-500',
  accompanimentChords: ['C', 'G7', 'C', 'C', 'C', 'G7', 'C', 'C'],
  notes: BUTTERFLY_TUPLES,
});

/**
 * 곡 3: 작은 별 (W. A. 모차르트 / 난이도 ★★☆)
 */
const TWINKLE_STAR_TUPLES: SongNoteTuple[] = [
  // 1마디: 반짝반짝 작은별 (도 도 솔 솔)
  ['C4', 1, 1], ['C4', 1, 1], ['G4', 1, 5], ['G4', 1, 5],
  // 2마디: 아름답게 (라 라 솔 -)
  ['A4', 1, 1], ['A4', 1, 1], ['G4', 2, 5],
  // 3마디: 비치네 (파 파 미 미)
  ['F4', 1, 4], ['F4', 1, 4], ['E4', 1, 3], ['E4', 1, 3],
  // 4마디: 동쪽하늘 (레 레 도 -)
  ['D4', 1, 2], ['D4', 1, 2], ['C4', 2, 1],
  // 5마디: 에서도 서쪽 (솔 솔 파 파)
  ['G4', 1, 5], ['G4', 1, 5], ['F4', 1, 4], ['F4', 1, 4],
  // 6마디: 하늘에서도 (미 미 레 -)
  ['E4', 1, 3], ['E4', 1, 3], ['D4', 2, 2],
  // 7마디: 반짝반짝 작은별 (솔 솔 파 파)
  ['G4', 1, 5], ['G4', 1, 5], ['F4', 1, 4], ['F4', 1, 4],
  // 8마디: 아름답게 비치네 (미 미 레 도 -)
  ['E4', 1, 3], ['D4', 1, 2], ['C4', 2, 1],
];

export const TWINKLE_STAR_SONG: SongMetadata = createSong({
  id: 'song-twinkle',
  title: '작은 별 🌟',
  composer: 'W. A. 모차르트',
  bpm: 74,
  beatsPerMeasure: 4,
  totalMeasures: 8,
  difficulty: '★★☆',
  description: 'A4(라) 음표까지 손가락을 넓혀 모차르트의 반짝이는 선율을 연주해요.',
  icon: '🌟',
  themeColor: 'from-yellow-400 to-amber-600',
  accompanimentChords: ['C', 'C', 'C', 'G7', 'C', 'G7', 'C', 'C'],
  notes: TWINKLE_STAR_TUPLES,
});

/**
 * 곡 4: 곰 세 마리 (전래 동요 / 난이도 ★★☆)
 */
const THREE_BEARS_TUPLES: SongNoteTuple[] = [
  // 1마디: 곰 세 마리가 (도 도 도 도 도)
  ['C4', 1, 1], ['C4', 1, 1], ['C4', 1, 1], ['C4', 1, 1],
  // 2마디: 한 집에 있어 (미 솔 솔 미 도)
  ['E4', 1, 3], ['G4', 1, 5], ['G4', 1, 5], ['E4', 1, 3],
  // 3마디: 아빠 곰 (솔 솔 미 -)
  ['G4', 1, 5], ['G4', 1, 5], ['E4', 2, 3],
  // 4마디: 엄마 곰 (솔 솔 미 -)
  ['G4', 1, 5], ['G4', 1, 5], ['E4', 2, 3],
  // 5마디: 아기 곰 (도 도 도 -)
  ['C4', 1, 1], ['C4', 1, 1], ['C4', 2, 1],
  // 6마디: 아빠 곰은 뚱뚱해 (솔 솔 솔 미)
  ['G4', 1, 5], ['G4', 1, 5], ['G4', 1, 5], ['E4', 1, 3],
  // 7마디: 엄마 곰은 날씬해 (솔 솔 솔 미)
  ['G4', 1, 5], ['G4', 1, 5], ['G4', 1, 5], ['E4', 1, 3],
  // 8마디: 으쓱 으쓱 잘한다 (도 레 미 도)
  ['C4', 1, 1], ['D4', 1, 2], ['E4', 1, 3], ['C4', 1, 1],
];

export const THREE_BEARS_SONG: SongMetadata = createSong({
  id: 'song-three-bears',
  title: '곰 세 마리 🐻',
  composer: '전래 동요',
  bpm: 76,
  beatsPerMeasure: 4,
  totalMeasures: 8,
  difficulty: '★★☆',
  description: '도-미-솔 3화음과 신나는 리듬으로 으쓱으쓱 연주해보아요.',
  icon: '🐻',
  themeColor: 'from-orange-500 to-amber-700',
  accompanimentChords: ['C', 'C', 'C', 'C', 'C', 'G7', 'G7', 'C'],
  notes: THREE_BEARS_TUPLES,
});

/**
 * 곡 5: 환희의 송가 (L. v. 베토벤 / 난이도 ★★★)
 */
const ODE_TO_JOY_TUPLES: SongNoteTuple[] = [
  // 1마디: 미 미 파 솔
  ['E4', 1, 3], ['E4', 1, 3], ['F4', 1, 4], ['G4', 1, 5],
  // 2마디: 솔 파 미 레
  ['G4', 1, 5], ['F4', 1, 4], ['E4', 1, 3], ['D4', 1, 2],
  // 3마디: 도 도 레 미
  ['C4', 1, 1], ['C4', 1, 1], ['D4', 1, 2], ['E4', 1, 3],
  // 4마디: 미 레 레 -
  ['E4', 1, 3], ['D4', 1, 2], ['D4', 2, 2],
  // 5마디: 미 미 파 솔
  ['E4', 1, 3], ['E4', 1, 3], ['F4', 1, 4], ['G4', 1, 5],
  // 6마디: 솔 파 미 레
  ['G4', 1, 5], ['F4', 1, 4], ['E4', 1, 3], ['D4', 1, 2],
  // 7마디: 도 도 레 미
  ['C4', 1, 1], ['C4', 1, 1], ['D4', 1, 2], ['E4', 1, 3],
  // 8마디: 레 도 도 -
  ['D4', 1, 2], ['C4', 1, 1], ['C4', 2, 1],
];

export const ODE_TO_JOY_SONG: SongMetadata = createSong({
  id: 'song-ode-to-joy',
  title: '환희의 송가 🕊️',
  composer: 'L. v. 베토벤',
  bpm: 76,
  beatsPerMeasure: 4,
  totalMeasures: 8,
  difficulty: '★★★',
  description: '베토벤 교향곡 9번의 웅장한 테마를 5손가락으로 멋지게 완성해요.',
  icon: '🕊️',
  themeColor: 'from-emerald-500 to-teal-700',
  accompanimentChords: ['C', 'G7', 'C', 'G7', 'C', 'G7', 'C', 'C'],
  notes: ODE_TO_JOY_TUPLES,
});

/**
 * 동요 5곡 전 카탈로그
 */
export const SONG_CATALOG: SongMetadata[] = [
  AIRPLANE_SONG,
  BUTTERFLY_SONG,
  TWINKLE_STAR_SONG,
  THREE_BEARS_SONG,
  ODE_TO_JOY_SONG,
];

/**
 * 박자(Beat)를 초(Seconds) 단위로 변환
 */
export function beatToSeconds(beat: number, bpm: number): number {
  return (beat * 60) / bpm;
}

/**
 * 초(Seconds)를 박자(Beat) 단위로 변환
 */
export function secondsToBeat(seconds: number, bpm: number): number {
  return (seconds * bpm) / 60;
}

/**
 * 표준 높은음자리표 오선보 상의 음표 Y 위치 계산 (C4 ~ C5)
 * line1Y = 제1선 (E4)
 */
export function getNoteStaffY(pitch: NotePitch, line1Y: number, lineSpacing: number): number {
  switch (pitch) {
    case 'C4':
      return line1Y + lineSpacing; // 아래 첫째 덧줄
    case 'D4':
      return line1Y + lineSpacing * 0.5; // 제1선 아래 칸
    case 'E4':
      return line1Y; // 제1선
    case 'F4':
      return line1Y - lineSpacing * 0.5; // 제1칸
    case 'G4':
      return line1Y - lineSpacing; // 제2선
    case 'A4':
      return line1Y - lineSpacing * 1.5; // 제2칸
    case 'B4':
      return line1Y - lineSpacing * 2.0; // 제3선
    case 'C5':
      return line1Y - lineSpacing * 2.5; // 제3칸
    default:
      return line1Y;
  }
}

/**
 * C4(도) 덧줄(Ledger line) 필요 여부
 */
export function needsLedgerLine(pitch: NotePitch): boolean {
  return pitch === 'C4';
}

/**
 * 타이밍 오차(초)에 따른 판정 반환
 */
export function evaluateTiming(timeDiffSec: number): HitRating {
  const absDiff = Math.abs(timeDiffSec);
  if (absDiff <= 0.18) {
    return 'PERFECT';
  }
  if (absDiff <= 0.38) {
    return 'GOOD';
  }
  return null;
}

/**
 * 완곡 후 점수 및 음표 수 기반 3단계 완주 성취도 평가 (순수 함수)
 * - 3성 (85% 이상): 완벽한 연주 / 피아노 마스터
 * - 2성 (55% 이상 85% 미만): 참 잘했어요 / 멋진 연주
 * - 1성 (55% 미만): 완주 성공 / 다시 도전
 */
export function evaluateSongPerformance(score: number, totalNotes: number): SongEvaluation {
  const maxPossibleScore = totalNotes > 0 ? totalNotes * 100 : 100;
  const clampedScore = Math.max(0, score);
  const scorePercent = Math.min(100, Math.round((clampedScore / maxPossibleScore) * 100));

  if (scorePercent >= 85) {
    return {
      stars: 3,
      title: '완벽한 연주! 피아노 마스터 🌟',
      subtitle: '음표를 하나도 놓치지 않고 멋지게 완주했어요!',
      badgeText: '최고예요! (★★★)',
      imageSrc: '/images/effects/stars_3.png',
      scorePercent,
    };
  }

  if (scorePercent >= 55) {
    return {
      stars: 2,
      title: '멋진 연주! 참 잘했어요 🎵',
      subtitle: '리듬을 아주 잘 탔어요! 조금만 더 하면 마스터예요!',
      badgeText: '잘했어요! (★★☆)',
      imageSrc: '/images/effects/stars_2.png',
      scorePercent,
    };
  }

  return {
    stars: 1,
    title: '끝까지 완주 성공! 대단해요 🌱',
    subtitle: '포기하지 않고 끝까지 마쳤어요! 다시 한번 도전해볼까요?',
    badgeText: '힘내요! (★☆☆)',
    imageSrc: '/images/effects/stars_1.png',
    scorePercent,
  };
}
