import assert from 'node:assert';
import { NoteInfo } from '../src/types/audio.ts';
import { frequencyToNoteInfo } from '../src/utils/audioMath.ts';

console.log('🧪 [Tier 2: Sliding Window Majority Vote Test] 시작...');

const noteC4 = frequencyToNoteInfo(261.63)!;
const noteD4 = frequencyToNoteInfo(293.66)!;
const noteE4 = frequencyToNoteInfo(329.63)!;

/**
 * usePitchDetection.ts의 슬라이딩 윈도우 최빈값 판정 알고리즘을 독립 시뮬레이션
 */
function resolveMajorityVote(
  history: { note: NoteInfo; time: number }[],
  newNote: NoteInfo,
  nowTimestamp: number
): { bestCandidate: NoteInfo | null; updatedHistory: { note: NoteInfo; time: number }[] } {
  // 1. push new note
  const updated = [...history, { note: newNote, time: nowTimestamp }];

  // 2. 160ms 슬라이딩 윈도우 및 최근 6개 보존
  const filtered = updated
    .filter((item) => nowTimestamp - item.time < 160)
    .slice(-6);

  // 3. 최빈값 산출
  const noteCounts: Record<string, { count: number; note: NoteInfo }> = {};
  for (const item of filtered) {
    const key = item.note.fullName;
    if (!noteCounts[key]) {
      noteCounts[key] = { count: 0, note: item.note };
    }
    noteCounts[key].count += 1;
  }

  let bestCandidate: NoteInfo | null = null;
  let maxCount = 0;
  for (const item of Object.values(noteCounts)) {
    if (item.count > maxCount) {
      maxCount = item.count;
      bestCandidate = item.note;
    }
  }

  // 4. 즉시 반응(Fast Attack: 1개) 또는 2회 이상 일치 시 확정
  const isConfirmed = bestCandidate && (maxCount >= 2 || filtered.length === 1);
  return {
    bestCandidate: isConfirmed ? bestCandidate : null,
    updatedHistory: filtered,
  };
}

// Case 1: 첫 번째 타건 (히스토리 1개) -> Fast Attack 즉시 확정
const res1 = resolveMajorityVote([], noteC4, 1000);
assert.ok(res1.bestCandidate !== null, 'First note hit must trigger Fast Attack confirmation');
assert.strictEqual(res1.bestCandidate.fullName, 'C4');
assert.strictEqual(res1.updatedHistory.length, 1);
console.log('  ✅ Case 1: Fast Attack 단일 타건 즉시 확정 통과');

// Case 2: C4 4회 + D4 2회 -> Majority C4 선택
let hist2: { note: NoteInfo; time: number }[] = [];
const notes = [noteC4, noteD4, noteC4, noteC4, noteD4, noteC4];
let lastRes = null;
for (let i = 0; i < notes.length; i++) {
  lastRes = resolveMajorityVote(hist2, notes[i], 1000 + i * 20);
  hist2 = lastRes.updatedHistory;
}
assert.ok(lastRes && lastRes.bestCandidate !== null);
assert.strictEqual(lastRes.bestCandidate.fullName, 'C4', 'Majority vote must pick C4 (4 votes) over D4 (2 votes)');
console.log('  ✅ Case 2: Majority Vote 다수결 (C4 4표 vs D4 2표) 통과');

// Case 3: 160ms 초과 항목 자동 만료 필터링
const oldHistory = [
  { note: noteE4, time: 500 }, // 1000 - 500 = 500ms 전 (> 160ms)
  { note: noteE4, time: 600 }, // 1000 - 600 = 400ms 전 (> 160ms)
];
const res3 = resolveMajorityVote(oldHistory, noteC4, 1000);
assert.strictEqual(res3.updatedHistory.length, 1, 'Expired notes older than 160ms must be pruned');
assert.strictEqual(res3.bestCandidate?.fullName, 'C4');
console.log('  ✅ Case 3: 160ms 슬라이딩 윈도우 만료 가지치기 통과');

// Case 4: 서스테인 만료 (900ms 초과 시 음표 초기화)
function checkSustainTimeout(lastConfirmedTime: number, now: number): boolean {
  return now - lastConfirmedTime > 900;
}
assert.strictEqual(checkSustainTimeout(1000, 1500), false, '500ms elapsed -> should sustain');
assert.strictEqual(checkSustainTimeout(1000, 1950), true, '950ms elapsed -> should release note');
console.log('  ✅ Case 4: 900ms 서스테인 유지 및 자동 해제 검증 통과');

// Case 5: 동음 연타(미-미-미) Onset 분리 시뮬레이션
function simulateNoteTrigger(
  lastConfirmedFullName: string | null,
  newCandidate: NoteInfo,
  isOnset: boolean,
  timeSinceLastOnset: number
): { shouldTrigger: boolean; isRepeated: boolean } {
  const isSameNote = lastConfirmedFullName === newCandidate.fullName;
  const isRepeatedOnset = isSameNote && isOnset && timeSinceLastOnset >= 80;

  if (!isSameNote || isRepeatedOnset) {
    return { shouldTrigger: true, isRepeated: isRepeatedOnset };
  }
  return { shouldTrigger: false, isRepeated: false };
}

// 1st 타건: '미(E4)' 최초 확정
const hit1 = simulateNoteTrigger(null, noteE4, true, 0);
assert.strictEqual(hit1.shouldTrigger, true, '1st note hit must trigger');
assert.strictEqual(hit1.isRepeated, false, '1st note is initial, not repeated');

// 서스테인 지속 중 (동일 음, Onset 없음) -> 무시
const sustainHit = simulateNoteTrigger('E4', noteE4, false, 50);
assert.strictEqual(sustainHit.shouldTrigger, false, 'Sustain without onset must not re-trigger');

// 2nd 타건: '미(E4)' 150ms 후 재타건 (isOnset = true, dt = 150ms >= 80ms)
const hit2 = simulateNoteTrigger('E4', noteE4, true, 150);
assert.strictEqual(hit2.shouldTrigger, true, '2nd repeated note hit must trigger via Onset');
assert.strictEqual(hit2.isRepeated, true, '2nd hit is a repeated onset');

// 3rd 타건: '미(E4)' 다시 120ms 후 재타건
const hit3 = simulateNoteTrigger('E4', noteE4, true, 120);
assert.strictEqual(hit3.shouldTrigger, true, '3rd repeated note hit must trigger via Onset');
assert.strictEqual(hit3.isRepeated, true, '3rd hit is a repeated onset');

// 채터링 방지 쿨다운 (dt = 30ms < 80ms) -> 차단
const chatterHit = simulateNoteTrigger('E4', noteE4, true, 30);
assert.strictEqual(chatterHit.shouldTrigger, false, 'Spike within 80ms cooldown must be blocked (anti-flutter)');

console.log('  ✅ Case 5: 동음 연타(미-미-미) Onset 분리 및 채터링 방지 검증 통과');

console.log('🎉 [Tier 2: Sliding Window Majority Vote Test] 모든 테스트 GREEN PASS!');

