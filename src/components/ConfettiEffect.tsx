import React, { useEffect, useRef } from 'react';

interface ConfettiEffectProps {
  isActive: boolean;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  alpha: number;
  shape: 'circle' | 'star' | 'rect';
}

const COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#EC4899', '#A855F7'];

export const ConfettiEffect: React.FC<ConfettiEffectProps> = ({ isActive, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 맞춤
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    // 파티클 70개 생성
    const particles: Particle[] = Array.from({ length: 70 }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 4;
      return {
        x: width / 2 + (Math.random() - 0.5) * 200,
        y: height / 2 + (Math.random() - 0.5) * 100,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5, // 위로 솟구쳤다가 떨어짐
        size: Math.random() * 8 + 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        alpha: 1,
        shape: Math.random() > 0.4 ? 'star' : 'rect',
      };
    });

    let animationId: number;
    const startTime = performance.now();
    const duration = 1200; // 1.2초 지속

    const render = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, width, height);
        onComplete?.();
        return;
      }

      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // 중력
        p.rotation += p.rotationSpeed;
        p.alpha = Math.max(0, 1 - elapsed / duration);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === 'star') {
          // 별 모양 그리기
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(
              Math.cos(((18 + i * 72) * Math.PI) / 180) * p.size,
              -Math.sin(((18 + i * 72) * Math.PI) / 180) * p.size
            );
            ctx.lineTo(
              Math.cos(((54 + i * 72) * Math.PI) / 180) * (p.size / 2),
              -Math.sin(((54 + i * 72) * Math.PI) / 180) * (p.size / 2)
            );
          }
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        }

        ctx.restore();
      });

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      if (ctx) ctx.clearRect(0, 0, width, height);
    };
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
};
