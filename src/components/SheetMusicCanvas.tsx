import React, { useEffect, useRef } from 'react';
import { SheetNote, SongMetadata, HitRating } from '../types/sheet';
import { getNoteStaffY, needsLedgerLine, beatToSeconds } from '../utils/songData';

interface HitParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

interface FloatingRating {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
}

interface SheetMusicCanvasProps {
  song: SongMetadata;
  isPlaying: boolean;
  activeTargetNote: SheetNote | null;
  lastHitEvent?: { id: string; rating: HitRating; note: SheetNote } | null;
  className?: string;
  getCurrentTime?: () => number;
  isWaitingForInput?: boolean;
}

export const SheetMusicCanvas: React.FC<SheetMusicCanvasProps> = React.memo(({
  song,
  isPlaying,
  activeTargetNote,
  lastHitEvent,
  className = '',
  getCurrentTime,
  isWaitingForInput = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isWaitingForInputRef = useRef<boolean>(isWaitingForInput);
  isWaitingForInputRef.current = isWaitingForInput;

  // 시간 및 인터랙션 ref (60fps 렌더링에서 React 리렌더링 차단)
  const getCurrentTimeRef = useRef(getCurrentTime);
  getCurrentTimeRef.current = getCurrentTime;

  const notesRef = useRef<SheetNote[]>(song.notes);
  notesRef.current = song.notes;

  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;

  const particlesRef = useRef<HitParticle[]>([]);
  const ratingsRef = useRef<FloatingRating[]>([]);
  const lastProcessedHitIdRef = useRef<string | null>(null);

  // 타깃선 및 스크롤 속도 상수
  const PIXELS_PER_SECOND = 150; // 초당 150픽셀 좌측 이동
  const TARGET_X_RATIO = 0.22; // 캔버스 너비의 22% 지점

  // 적중 이벤트 수신 시 파티클 및 텍스트 팝업 추가
  useEffect(() => {
    if (!lastHitEvent || lastProcessedHitIdRef.current === lastHitEvent.id) {
      return;
    }
    lastProcessedHitIdRef.current = lastHitEvent.id;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const targetX = canvas.width * TARGET_X_RATIO;
    const lineSpacing = 16;
    const line1Y = canvas.height * 0.58;
    const noteY = getNoteStaffY(lastHitEvent.note.pitch, line1Y, lineSpacing);

    // 파티클 생성
    const particleColors = [lastHitEvent.note.color, '#FFFFFF', '#FDE047', '#38BDF8'];
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5);
      const speed = 2 + Math.random() * 4;
      particlesRef.current.push({
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

    // 판정 텍스트 팝업
    const ratingText = lastHitEvent.rating === 'PERFECT' ? '★ PERFECT! ★' : '♪ GOOD! ♪';
    const ratingColor = lastHitEvent.rating === 'PERFECT' ? '#FACC15' : '#38BDF8';
    ratingsRef.current.push({
      x: targetX,
      y: noteY - 30,
      text: ratingText,
      color: ratingColor,
      alpha: 1,
      life: 0.8,
    });
  }, [lastHitEvent]);

  // Canvas 60fps 애니메이션 루프
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.1);
      lastTimestamp = now;

      // 캔버스 크기 동기화 (DPR 대응)
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const displayWidth = Math.floor(rect.width);
      const displayHeight = Math.floor(rect.height);

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const width = displayWidth;
      const height = displayHeight;

      // 1. 배경 클리어 (배경 일러스트가 100% 온전히 투과되도록 투명 클리어 유지)
      ctx.clearRect(0, 0, width, height);

      // 2. 오선보 기하 구조 정의 (태블릿 패드 높이에 맞춘 동적 황금비 스케일링)
      const lineSpacing = Math.max(13, Math.min(16, Math.floor(height * 0.115)));
      // 1선(E4)을 화면 중앙 약간 아래에 배치하여 C4 덧줄 및 상단 5선까지 여유 공간 확보
      const line1Y = Math.floor(height * 0.60);
      const staffLines = [
        line1Y, // 1선: E4
        line1Y - lineSpacing, // 2선: G4
        line1Y - lineSpacing * 2, // 3선: B4
        line1Y - lineSpacing * 3, // 4선: D5
        line1Y - lineSpacing * 4, // 5선: F5
      ];

      // 오선보 5선 그리기 (투명 배경 위에서 빛나는 글래스 라인)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.5;
      for (const lineY of staffLines) {
        ctx.beginPath();
        ctx.moveTo(0, lineY);
        ctx.lineTo(width, lineY);
        ctx.stroke();
      }

      const targetX = width * TARGET_X_RATIO;
      const curTime = getCurrentTimeRef.current ? getCurrentTimeRef.current() : 0;

      // 3. 마디선(Bar lines) 그리기
      const secPerBeat = 60 / song.bpm;
      const secPerMeasure = secPerBeat * song.beatsPerMeasure;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      for (let m = 0; m <= song.totalMeasures; m++) {
        const measureTimeSec = m * secPerMeasure;
        const measureX = targetX + (measureTimeSec - curTime) * PIXELS_PER_SECOND;
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

      // 4. 높은음자리표(Treble Clef) 기호 렌더링 (좌측 고정 안내)
      ctx.fillStyle = '#F1F5F9';
      ctx.font = 'bold 48px serif';
      ctx.fillText('𝄞', 20, line1Y - lineSpacing * 0.5);

      // 5. 판정 타깃선(Target Line) 렌더링
      const isWaiting = isWaitingForInputRef.current;
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


      // 6. 음표 렌더링
      const notes = notesRef.current;
      for (const note of notes) {
        const noteTargetSec = beatToSeconds(note.beat, song.bpm);
        const x = targetX + (noteTargetSec - curTime) * PIXELS_PER_SECOND;
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
        ctx.strokeStyle = isCurrentActive ? '#FFFFFF' : '#FFFFFF';
        ctx.stroke();

        // 온음표(duration 4)인 경우 속 빈 중심 타원
        if (note.duration >= 4) {
          ctx.fillStyle = '#1E293B';
          ctx.beginPath();
          ctx.ellipse(x, y, 9, 6, -0.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // 음표 머리 내부 텍스트 (계이름 + 손가락 번호)
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

      // 7. 파티클 이펙트 업데이트 & 렌더링
      const particles = particlesRef.current;
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

      // 8. 팝업 레이팅 텍스트 업데이트 & 렌더링
      const ratings = ratingsRef.current;
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

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [song]);

  return (
    <div className={`relative w-full h-32 sm:h-36 md:h-40 rounded-2xl sm:rounded-3xl overflow-hidden border border-white/35 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-2xl bg-white/[0.08] ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
});
