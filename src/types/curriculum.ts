/**
 * Kids Piano Journey - 10단계 모험 커리큘럼 도메인 모델
 * 기초 C4부터 5손가락 및 옥타브 확장까지의 단계별 학습 모델
 */

import { SongMetadata } from './sheet';

export interface CurriculumLevel {
  level: number;                  // 1 ~ 10
  id: string;                     // 'curriculum-lv-1'
  title: string;                  // 레벨 이름
  subtitle: string;               // 부제목 (예: "1번 손가락과 도 위치 익히기")
  handTip: string;                // 손가락 위치 팁 (모달 안내용)
  playTip: string;                // 연주 팁 (구어체 안내용)
  targetNotes: string[];          // ['C4'], ['C4', 'D4'] 등
  minAccuracyToUnlock: number;    // 기본 70%
  songData: SongMetadata;         // createSong 기반 악보 데이터
}

export interface LevelScoreRecord {
  stars: number;
  accuracy: number;
  completedAt: string;
}

export interface LevelProgress {
  unlockedLevel: number;          // 현재 해금된 최고 레벨 (기본값: 1)
  levelScores: Record<number, LevelScoreRecord>;
}
