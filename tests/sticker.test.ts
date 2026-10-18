/**
 * Kids Piano Journey - Phase 9 Sticker Album Invariants Test
 * 15종 스티커 카탈로그 무결성, 별 2개 이상 해금 조건, 중복 해금 방어, 영속화 검증
 */

import assert from 'node:assert/strict';
import {
  STICKER_CATALOG,
  STICKER_STORAGE_KEY,
  loadUnlockedStickers,
  saveUnlockedStickers,
  isStickerUnlocked,
  checkAndUnlockLevelSticker,
  checkAndUnlockSongSticker,
  resetStickers,
} from '../src/utils/stickerStorage';

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

console.log('🧪 [Tier 1: Phase 9 Sticker Album Invariants Test] 시작...');

// 1. 15종 스티커 카탈로그 무결성 검증
console.log('  1. 15종 스티커 카탈로그(10개 커리큘럼 + 5곡 동요) 메타데이터 무결성 검증...');
assert.strictEqual(STICKER_CATALOG.length, 15, '스티커 카탈로그는 정확히 15종이어야 함');

const levelStickers = STICKER_CATALOG.filter((s) => s.category === 'curriculum');
const songStickers = STICKER_CATALOG.filter((s) => s.category === 'song');
assert.strictEqual(levelStickers.length, 10, '커리큘럼 레벨 스티커는 10종이어야 함');
assert.strictEqual(songStickers.length, 5, '동요 스티커는 5종이어야 함');

const idSet = new Set<string>();
STICKER_CATALOG.forEach((sticker) => {
  assert.ok(!idSet.has(sticker.id), `중복 스티커 ID 발견: ${sticker.id}`);
  idSet.add(sticker.id);
  assert.ok(sticker.name.length > 0, `스티커 이름 누락: ${sticker.id}`);
  assert.ok(sticker.emoji.length > 0, `스티커 이모지 누락: ${sticker.id}`);
  assert.ok(sticker.description.length > 0, `스티커 설명 누락: ${sticker.id}`);
  assert.ok(sticker.unlockCondition.length > 0, `스티커 획득조건 누락: ${sticker.id}`);
  assert.ok(sticker.themeColor.startsWith('#'), `유효한 색상 코드 누락: ${sticker.id}`);
});
console.log('  ✅ 15종 스티커 카탈로그 무결성 검증 통과');

// 2. 초기 로드 및 빈 상태 통계 검증
console.log('  2. 초기 로드 및 영속화 검증...');
localStorage.clear();
const initialUnlocked = loadUnlockedStickers();
assert.strictEqual(initialUnlocked.length, 0, '초기 해금 스티커는 0개여야 함');
assert.strictEqual(isStickerUnlocked('sticker-lv1'), false);
console.log('  ✅ 초기 상태 검증 통과');

// 3. 레벨 스티커 해금 규칙 (별 2개 이상) 및 중복 방어 검증
console.log('  3. 커리큘럼 레벨 스티커 해금 및 중복 방어 검증...');
// 3-1: 별 1개 클리어 -> 해금 실패 (null)
const failUnlock = checkAndUnlockLevelSticker(1, 1);
assert.strictEqual(failUnlock, null, '별 1개 달성 시 스티커가 해금되지 않아야 함');
assert.strictEqual(loadUnlockedStickers().length, 0);

// 3-2: 별 2개 클리어 -> 최초 해금 성공
const successUnlock1 = checkAndUnlockLevelSticker(1, 2);
assert.ok(successUnlock1 !== null, '별 2개 달성 시 스티커가 최초 해금되어야 함');
assert.strictEqual(successUnlock1.id, 'sticker-lv1');
assert.strictEqual(successUnlock1.name, '빨간 사과');
assert.strictEqual(loadUnlockedStickers().length, 1);
assert.strictEqual(isStickerUnlocked('sticker-lv1'), true);

// 3-3: 동일 레벨 재클리어 (별 3개) -> 이미 해금되었으므로 null 반환 (중복 축하 팝업 방지)
const duplicateUnlock = checkAndUnlockLevelSticker(1, 3);
assert.strictEqual(duplicateUnlock, null, '이미 해금된 레벨 스티커는 중복 해금(알림)되지 않아야 함');
assert.strictEqual(loadUnlockedStickers().length, 1);

// 3-4: 10레벨 졸업식 스티커 해금
const lv10Unlock = checkAndUnlockLevelSticker(10, 3);
assert.ok(lv10Unlock !== null);
assert.strictEqual(lv10Unlock.id, 'sticker-lv10');
assert.strictEqual(lv10Unlock.name, '황금 트로피');
assert.strictEqual(loadUnlockedStickers().length, 2);
console.log('  ✅ 커리큘럼 레벨 스티커 해금 및 중복 방어 통과');

// 4. 동요 스티커 해금 규칙 및 중복 방어 검증
console.log('  4. 동요 스티커 해금 및 중복 방어 검증...');
// 4-1: 작은 별 별 1개 -> 미해금
const songFail = checkAndUnlockSongSticker('song-twinkle', 1);
assert.strictEqual(songFail, null, '별 1개 달성 시 동요 스티커가 해금되지 않아야 함');

// 4-2: 작은 별 별 3개 -> 최초 해금 성공
const songSuccess = checkAndUnlockSongSticker('song-twinkle', 3);
assert.ok(songSuccess !== null, '별 2개 이상 달성 시 동요 스티커가 최초 해금되어야 함');
assert.strictEqual(songSuccess.id, 'sticker-song-twinkle');
assert.strictEqual(songSuccess.name, '반짝이는 별');
assert.strictEqual(loadUnlockedStickers().length, 3);
assert.strictEqual(isStickerUnlocked('sticker-song-twinkle'), true);

// 4-3: 중복 방어
const songDup = checkAndUnlockSongSticker('song-twinkle', 2);
assert.strictEqual(songDup, null, '이미 해금된 동요 스티커는 중복 해금되지 않아야 함');
assert.strictEqual(loadUnlockedStickers().length, 3);
console.log('  ✅ 동요 스티커 해금 및 중복 방어 통과');

// 5. 진행도 리셋 검증
console.log('  5. 스티커북 진행도 리셋 검증...');
resetStickers();
const afterReset = loadUnlockedStickers();
assert.strictEqual(afterReset.length, 0);
assert.strictEqual(isStickerUnlocked('sticker-lv1'), false);
console.log('  ✅ 스티커북 진행도 리셋 검증 통과');

console.log('🎉 [Phase 9 Sticker Album Invariants Test] 모든 검증 통과! (100% GREEN)');
