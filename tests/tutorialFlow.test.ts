import assert from 'node:assert';
import { TUTORIAL_STEPS, isNoteMatchingStep } from '../src/utils/tutorialData';
import { CORE_PIANO_KEYS, getCoreKeyNoteInfo } from '../src/utils/audioMath';
import { soundEffects } from '../src/utils/soundEffects';

console.log('🧪 [Tier 1: Tutorial Flow & Target Matching Test] 시작...');

// 1. 스텝 5개 불변성 및 SSOT 주파수 검증 (C4~G4, 1~5번 손가락)
assert.strictEqual(TUTORIAL_STEPS.length, 5, '튜토리얼 스텝은 정확히 5개여야 합니다.');

const expectedNotes = ['C4', 'D4', 'E4', 'F4', 'G4'];
const expectedFrequencies = [261.63, 293.66, 329.63, 349.23, 392.00];
const expectedFingers = [1, 2, 3, 4, 5];

TUTORIAL_STEPS.forEach((step, idx) => {
  assert.strictEqual(step.stepIndex, idx, `스텝 인덱스 ${idx} 일치`);
  assert.strictEqual(step.key.fullName, expectedNotes[idx], `음표 ${expectedNotes[idx]} 일치`);
  assert.strictEqual(step.fingerNumber, expectedFingers[idx], `손가락 번호 ${expectedFingers[idx]} 일치`);
  assert.strictEqual(step.key.fullName, CORE_PIANO_KEYS[idx].fullName, 'CORE_PIANO_KEYS와의 SSOT 일치');
  assert.strictEqual(step.key.frequency, expectedFrequencies[idx], `기준 주파수 ${expectedFrequencies[idx]}Hz 일치`);
});
console.log('  ✅ 튜토리얼 5단계 C4~G4, 손가락 번호 및 주파수(SSOT) 불변성 통과');

// 2. getCoreKeyNoteInfo 헬퍼 함수 검증
expectedNotes.forEach((fullName, idx) => {
  const noteInfo = getCoreKeyNoteInfo(fullName);
  assert.ok(noteInfo, `${fullName}에 대한 NoteInfo가 존재해야 함`);
  assert.strictEqual(noteInfo?.fullName, fullName);
  assert.strictEqual(noteInfo?.frequency, expectedFrequencies[idx]);
  assert.strictEqual(noteInfo?.fingerNumber, expectedFingers[idx]);
});
  assert.ok(getCoreKeyNoteInfo('C5') !== null, 'C5는 이제 CORE_PIANO_KEYS에 포함됨');
  assert.strictEqual(getCoreKeyNoteInfo('C6'), null, '범위 밖 음표(C6)는 null 반환');
console.log('  ✅ getCoreKeyNoteInfo SSOT 헬퍼 함수 통과');

// 3. 타깃 매칭 함수 정답/오답 판정 검증
// 0단계: C4 (도)
assert.strictEqual(isNoteMatchingStep('C4', 0), true, '0단계 C4 일치 시 true');
assert.strictEqual(isNoteMatchingStep('D4', 0), false, '0단계 D4 입력 시 false');
assert.strictEqual(isNoteMatchingStep(null, 0), false, 'null 입력 시 false');
assert.strictEqual(isNoteMatchingStep(undefined, 0), false, 'undefined 입력 시 false');

// 4단계: G4 (솔)
assert.strictEqual(isNoteMatchingStep('G4', 4), true, '4단계 G4 일치 시 true');
assert.strictEqual(isNoteMatchingStep('C4', 4), false, '4단계 C4 입력 시 false');

// 범위 밖 스텝 인덱스
assert.strictEqual(isNoteMatchingStep('C4', 5), false, '범위 초과 인덱스는 false');
assert.strictEqual(isNoteMatchingStep('C4', -1), false, '음수 인덱스는 false');
console.log('  ✅ 타깃 음표 순수 판정 로직 경계값 통과');

// 4. SoundEffectsEngine 라이프사이클 및 브라우저 미존재 환경 무중단 검증
assert.doesNotThrow(() => {
  soundEffects.playSuccessDing();
  soundEffects.playFanfare();
  soundEffects.close();
}, 'Node.js 환경에서도 예외 없이 안전하게 무중단(Safe Fallback) 동작해야 함');

// 5. SoundEffectsEngine 볼륨 제어 및 음소거 검증
const initialSfxMuted = soundEffects.getIsMuted();
const toggledSfx = soundEffects.toggleMute();
assert.strictEqual(toggledSfx, !initialSfxMuted, '음소거 토글 성공');
assert.strictEqual(soundEffects.getIsMuted(), toggledSfx);

// 원복
soundEffects.toggleMute();
assert.strictEqual(soundEffects.getIsMuted(), initialSfxMuted);

// 볼륨 클램핑 검증
soundEffects.setVolume(0.7);
assert.strictEqual(soundEffects.getVolume(), 0.7);
soundEffects.setVolume(1.8);
assert.strictEqual(soundEffects.getVolume(), 1.0, '최대 볼륨 1.0 클램핑');
soundEffects.setVolume(-0.5);
assert.strictEqual(soundEffects.getVolume(), 0.0, '최소 볼륨 0.0 클램핑');
soundEffects.setVolume(0.5); // 기본값 복원

console.log('  ✅ SoundEffectsEngine 라이프사이클 및 볼륨/음소거 제어 통과');

console.log('🎉 [Tier 1: Tutorial Flow & Target Matching Test] 모든 테스트 GREEN PASS!');
