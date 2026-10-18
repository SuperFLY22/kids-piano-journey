/**
 * Kids Piano Journey - 오선보 적중 파티클 및 팝업 레이팅 텍스트 렌더러
 */

export interface HitParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

export interface FloatingRating {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
}

/**
 * 음표 타건 적중 시 14개 폭죽 파티클 버스트 생성
 */
export function createHitParticles(
  targetX: number,
  noteY: number,
  noteColor: string
): HitParticle[] {
  const particleColors = [noteColor, '#FFFFFF', '#FDE047', '#38BDF8'];
  const particles: HitParticle[] = [];

  for (let i = 0; i < 14; i++) {
    const angle = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5);
    const speed = 2 + Math.random() * 4;
    particles.push({
      x: targetX,
      y: noteY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      size: 3 + Math.random() * 4,
      alpha: 1,
      life: 0.6 + Math.random() * 0.4,
    });
  }

  return particles;
}

/**
 * PERFECT / GOOD 판정 텍스트 팝업 생성
 */
export function createFloatingRating(
  targetX: number,
  noteY: number,
  rating: 'PERFECT' | 'GOOD'
): FloatingRating {
  const ratingText = rating === 'PERFECT' ? '★ PERFECT! ★' : '♪ GOOD! ♪';
  const ratingColor = rating === 'PERFECT' ? '#FACC15' : '#38BDF8';
  return {
    x: targetX,
    y: noteY - 30,
    text: ratingText,
    color: ratingColor,
    alpha: 1,
    life: 0.8,
  };
}

/**
 * 파티클 물리 업데이트 및 렌더링
 */
export function updateAndRenderParticles(
  ctx: CanvasRenderingContext2D,
  particles: HitParticle[],
  dt: number
): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 2.5 * dt; // 중력 가속도
    p.life -= dt;
    p.alpha = Math.max(0, p.life / 0.8);

    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * 부유 레이팅 텍스트 업데이트 및 렌더링
 */
export function updateAndRenderRatings(
  ctx: CanvasRenderingContext2D,
  ratings: FloatingRating[],
  dt: number
): void {
  for (let i = ratings.length - 1; i >= 0; i--) {
    const r = ratings[i];
    r.y -= 35 * dt; // 위로 서서히 부유
    r.life -= dt;
    r.alpha = Math.max(0, r.life / 0.8);

    if (r.life <= 0) {
      ratings.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = r.alpha;
    ctx.fillStyle = r.color;
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = r.color;
    ctx.shadowBlur = 10;
    ctx.fillText(r.text, r.x, r.y);
    ctx.restore();
  }
}
