import assert from 'node:assert/strict';
import { CURRICULUM_LEVELS, getCurriculumLevel } from '../src/utils/curriculumData';
import {
  loadCurriculumProgress,
  saveLevelClear,
  resetCurriculumProgress,
  CURRICULUM_STORAGE_KEY,
} from '../src/utils/curriculumStorage';

// Node/TSX 환경을 위한 Mock localStorage
const mockStorage: Record<string, string> = {};
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      for (const k of Object.keys(mockStorage)) {
        delete mockStorage[k];
      }
    },
    key: (index: number) => Object.keys(mockStorage)[index] || null,
    length: Object.keys(mockStorage).length,
  };
}

console.log('🧪 [Tier 1: Phase 8 Curriculum Invariants Test] 시작...');

// 1. 10개 커리큘럼 레벨 등록 및 스펙 검증
console.log('  1. 10개 커리큘럼 레벨 순서 및 필드 무결성 검증...');
assert.strictEqual(CURRICULUM_LEVELS.length, 10, '커리큘럼은 정확히 10개 레벨이어야 함');

CURRICULUM_LEVELS.forEach((level, idx) => {
  const expectedLevel = idx + 1;
  assert.strictEqual(level.level, expectedLevel, `레벨 번호 불일치: ${level.level} !== ${expectedLevel}`);
  assert.strictEqual(level.id, `curriculum-lv-${expectedLevel}`);
  assert.ok(level.title.length > 0, `Lv.${expectedLevel} title 누락`);
  assert.ok(level.subtitle.length > 0, `Lv.${expectedLevel} subtitle 누락`);
  assert.ok(level.handTip.length > 0, `Lv.${expectedLevel} handTip 누락`);
  assert.ok(level.playTip.length > 0, `Lv.${expectedLevel} playTip 누락`);
  assert.ok(level.targetNotes.length > 0, `Lv.${expectedLevel} targetNotes 누락`);
  assert.strictEqual(level.minAccuracyToUnlock, 70, `Lv.${expectedLevel} 해금 기준은 70%여야 함`);
  assert.ok(level.songData.notes.length > 0, `Lv.${expectedLevel} 악보 음표 누락`);
});
console.log('  ✅ 10개 커리큘럼 레벨 무결성 검증 통과');

// 2. getCurriculumLevel 조회 헬퍼 검증
console.log('  2. getCurriculumLevel(lv) 조회 검증...');
const lv1 = getCurriculumLevel(1);
assert.ok(lv1 !== undefined);
assert.ok(lv1.title.includes('가온 도(C4)'));
assert.strictEqual(lv1.songData.bpm, 65);

const lv10 = getCurriculumLevel(10);
assert.ok(lv10 !== undefined);
assert.ok(lv10.title.includes('졸업식'));
assert.strictEqual(lv10.songData.bpm, 72);

const invalid = getCurriculumLevel(99);
assert.strictEqual(invalid, undefined);
console.log('  ✅ getCurriculumLevel 조회 검증 통과');

// 3. 진행도 초기화 및 저장 로직 검증
console.log('  3. 진행도 로드/저장/해금 룰 검증...');
localStorage.clear();

const initialProgress = loadCurriculumProgress();
assert.strictEqual(initialProgress.unlockedLevel, 1, '초기 해금 레벨은 1이어야 함');
assert.strictEqual(Object.keys(initialProgress.levelScores).length, 0);

// 70% 미만: 다음 레벨 해금 불가
const under70 = saveLevelClear(1, 65, 1);
assert.strictEqual(under70.unlockedLevel, 1, '70% 미만 시 1레벨 유지되어야 함');
assert.strictEqual(under70.levelScores[1].accuracy, 65);

// 70% 이상: 다음 레벨 자동 해금
const pass70 = saveLevelClear(1, 85, 2);
assert.strictEqual(pass70.unlockedLevel, 2, '70% 이상 시 2레벨 해금되어야 함');
assert.strictEqual(pass70.levelScores[1].accuracy, 85);
assert.strictEqual(pass70.levelScores[1].stars, 2);

// 최고 점수/별점 보존
const replayed = saveLevelClear(1, 70, 1);
assert.strictEqual(replayed.levelScores[1].accuracy, 85, '기존 최고 정답률(85%)이 보존되어야 함');
assert.strictEqual(replayed.levelScores[1].stars, 2, '기존 최고 별점(2별)이 보존되어야 함');
assert.strictEqual(replayed.unlockedLevel, 2);

// 10레벨 초과 상한 가드
saveLevelClear(10, 100, 3);
const maxProgress = loadCurriculumProgress();
assert.ok(maxProgress.unlockedLevel <= 10, '최대 해금 레벨은 10이어야 함');

// 리셋
const reset = resetCurriculumProgress();
assert.strictEqual(reset.unlockedLevel, 1);
assert.strictEqual(Object.keys(reset.levelScores).length, 0);
assert.strictEqual(localStorage.getItem(CURRICULUM_STORAGE_KEY), null);
console.log('  ✅ 진행도 로드/저장/해금 룰 검증 통과');

console.log('🎉 [Tier 1: Phase 8 Curriculum Invariants Test] 모든 테스트 GREEN PASS!');
