/**
 * Kids Piano Journey - 오선보 Canvas 메인 뷰 컴포넌트
 * 60fps HTML5 Canvas 렌더링 컨테이너 및 서브루틴 오케스트레이터
 */

import React, { useEffect, useRef } from 'react';
import { SheetNote, SongMetadata, HitRating, PlaybackSpeed } from '../types/sheet';
import { getNoteStaffY } from '../utils/songData';
import { CountdownOverlay } from './CountdownOverlay';
import {
  calculateStaffLayout,
  renderStaffLines,
  renderTrebleClef,
  renderBarLines,
  renderTargetLine,
} from './sheet/staffRenderer';
import { renderNotes } from './sheet/noteRenderer';
import {
  HitParticle,
  FloatingRating,
  createHitParticles,
  createFloatingRating,
  updateAndRenderParticles,
  updateAndRenderRatings,
} from './sheet/particleRenderer';

interface SheetMusicCanvasProps {
  song: SongMetadata;
  isPlaying: boolean;
  activeTargetNote: SheetNote | null;
  lastHitEvent?: { id: string; rating: HitRating; note: SheetNote } | null;
  className?: string;
  getCurrentTime?: () => number;
  isWaitingForInput?: boolean;
  speed?: PlaybackSpeed;
  countdown?: number | 'GO' | null;
}

export const SheetMusicCanvas: React.FC<SheetMusicCanvasProps> = React.memo(({
  song,
  isPlaying,
  activeTargetNote,
  lastHitEvent,
  className = '',
  getCurrentTime,
  isWaitingForInput = false,
  speed = 1.0,
  countdown = null,
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

  const speedRef = useRef<PlaybackSpeed>(speed);
  speedRef.current = speed;

  const particlesRef = useRef<HitParticle[]>([]);
  const ratingsRef = useRef<FloatingRating[]>([]);
  const lastProcessedHitIdRef = useRef<string | null>(null);

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
    const { line1Y, lineSpacing } = calculateStaffLayout(canvas.height);
    const noteY = getNoteStaffY(lastHitEvent.note.pitch, line1Y, lineSpacing);

    // 파티클 생성
    const newParticles = createHitParticles(targetX, noteY, lastHitEvent.note.color);
    particlesRef.current.push(...newParticles);

    // 판정 텍스트 팝업 (MISS 제외)
    if (lastHitEvent.rating === 'PERFECT' || lastHitEvent.rating === 'GOOD') {
      const newRating = createFloatingRating(targetX, noteY, lastHitEvent.rating);
      ratingsRef.current.push(newRating);
    }
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

      // 1. 투명 배경 클리어
      ctx.clearRect(0, 0, width, height);

      // 2. 오선보 기하 구조 계산
      const { lineSpacing, line1Y, staffLines } = calculateStaffLayout(height);

      // 3. 오선 5선 렌더링
      renderStaffLines(ctx, width, staffLines);

      const curSpeed = speedRef.current || 1.0;
      const effectiveBpm = Math.max(30, Math.round(song.bpm * curSpeed));
      const PIXELS_PER_SECOND = Math.round(150 * curSpeed);

      const targetX = width * TARGET_X_RATIO;
      // 카운트다운 중(rawCurTime < 0)에는 스크롤 0 위치 정지
      const rawCurTime = getCurrentTimeRef.current ? getCurrentTimeRef.current() : 0;
      const curTime = Math.max(0, rawCurTime);

      // 4. 마디선 및 마디 번호 렌더링
      renderBarLines(ctx, width, targetX, curTime, effectiveBpm, song, staffLines, PIXELS_PER_SECOND);

      // 5. 높은음자리표 렌더링
      renderTrebleClef(ctx, line1Y, lineSpacing);

      // 6. 판정 타깃선 및 포인터 렌더링
      renderTargetLine(ctx, targetX, staffLines, line1Y, lineSpacing, isWaitingForInputRef.current, now);

      // 7. 음표 렌더링 (헤드, 기둥, 덧줄, 계이름, 손가락 번호)
      renderNotes(
        ctx,
        notesRef.current,
        targetX,
        curTime,
        effectiveBpm,
        PIXELS_PER_SECOND,
        line1Y,
        lineSpacing,
        width,
        activeTargetNote
      );

      // 8. 파티클 이펙트 & 팝업 텍스트 물리 업데이트 및 렌더링
      updateAndRenderParticles(ctx, particlesRef.current, dt);
      updateAndRenderRatings(ctx, ratingsRef.current, dt);

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [song, speed, activeTargetNote]);

  return (
    <div className={`relative w-full h-32 sm:h-36 md:h-40 rounded-2xl sm:rounded-3xl overflow-hidden border border-white/35 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-2xl bg-white/[0.08] ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
      <CountdownOverlay countdown={countdown} />
    </div>
  );
});
