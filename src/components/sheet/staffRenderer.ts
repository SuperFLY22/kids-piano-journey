/**
 * Kids Piano Journey - 오선보, 마디선, 높은음자리표 및 타깃 판정선 렌더러
 */

import { SongMetadata } from '../../types/sheet';

export interface StaffLayout {
  lineSpacing: number;
  line1Y: number;
  staffLines: number[];
}

/**
 * 캔버스 크기에 따른 오선보 기하 레이아웃 계산
 */
export function calculateStaffLayout(height: number): StaffLayout {
  const lineSpacing = Math.max(13, Math.min(16, Math.floor(height * 0.115)));
  const line1Y = Math.floor(height * 0.60);
  const staffLines = [
    line1Y,                   // 1선: E4
    line1Y - lineSpacing,     // 2선: G4
    line1Y - lineSpacing * 2, // 3선: B4
    line1Y - lineSpacing * 3, // 4선: D5
    line1Y - lineSpacing * 4, // 5선: F5
  ];
  return { lineSpacing, line1Y, staffLines };
}

/**
 * 1. 오선보 5선 그리기
 */
export function renderStaffLines(ctx: CanvasRenderingContext2D, width: number, staffLines: number[]): void {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1.5;
  for (const lineY of staffLines) {
    ctx.beginPath();
    ctx.moveTo(0, lineY);
    ctx.lineTo(width, lineY);
    ctx.stroke();
  }
}

/**
 * 2. 높은음자리표(Treble Clef) 기호 렌더링
 */
export function renderTrebleClef(ctx: CanvasRenderingContext2D, line1Y: number, lineSpacing: number): void {
  ctx.fillStyle = '#F1F5F9';
  ctx.font = 'bold 48px serif';
  ctx.fillText('𝄞', 20, line1Y - lineSpacing * 0.5);
}

/**
 * 3. 마디선(Bar lines) 및 마디 번호 렌더링
 */
export function renderBarLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  targetX: number,
  curTime: number,
  effectiveBpm: number,
  song: SongMetadata,
  staffLines: number[],
  pixelsPerSecond: number
): void {
  const secPerBeat = 60 / effectiveBpm;
  const secPerMeasure = secPerBeat * song.beatsPerMeasure;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);

  for (let m = 0; m <= song.totalMeasures; m++) {
    const measureTimeSec = m * secPerMeasure;
    const measureX = targetX + (measureTimeSec - curTime) * pixelsPerSecond;
    if (measureX >= -40 && measureX <= width + 40) {
      ctx.beginPath();
      ctx.moveTo(measureX, staffLines[4]);
      ctx.lineTo(measureX, staffLines[0]);
      ctx.stroke();

      // 마디 번호
      ctx.fillStyle = '#CBD5E1';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText(`M${m + 1}`, measureX + 6, staffLines[4] - 6);
    }
  }
  ctx.setLineDash([]); // 점선 해제
}

/**
 * 4. 판정 타깃선(Target Line) 및 가이드 마커 렌더링
 */
export function renderTargetLine(
  ctx: CanvasRenderingContext2D,
  targetX: number,
  staffLines: number[],
  line1Y: number,
  lineSpacing: number,
  isWaiting: boolean,
  now: number
): void {
  const targetColor = isWaiting ? '#FACC15' : '#38BDF8';
  const pulseBlur = isWaiting ? 16 + Math.sin(now / 150) * 8 : 12;

  ctx.save();
  ctx.shadowColor = targetColor;
  ctx.shadowBlur = pulseBlur;
  ctx.strokeStyle = targetColor;
  ctx.lineWidth = isWaiting ? 4 : 3;
  ctx.beginPath();
  ctx.moveTo(targetX, staffLines[4] - 24);
  ctx.lineTo(targetX, line1Y + lineSpacing * 2);
  ctx.stroke();
  ctx.restore();

  // 타깃선 상단 마커 (삼각형 포인터)
  ctx.fillStyle = targetColor;
  ctx.beginPath();
  ctx.moveTo(targetX - 8, staffLines[4] - 28);
  ctx.lineTo(targetX + 8, staffLines[4] - 28);
  ctx.lineTo(targetX, staffLines[4] - 18);
  ctx.closePath();
  ctx.fill();

  // 대기 중일 때 상단 배지 표출 ("눌러요!")
  if (isWaiting) {
    ctx.save();
    ctx.fillStyle = '#FACC15';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText('눌러요!', targetX, staffLines[4] - 34);
    ctx.restore();
  }
}
