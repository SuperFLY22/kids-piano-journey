import assert from 'node:assert';
import {
  frequencyToMidi,
  frequencyToNoteInfo,
  calculateRmsAndDb,
  detectPianoPitch,
  getCentsDeviation,
  correctPianoHarmonics,
  detectNoteOnset,
} from '../src/utils/audioMath.ts';

console.log('🧪 [Tier 1: audioMath Baseline Test] 시작...');

// 1. frequencyToMidi
assert.strictEqual(frequencyToMidi(440.0), 69, 'A4 must be MIDI 69');
assert.strictEqual(frequencyToMidi(261.63), 60, 'C4 must be MIDI 60');
console.log('  ✅ frequencyToMidi 통과');

// 2. frequencyToNoteInfo - C4, G4, C5 (높은 도)
const noteC4 = frequencyToNoteInfo(261.63);
assert.ok(noteC4, 'C4 note info should exist');
assert.strictEqual(noteC4.fullName, 'C4');
assert.strictEqual(noteC4.koreanName, '도');
assert.strictEqual(noteC4.color, '#EF4444');
assert.strictEqual(noteC4.fingerNumber, 1);

const noteG4 = frequencyToNoteInfo(392.00);
assert.ok(noteG4, 'G4 note info should exist');
assert.strictEqual(noteG4.fullName, 'G4');
assert.strictEqual(noteG4.koreanName, '솔');
assert.strictEqual(noteG4.color, '#06B6D4');
assert.strictEqual(noteG4.fingerNumber, 5);

const noteC5 = frequencyToNoteInfo(523.25);
assert.ok(noteC5, 'C5 note info should exist');
assert.strictEqual(noteC5.fullName, 'C5');
assert.strictEqual(noteC5.koreanName, '도');
assert.strictEqual(noteC5.octave, 5);
console.log('  ✅ frequencyToNoteInfo C4/G4/C5 통과');

// 3. frequencyToNoteInfo - 범위 초과
assert.strictEqual(frequencyToNoteInfo(50), null, '50Hz should be out of range');
assert.strictEqual(frequencyToNoteInfo(5000), null, '5000Hz should be out of range');
console.log('  ✅ frequencyToNoteInfo 범위 초과 통과');

// 4. calculateRmsAndDb - 무음
const zeros = new Float32Array(2048);
const silentResult = calculateRmsAndDb(zeros);
assert.strictEqual(silentResult.db, -100, 'Silent buffer must return -100dB');
assert.strictEqual(silentResult.rms, 0, 'Silent buffer rms must be 0');
console.log('  ✅ calculateRmsAndDb 무음 통과');

// 5. detectPianoPitch - C4 순음 (261.63Hz @ 48kHz)
const sampleRate = 48000;
const bufferSize = 2048;
const c4Buffer = new Float32Array(bufferSize);
for (let i = 0; i < bufferSize; i++) {
  c4Buffer[i] = Math.sin((2 * Math.PI * 261.63 * i) / sampleRate);
}
const detectedC4 = detectPianoPitch(c4Buffer, sampleRate, 0.15);
assert.ok(detectedC4 !== null, 'C4 pitch should be detected');
assert.ok(detectedC4 >= 255 && detectedC4 <= 270, `Detected C4 frequency (${detectedC4}) should be ~261.6Hz`);
console.log(`  ✅ detectPianoPitch C4 순음 감지 통과 (${detectedC4?.toFixed(1)}Hz)`);

// 6. detectPianoPitch - Min-Tau Guard: 19kHz 초고주파 노이즈 차단 검증
const ultraBuffer = new Float32Array(bufferSize);
for (let i = 0; i < bufferSize; i++) {
  ultraBuffer[i] = Math.sin((2 * Math.PI * 19000 * i) / sampleRate);
}
const detectedUltra = detectPianoPitch(ultraBuffer, sampleRate, 0.15);
// Min-Tau(sampleRate / 2200)에 의해 19,000Hz 같은 초고주파는 2,200Hz 이하로 안전하게 차단되어야 함
assert.ok(detectedUltra === null || detectedUltra <= 2200, `Min-Tau must block 19kHz; got ${detectedUltra}`);
console.log(`  ✅ detectPianoPitch Min-Tau Guard 통과 (19kHz 원천 차단 확인: ${detectedUltra?.toFixed(1) ?? 'null'})`);

// 7. getCentsDeviation - 완벽 일치
const perfectCents = getCentsDeviation(440.0, 69);
assert.strictEqual(perfectCents, 0, 'A4 with MIDI 69 must have 0 cents deviation');
console.log('  ✅ getCentsDeviation 통과');

// 8. correctPianoHarmonics - C5가 C4로 왜곡되지 않고 정상 주파수 보존
const c5Freq = 523.25;
assert.strictEqual(correctPianoHarmonics(c5Freq), 523.25, 'C5 (523.25Hz) must NOT be halved to C4');
const uncorrected = correctPianoHarmonics(300.0);
assert.strictEqual(uncorrected, 300.0, 'In-range frequency (300Hz) must remain unchanged');
console.log('  ✅ correctPianoHarmonics C5 보존 통과');

// 9. frequencyToNoteInfo with calibrationProfile - 조율 편차 피아노 보정 검증
const mockCustomProfile = {
  notes: {
    'C4': 264.0, // 약간 높은 피아노
    'D4': 296.0,
    'E4': 332.0,
  },
  baseA4: 443.0,
};
const calibratedNote = frequencyToNoteInfo(264.2, mockCustomProfile);
assert.ok(calibratedNote, 'Calibrated note should be detected');
assert.strictEqual(calibratedNote.fullName, 'C4', '264.2Hz should map to C4 under custom calibration profile');
assert.strictEqual(calibratedNote.koreanName, '도');
console.log('  ✅ 8음 캘리브레이션 프로파일 맞춤 매핑 통과');

// 10. 3구간(C3: 130.81Hz) 및 6구간(C6: 1046.5Hz) 음역대 인식 검증
const noteC3 = frequencyToNoteInfo(130.8, mockCustomProfile);
assert.ok(noteC3, 'C3 should be detected');
assert.strictEqual(noteC3.fullName, 'C3', '130.8Hz should map to C3');
assert.strictEqual(noteC3.octave, 3);
console.log('  ✅ 3구간(C3) 저음부 인식 검증 통과');

const noteC6 = frequencyToNoteInfo(1046.5, mockCustomProfile);
assert.ok(noteC6, 'C6 should be detected');
assert.strictEqual(noteC6.fullName, 'C6', '1046.5Hz should map to C6');
assert.strictEqual(noteC6.octave, 6);
console.log('  ✅ 6구간(C6) 고음부 인식 검증 통과');

// 11. detectNoteOnset - 동음 연타 에너지 급상승(Attack Spike) 검증
console.log('  [과제 1] detectNoteOnset 단위 테스트 실행...');

// 11-1. 무음 / 극저음 노이즈에서는 Onset 미발생
const silentHistory = [
  { rms: 0.0001, db: -80, time: 1000 },
  { rms: 0.0001, db: -80, time: 1020 },
];
assert.strictEqual(
  detectNoteOnset(0.0002, -75, silentHistory, 1040),
  false,
  'Silent/noise floor must not trigger onset'
);

// 11-2. 서스테인 감쇠 상태(울림 지속: -30dB -> -33dB)에서는 Onset 미발생
const sustainHistory = [
  { rms: 0.03, db: -30, time: 1000 },
  { rms: 0.025, db: -32, time: 1020 },
  { rms: 0.022, db: -33, time: 1035 },
];
assert.strictEqual(
  detectNoteOnset(0.020, -34, sustainHistory, 1050),
  false,
  'Decaying sustain should not trigger onset'
);

// 11-3. 35ms 전(-35dB) 대비 타건 급상승(-27dB, +8dB 점프) -> Onset 감지 성공!
const attackSpikeHistory = [
  { rms: 0.02, db: -34, time: 1000 },
  { rms: 0.018, db: -35, time: 1015 }, // 35ms 전 최저점 -35dB
];
assert.strictEqual(
  detectNoteOnset(0.045, -27, attackSpikeHistory, 1050),
  true,
  'Sharp energy spike (+8dB in 35ms) must trigger onset'
);

// 11-4. 경계값: minRiseDb = 4.5dB 기준 4.0dB 상승(미달) vs 5.0dB 상승(충족)
const borderHistory = [
  { rms: 0.02, db: -30, time: 1015 },
];
assert.strictEqual(
  detectNoteOnset(0.025, -26.0, borderHistory, 1050, { minRiseDb: 4.5 }),
  false,
  'Rise of 4.0dB should not trigger onset when minRiseDb is 4.5dB'
);
assert.strictEqual(
  detectNoteOnset(0.030, -25.0, borderHistory, 1050, { minRiseDb: 4.5 }),
  true,
  'Rise of 5.0dB should trigger onset when minRiseDb is 4.5dB'
);

// 11-5. 윈도우(50ms)를 벗어난 너무 오래된 이력(100ms 전)만 있는 경우 무시
const expiredHistory = [
  { rms: 0.01, db: -40, time: 900 }, // 150ms 전
];
assert.strictEqual(
  detectNoteOnset(0.05, -20, expiredHistory, 1050, { timeWindowMs: 50 }),
  false,
  'Expired history beyond time window must not be considered'
);

console.log('  ✅ detectNoteOnset 동음 연타 Attack Spike 감증 통과');

console.log('🎉 [Tier 1: audioMath Baseline Test] 모든 테스트 GREEN PASS!');

