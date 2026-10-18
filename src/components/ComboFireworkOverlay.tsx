import React, { useEffect, useState, useRef } from 'react';

interface ComboFireworkOverlayProps {
  combo: number;
}

export const ComboFireworkOverlay: React.FC<ComboFireworkOverlayProps> = ({ combo }) => {
  const [visible, setVisible] = useState(false);
  const [comboText, setComboText] = useState('');
  const lastTriggeredMilestoneRef = useRef<number>(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 콤보가 리셋된 경우 즉시 팝업 제거
    if (combo < 3) {
      lastTriggeredMilestoneRef.current = 0;
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      setVisible(false);
      return;
    }

    // 3, 6, 9, 12, 15... 등 3의 배수 또는 5, 10 마일스톤에 도달했을 때만 1회 트리거
    const isMilestone =
      (combo % 3 === 0 || combo === 5 || combo === 10) &&
      combo !== lastTriggeredMilestoneRef.current;

    if (isMilestone) {
      lastTriggeredMilestoneRef.current = combo;
      setComboText(`${combo}연타 성공! 🔥`);
      setVisible(true);

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      // 1.2초 후 악보 시야 방해 없이 반드시 자동 소멸
      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
        hideTimerRef.current = null;
      }, 1200);
    }
  }, [combo]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  if (!visible) return null;

  return (
    // 악보(중앙)를 가리지 않도록 상단 우측 헤더 인접 위치에 단정한 콤보 배지만 표시 (폭죽 이미지 제거로 시야 집중 확보)
    <div className="fixed top-16 right-4 sm:top-20 sm:right-8 pointer-events-none z-40 flex items-center">
      {/* 콤보 텍스트 배지 (시각 방해 요소인 대형 회전 폭죽 이미지 배제) */}
      <div className="bg-slate-950/90 border border-amber-400/80 px-3.5 py-1.5 rounded-2xl shadow-xl backdrop-blur-md">
        <span className="text-sm sm:text-base font-black text-amber-300 tracking-wider whitespace-nowrap drop-shadow-md">
          {comboText}
        </span>
      </div>
    </div>
  );
};

