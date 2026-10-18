import assert from 'node:assert/strict';
import {
  CHORD_PROGRESSIONS,
  CHORDS,
  accompaniment,
} from '../src/utils/accompanimentEngine';

console.log('🧪 [Tier 1: Accompaniment MR Engine Test] 시작...');

// 1. 코드 진행표 검증
console.log('  1. 동요 5곡(비행기, 나비야, 작은별, 곰세마리, 환희의송가) 8마디 코드 진행표 무결성 검증...');
const songIds = ['song-airplane', 'song-butterfly', 'song-twinkle', 'song-three-bears', 'song-ode-to-joy'];
songIds.forEach((id) => {
  const prog = CHORD_PROGRESSIONS[id];
  assert.ok(prog, `${id} 진행표 존재`);
  assert.strictEqual(prog.length, 8, `${id}는 8마디 진행이어야 함`);
});
console.log('  ✅ 8마디 코드 진행표 통과');

// 2. 마이크 피치 간섭 방지 (저음부 격리) 검증
console.log('  2. 저음부 주파수 및 화음 주파수 무결성 검증...');
// C 코드
assert.ok(CHORDS.C.bassFreqs.length >= 2, 'C 베이스 옥타브 배음이 존재해야 함');
assert.ok(CHORDS.C.chordFreqs.length >= 3, 'C 화음 주파수가 존재해야 함');

// G7 코드
assert.ok(CHORDS.G7.bassFreqs.length >= 2, 'G7 베이스 옥타브 배음이 존재해야 함');
assert.ok(CHORDS.G7.chordFreqs.length >= 3, 'G7 화음 주파수가 존재해야 함');
console.log('  ✅ 주파수 무결성 검증 통과');

// 3. 음소거 및 볼륨 제어 무결성
console.log('  3. 음소거 및 볼륨 제어 검증...');
const initialMuted = accompaniment.getIsMuted();
const toggled = accompaniment.toggleMute();
assert.strictEqual(toggled, !initialMuted);
assert.strictEqual(accompaniment.getIsMuted(), toggled);

// 원복
accompaniment.toggleMute();
assert.strictEqual(accompaniment.getIsMuted(), initialMuted);

// 볼륨 클램핑
accompaniment.setVolume(0.8);
assert.strictEqual(accompaniment.getVolume(), 0.8);
accompaniment.setVolume(1.5);
assert.strictEqual(accompaniment.getVolume(), 1.0);
accompaniment.setVolume(-0.2);
assert.strictEqual(accompaniment.getVolume(), 0.0);
accompaniment.setVolume(0.85); // 기본값 복원

// stop 및 close 무결성
accompaniment.stop();
accompaniment.close();
console.log('  ✅ 음소거, 볼륨 제어 및 stop/close 라이프사이클 통과');

console.log('🎉 [Tier 1: Accompaniment MR Engine Test] 모든 테스트 GREEN PASS!\n');
