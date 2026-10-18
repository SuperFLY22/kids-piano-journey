/**
 * Kids Piano Journey - 오선보 음표 렌더러
 * 덧줄, 기둥, 네온 글로우, 머리 타원, 계이름 및 손가락 번호 뱃지 드로잉
 */

import { SheetNote } from '../../types/sheet';
import { getNoteStaffY, needsLedgerLine, beatToSeconds } from '../../utils/songData';

export function renderNotes(
  ctx: CanvasRenderingContext2D,
  notes: SheetNote[],
  targetX: number,
  curTime: number,
  effectiveBpm: number,
  pixelsPerSecond: number,
  line1Y: number,
  lineSpacing: number,
  width: number,
  activeTargetNote: SheetNote | null
): void {
  for (const note of notes) {
    const noteTargetSec = beatToSeconds(note.beat, effectiveBpm);
    const x = targetX + (noteTargetSec - curTime) * pixelsPerSecond;
    const y = getNoteStaffY(note.pitch, line1Y, lineSpacing);

    // 화면 밖 클리핑
    if (x < -60 || x > width + 60) continue;

    const isHit = note.hit;
    const isCurrentActive = activeTargetNote?.id === note.id;

    ctx.save();
    if (isHit) {
      ctx.globalAlpha = 0.28; // 이미 친 음표는 연하게
    }

    // C4(도) 덧줄(Ledger line) 렌더링
    if (needsLedgerLine(note.pitch)) {
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x - 22, y);
      ctx.lineTo(x + 22, y);
      ctx.stroke();
    }

    // 음표 기둥(Stem) 렌더링 (온음표가 아닐 때)
    if (note.duration < 4) {
      ctx.strokeStyle = isCurrentActive ? '#FFFFFF' : '#CBD5E1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + 14, y);
      ctx.lineTo(x + 14, y - 44);
      ctx.stroke();
    }

    // 활성 타깃 음표 네온 글로우
    if (isCurrentActive && !isHit) {
      ctx.shadowColor = note.color;
      ctx.shadowBlur = 18;
    }

    // 음표 머리(Note Head)
    ctx.fillStyle = note.color;
    ctx.beginPath();
    ctx.ellipse(x, y, 16, 12, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 음표 머리 외곽선
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // 온음표(duration 4)인 경우 속 빈 중심 타원
    if (note.duration >= 4) {
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.ellipse(x, y, 9, 6, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 음표 머리 내부 텍스트 (계이름)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(note.solfege, x, y - 1);

    // 손가락 번호 뱃지 (음표 상단)
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.fillText(`${note.finger}번`, x, y - 20);

    ctx.restore();
  }
}
