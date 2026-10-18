import assert from 'node:assert';
import { resolveKeyboardNote } from '../src/hooks/useKeyboardSimulation.ts';

console.log('🧪 [Tier 1: Keyboard Mapping Test] 시작...');

// 1. 물리키 (e.code) 매핑 검증
assert.strictEqual(resolveKeyboardNote('KeyA', ''), 'C4');
assert.strictEqual(resolveKeyboardNote('KeyS', ''), 'D4');
assert.strictEqual(resolveKeyboardNote('KeyD', ''), 'E4');
assert.strictEqual(resolveKeyboardNote('KeyF', ''), 'F4');
assert.strictEqual(resolveKeyboardNote('KeyG', ''), 'G4');
assert.strictEqual(resolveKeyboardNote('KeyH', ''), 'A4');
assert.strictEqual(resolveKeyboardNote('KeyJ', ''), 'B4');
assert.strictEqual(resolveKeyboardNote('KeyK', ''), 'C5');
assert.strictEqual(resolveKeyboardNote('Digit1', ''), 'C4');
assert.strictEqual(resolveKeyboardNote('Digit5', ''), 'G4');
assert.strictEqual(resolveKeyboardNote('Digit8', ''), 'C5');
console.log('  ✅ 물리 키코드(KeyA~K, Digit1~8) 매핑 통과');

// 2. 한글 IME 두벌식 자음/모음 매핑 검증
assert.strictEqual(resolveKeyboardNote('', 'ㅁ'), 'C4');
assert.strictEqual(resolveKeyboardNote('', 'ㄴ'), 'D4');
assert.strictEqual(resolveKeyboardNote('', 'ㅇ'), 'E4');
assert.strictEqual(resolveKeyboardNote('', 'ㄹ'), 'F4');
assert.strictEqual(resolveKeyboardNote('', 'ㅎ'), 'G4');
assert.strictEqual(resolveKeyboardNote('', 'ㅗ'), 'A4');
assert.strictEqual(resolveKeyboardNote('', 'ㅓ'), 'B4');
assert.strictEqual(resolveKeyboardNote('', 'ㅏ'), 'C5');
console.log('  ✅ 한글 두벌식 키(ㅁ, ㄴ, ㅇ, ㄹ, ㅎ, ㅗ, ㅓ, ㅏ) 매핑 통과');

// 3. 무효 키 처리 검증
assert.strictEqual(resolveKeyboardNote('KeyZ', 'z'), null);
assert.strictEqual(resolveKeyboardNote('Enter', 'Enter'), null);
console.log('  ✅ 무효 키 null 반환 통과');

console.log('🎉 [Tier 1: Keyboard Mapping Test] 모든 테스트 GREEN PASS!');
