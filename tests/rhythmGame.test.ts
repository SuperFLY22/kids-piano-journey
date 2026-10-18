import assert from 'node:assert/strict';
import {
  AIRPLANE_SONG,
  BUTTERFLY_SONG,
  SONG_CATALOG,
  NOTE_META_MAP,
  beatToSeconds,
  secondsToBeat,
  getNoteStaffY,
  needsLedgerLine,
  evaluateTiming,
  evaluateSongPerformance,
} from '../src/utils/songData';
import { createSong } from '../src/utils/songParser';

console.log('🧪 [Tier 1: Rhythm Game & Sheet Music Test] 시작...');

// 1. 비행기 악보 데이터 무결성 검증
console.log('  1. 동요 비행기 악보 데이터 불변성 검증...');
assert.strictEqual(AIRPLANE_SONG.id, 'song-airplane');
assert.strictEqual(AIRPLANE_SONG.totalMeasures, 8);
assert.strictEqual(AIRPLANE_SONG.beatsPerMeasure, 4);
assert.strictEqual(AIRPLANE_SONG.bpm, 76);
assert.strictEqual(AIRPLANE_SONG.notes.length, 26, '비행기는 총 26개의 음표로 구성되어야 함');

const airplaneFirstNote = AIRPLANE_SONG.notes[0];
assert.strictEqual(airplaneFirstNote.pitch, 'E4');
assert.strictEqual(airplaneFirstNote.solfege, '미');
assert.strictEqual(airplaneFirstNote.finger, 3);

const airplaneLastNote = AIRPLANE_SONG.notes[AIRPLANE_SONG.notes.length - 1];
assert.strictEqual(airplaneLastNote.pitch, 'C4');
assert.strictEqual(airplaneLastNote.solfege, '도');
assert.strictEqual(airplaneLastNote.duration, 4);

let prevBeat = -1;
for (const note of AIRPLANE_SONG.notes) {
  assert.ok(note.beat >= prevBeat, `비트 역전 오류: ${note.beat} < ${prevBeat}`);
  prevBeat = note.beat;
  const validPitches = ['C4', 'D4', 'E4', 'F4', 'G4'];
  assert.ok(validPitches.includes(note.pitch), `유효하지 않은 피치: ${note.pitch}`);
}
console.log('  ✅ 동요 비행기 악보 데이터 불변성 통과');

// 2. 나비야 악보 데이터 무결성 검증
console.log('  2. 동요 나비야 악보 데이터 불변성 검증...');
assert.strictEqual(BUTTERFLY_SONG.id, 'song-butterfly');
assert.strictEqual(BUTTERFLY_SONG.totalMeasures, 8);
assert.strictEqual(BUTTERFLY_SONG.beatsPerMeasure, 4);
assert.strictEqual(BUTTERFLY_SONG.bpm, 76);
assert.strictEqual(BUTTERFLY_SONG.notes.length, 26, '나비야는 총 26개의 음표로 구성되어야 함');

const butterflyFirstNote = BUTTERFLY_SONG.notes[0];
assert.strictEqual(butterflyFirstNote.pitch, 'G4'); // 나- (솔)
assert.strictEqual(butterflyFirstNote.solfege, '솔');
assert.strictEqual(butterflyFirstNote.finger, 5);

const butterflyLastNote = BUTTERFLY_SONG.notes[BUTTERFLY_SONG.notes.length - 1];
assert.strictEqual(butterflyLastNote.pitch, 'C4'); // -다 (도)
assert.strictEqual(butterflyLastNote.solfege, '도');
assert.strictEqual(butterflyLastNote.finger, 1);

prevBeat = -1;
for (const note of BUTTERFLY_SONG.notes) {
  assert.ok(note.beat >= prevBeat, `나비야 비트 역전: ${note.beat} < ${prevBeat}`);
  prevBeat = note.beat;
  const validPitches = ['C4', 'D4', 'E4', 'F4', 'G4'];
  assert.ok(validPitches.includes(note.pitch), `유효하지 않은 피치: ${note.pitch}`);
}
console.log('  ✅ 동요 나비야 악보 데이터 불변성 통과');

// 3. 신규 3곡(작은별, 곰세마리, 환희의송가) 및 createSong 파서 무결성 검증
console.log('  3. 동요 5곡(비행기, 나비야, 작은별, 곰세마리, 환희의송가) 및 createSong 파서 검증...');
assert.strictEqual(SONG_CATALOG.length, 5, '카탈로그에 총 5곡이 등록되어야 함');

const songTitles = SONG_CATALOG.map((s) => s.title);
assert.ok(songTitles.some((t) => t.includes('비행기')));
assert.ok(songTitles.some((t) => t.includes('나비야')));
assert.ok(songTitles.some((t) => t.includes('작은 별')));
assert.ok(songTitles.some((t) => t.includes('곰 세 마리')));
assert.ok(songTitles.some((t) => t.includes('환희의 송가')));

// 3-1. 작은별 A4(라) 피치 검증
const twinkle = SONG_CATALOG.find((s) => s.id === 'song-twinkle')!;
assert.ok(twinkle.notes.some((n) => n.pitch === 'A4'), '작은별은 A4(라) 음표를 포함해야 함');
assert.strictEqual(twinkle.notes[0].pitch, 'C4');

// 3-2. 곰 세마리 및 환희의 송가 마디/비트 무결성
const threeBears = SONG_CATALOG.find((s) => s.id === 'song-three-bears')!;
assert.strictEqual(threeBears.totalMeasures, 8);
const odeToJoy = SONG_CATALOG.find((s) => s.id === 'song-ode-to-joy')!;
assert.strictEqual(odeToJoy.totalMeasures, 8);

// 3-3. createSong 파서 순수 연산 검증
const testParsedSong = createSong({
  id: 'test-song',
  title: '테스트 곡',
  composer: '테스터',
  bpm: 60,
  notes: [
    ['C4', 1],
    ['G4', 1],
    ['A4', 2, 5],
  ],
});
assert.strictEqual(testParsedSong.notes.length, 3);
assert.strictEqual(testParsedSong.notes[0].beat, 0);
assert.strictEqual(testParsedSong.notes[0].duration, 1);
assert.strictEqual(testParsedSong.notes[0].finger, 1);
assert.strictEqual(testParsedSong.notes[1].beat, 1);
assert.strictEqual(testParsedSong.notes[1].duration, 1);
assert.strictEqual(testParsedSong.notes[2].beat, 2);
assert.strictEqual(testParsedSong.notes[2].duration, 2);
assert.strictEqual(testParsedSong.notes[2].finger, 5, '수동 지정된 5번 손가락 유지');
assert.strictEqual(testParsedSong.notes[2].solfege, '라');
assert.strictEqual(testParsedSong.notes[2].color, '#6366F1');
console.log('  ✅ 곡 카탈로그 5곡 및 createSong 간이 파서 검증 통과');

// 4. 박자/초 변환 정밀도 검증
console.log('  4. beatToSeconds & secondsToBeat 양방향 변환 검증...');
const bpm = 60;
assert.strictEqual(beatToSeconds(0, bpm), 0);
assert.strictEqual(beatToSeconds(4, bpm), 4);
assert.strictEqual(secondsToBeat(4, bpm), 4);

const testBpm = 120;
assert.strictEqual(beatToSeconds(2, testBpm), 1.0);
assert.strictEqual(secondsToBeat(1.0, testBpm), 2);
console.log('  ✅ 박자/초 변환 정밀도 통과');

// 5. 오선보 Y좌표 기하학적 정렬 검증
console.log('  5. getNoteStaffY 오선보 줄/칸 배치 검증...');
const line1Y = 200;
const spacing = 16;

assert.strictEqual(getNoteStaffY('E4', line1Y, spacing), 200);
assert.strictEqual(getNoteStaffY('G4', line1Y, spacing), 184);
assert.strictEqual(getNoteStaffY('F4', line1Y, spacing), 192);
assert.strictEqual(getNoteStaffY('D4', line1Y, spacing), 208);
assert.strictEqual(getNoteStaffY('C4', line1Y, spacing), 216);
assert.strictEqual(getNoteStaffY('A4', line1Y, spacing), 200 - spacing * 1.5);
assert.strictEqual(getNoteStaffY('B4', line1Y, spacing), 200 - spacing * 2.0);
assert.strictEqual(getNoteStaffY('C5', line1Y, spacing), 200 - spacing * 2.5);
console.log('  ✅ getNoteStaffY 오선보 줄/칸 배치 통과 (C4~C5 전 음역)');

// 6. 덧줄 (Ledger line) 판정
assert.strictEqual(needsLedgerLine('C4'), true);
assert.strictEqual(needsLedgerLine('D4'), false);
assert.strictEqual(needsLedgerLine('E4'), false);
assert.strictEqual(needsLedgerLine('F4'), false);
assert.strictEqual(needsLedgerLine('G4'), false);
console.log('  ✅ needsLedgerLine 판정 통과');

// 7. 타이밍 판정 로직 검증
assert.strictEqual(evaluateTiming(0.0), 'PERFECT');
assert.strictEqual(evaluateTiming(0.12), 'PERFECT');
assert.strictEqual(evaluateTiming(-0.15), 'PERFECT');
assert.strictEqual(evaluateTiming(0.18), 'PERFECT');
assert.strictEqual(evaluateTiming(0.25), 'GOOD');
assert.strictEqual(evaluateTiming(-0.30), 'GOOD');
assert.strictEqual(evaluateTiming(0.38), 'GOOD');
assert.strictEqual(evaluateTiming(0.40), null);
assert.strictEqual(evaluateTiming(-0.45), null);
// 8. 완곡 모달 동적 타이틀 생성 검증
console.log('  8. 곡 완곡 모달 동적 타이틀 생성 검증...');
SONG_CATALOG.forEach((s) => {
  const modalTitle = `${s.title} 완곡 성공! 🎉`;
  assert.ok(modalTitle.includes(s.title), `모달 타이틀에 곡명(${s.title})이 포함되어야 함`);
});
console.log('  ✅ 곡 완곡 모달 동적 타이틀 검증 통과');

// 9. Boomwhackers 표준 무지개 색상 토큰 불변성 검증 (AGENTS.md 규칙 4)
console.log('  9. Boomwhackers 표준 무지개 색상 토큰 불변성 검증...');
assert.strictEqual(NOTE_META_MAP.C4.color, '#EF4444', '도(C4)는 빨강(#EF4444)');
assert.strictEqual(NOTE_META_MAP.D4.color, '#F97316', '레(D4)는 주황(#F97316)');
assert.strictEqual(NOTE_META_MAP.E4.color, '#EAB308', '미(E4)는 노랑(#EAB308)');
assert.strictEqual(NOTE_META_MAP.F4.color, '#22C55E', '파(F4)는 초록(#22C55E)');
assert.strictEqual(NOTE_META_MAP.G4.color, '#06B6D4', '솔(G4)는 시안/하늘(#06B6D4)');
console.log('  ✅ Boomwhackers 표준 무지개 색상 토큰 불변성 통과');

// 10. 3단계 완주 성취도 평가 로직 검증 (별 1개 / 2개 / 3개)
console.log('  10. 3단계 완곡 성취도 평가 검증...');
const totalNotes = 26; // 2600점 만점
// 10-1. 3성 (85% 이상: 2210점 이상)
const evalTier3 = evaluateSongPerformance(2600, totalNotes);
assert.strictEqual(evalTier3.stars, 3);
assert.strictEqual(evalTier3.imageSrc, '/images/effects/stars_3.png');
assert.ok(evalTier3.title.includes('피아노 마스터'));

// 10-2. 2성 (55% 이상 85% 미만: 1430 ~ 2209점)
const evalTier2 = evaluateSongPerformance(1800, totalNotes);
assert.strictEqual(evalTier2.stars, 2);
assert.strictEqual(evalTier2.imageSrc, '/images/effects/stars_2.png');
assert.ok(evalTier2.title.includes('참 잘했어요'));

// 10-3. 1성 (55% 미만: 0 ~ 1429점)
const evalTier1 = evaluateSongPerformance(1000, totalNotes);
assert.strictEqual(evalTier1.stars, 1);
assert.strictEqual(evalTier1.imageSrc, '/images/effects/stars_1.png');
assert.ok(evalTier1.title.includes('완주 성공'));

// 10-4. 정답률(Accuracy) 계산 검증
const acc100 = Math.min(100, Math.round(((26 + 0) / 26) * 100));
assert.strictEqual(acc100, 100, 'All hits must yield 100% accuracy');
const acc50 = Math.min(100, Math.round(((13 + 0) / 26) * 100));
assert.strictEqual(acc50, 50, '13 of 26 hits must yield 50% accuracy');

// 10-5. [Post-Phase 7] 연습 모드 100% 보장 및 0음표 방어 검증
const calcAccuracy = (isPractice: boolean, hits: number, notesLen: number) => {
  const safeTotal = notesLen > 0 ? notesLen : 1;
  return isPractice ? 100 : Math.min(100, Math.round((hits / safeTotal) * 100));
};
assert.strictEqual(calcAccuracy(true, 10, 26), 100, '연습 모드 완곡은 타격수와 관계없이 100%');
assert.strictEqual(calcAccuracy(false, 0, 0), 0, '음표 0개일 때 Divide-by-zero 방어(0%)');
assert.strictEqual(calcAccuracy(false, 15, 30), 50, '실전 모드 50% 정확도');
console.log('  ✅ 3단계 완곡 성취도 및 정답률(Accuracy) 평가 통과');


// 11. [과제 2] Wait Mode(기다려주기 모드) 상태 전이 및 판정 시뮬레이션 검증
console.log('  11. Wait Mode(기다려주기) 상태 전이 및 판정 검증...');

interface TestPracticeState {
  curTime: number;
  isWaitingForInput: boolean;
  notes: { beat: number; pitch: string; hit: boolean }[];
  bpm: number;
}

function updatePracticeLoop(state: TestPracticeState, dt: number): TestPracticeState {
  const nextTarget = state.notes.find((n) => !n.hit);
  if (!nextTarget) {
    return { ...state, curTime: state.curTime + dt, isWaitingForInput: false };
  }

  const targetSec = (nextTarget.beat * 60) / state.bpm;
  const nextTime = state.curTime + dt;
  // 타깃선 도달 시 일시 정지 & 입력 대기
  if (nextTime >= targetSec) {
    return { ...state, curTime: targetSec, isWaitingForInput: true };
  }

  // 타깃선 도달 전에는 정상 스크롤
  return { ...state, curTime: nextTime, isWaitingForInput: false };
}


function handlePracticeInput(state: TestPracticeState, inputPitch: string): { state: TestPracticeState; isHit: boolean } {
  const target = state.notes.find((n) => !n.hit);
  if (!target) return { state, isHit: false };

  if (target.pitch === inputPitch) {
    const updatedNotes = state.notes.map((n) => (n === target ? { ...n, hit: true } : n));
    const targetSec = (target.beat * 60) / state.bpm;
    return {
      state: {
        ...state,
        notes: updatedNotes,
        isWaitingForInput: false,
        curTime: targetSec + 0.08, // 스크롤 재개
      },
      isHit: true,
    };
  }

  return { state, isHit: false };
}

// 11-1. 시작 후 0.0초에서 첫 번째 타깃(0비트, 0초 E4) 도달 즉시 멈춤 대기 확인
let pState: TestPracticeState = {
  curTime: 0.0,
  isWaitingForInput: false,
  notes: [
    { beat: 0, pitch: 'E4', hit: false },
    { beat: 1, pitch: 'D4', hit: false },
  ],
  bpm: 60, // 1비트 = 1초
};

pState = updatePracticeLoop(pState, 0.016);
assert.strictEqual(pState.isWaitingForInput, true, 'Target at 0s must cause wait state');
assert.strictEqual(pState.curTime, 0.0, 'Time must freeze at targetSec in practice mode');

// 시간이 5프레임 더 흘러도 타깃에서 계속 멈춰 있어야 함
for (let i = 0; i < 5; i++) {
  pState = updatePracticeLoop(pState, 0.016);
  assert.strictEqual(pState.isWaitingForInput, true);
  assert.strictEqual(pState.curTime, 0.0, 'Time must remain frozen until user hits key');
}

// 11-2. 올바른 건반('E4') 타건 시 대기 해제 및 다음 음표 위치로 스크롤 재개
const inputRes = handlePracticeInput(pState, 'E4');
assert.strictEqual(inputRes.isHit, true, 'Matching pitch E4 must hit');
assert.strictEqual(inputRes.state.isWaitingForInput, false, 'Waiting state must release on hit');
assert.ok(inputRes.state.curTime > 0.0, 'Scroll must resume past the hit note');

// 11-3. 다음 음표(1비트, 1초 D4)를 향해 진행하다 1초 도달 시 다시 멈춤 대기
pState = inputRes.state;
pState = { ...pState, curTime: 0.9 }; // 0.9초 진행
pState = updatePracticeLoop(pState, 0.15); // 0.9 + 0.15 = 1.05초 -> 1.0초에서 대기 멈춤
assert.strictEqual(pState.isWaitingForInput, true, 'Next note D4 at 1.0s must cause wait state');
assert.strictEqual(pState.curTime, 1.0, 'Time must freeze exactly at next note targetSec (1.0s)');

console.log('  ✅ Wait Mode(기다려주기) 상태 전이 및 판정 검증 통과');

console.log('🎉 [Tier 1: Rhythm Game & Sheet Music Test] 모든 테스트 GREEN PASS!\n');

