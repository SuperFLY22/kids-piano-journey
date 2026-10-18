import React from 'react';
import { CORE_PIANO_KEYS } from '../utils/audioMath';

interface HandGuideGraphicProps {
  activeFinger: number; // 1 ~ 5 (1: 엄지, 2: 검지, 3: 중지, 4: 약지, 5: 새끼)
}

export const HandGuideGraphic: React.FC<HandGuideGraphicProps> = ({ activeFinger }) => {
  // 3D 만화 장갑 핸드 마스코트(1160x1266, aspect 300x327) 기준 손가락 끝 좌표
  // 엄지(1, 왼쪽) -> 검지(2) -> 중지(3) -> 약지(4) -> 새끼(5, 오른쪽)
  const fingerPositions = [
    { finger: 1, name: '엄지', cx: 42, cy: 164, key: CORE_PIANO_KEYS[0] },
    { finger: 2, name: '검지', cx: 96, cy: 52, key: CORE_PIANO_KEYS[1] },
    { finger: 3, name: '중지', cx: 153, cy: 26, key: CORE_PIANO_KEYS[2] },
    { finger: 4, name: '약지', cx: 213, cy: 52, key: CORE_PIANO_KEYS[3] },
    { finger: 5, name: '새끼', cx: 261, cy: 98, key: CORE_PIANO_KEYS[4] },
  ];

  return (
    <div className="flex flex-col items-center justify-center p-2.5 bg-white/[0.10] backdrop-blur-2xl rounded-2xl border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.15)] relative overflow-hidden select-none">
      {/* 상단 뱃지 헤더 */}
      <div className="flex items-center justify-between w-full px-2 mb-1 z-10">
        <span className="text-[11px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          오른손 손가락 자리
        </span>
        <span className="text-[10px] text-cyan-200 font-bold bg-cyan-950/70 px-2 py-0.5 rounded-full border border-cyan-700/60 shadow-inner">
          가온 C (도~솔)
        </span>
      </div>

      {/* 3D 핸드 그래픽 & 인터랙티브 손가락 번호 오버레이 (브라우저 & APK 100% 호환 구조) */}
      <div className="relative w-full max-w-[260px] aspect-[1160/1266] flex items-center justify-center">
        {/* 1. 고화질 3D 만화 장갑 마스코트 이미지 (HTML img 태그로 브라우저/모바일 네이티브 캐싱) */}
        <img
          src="/images/characters/hand_guide_mascot.png"
          alt="오른손 피아노 손가락 가이드"
          className="w-full h-full object-contain pointer-events-none select-none drop-shadow-2xl"
          loading="eager"
        />

        {/* 2. 손가락 끝 실시간 인터랙티브 SVG 오버레이 */}
        <svg
          viewBox="0 0 300 327"
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
        >
          <defs>
            <filter id="handGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {fingerPositions.map((pos) => {
            const isTarget = pos.finger === activeFinger;
            const { color, koreanName } = pos.key;

            return (
              <g key={pos.finger} className="transition-all duration-300">
                {/* 타깃 손가락 활성화 펄스 링 */}
                {isTarget && (
                  <>
                    <circle
                      cx={pos.cx}
                      cy={pos.cy}
                      r="22"
                      fill="none"
                      stroke={color}
                      strokeWidth="3.5"
                      className="animate-ping opacity-80"
                    />
                    <circle
                      cx={pos.cx}
                      cy={pos.cy}
                      r="19"
                      fill={`${color}40`}
                      stroke={color}
                      strokeWidth="2.5"
                      filter="url(#handGlow)"
                    />
                    {/* 상단 타깃 포인터 화살표 */}
                    <g className="animate-bounce">
                      <polygon
                        points={`${pos.cx},${pos.cy - 22} ${pos.cx - 4},${pos.cy - 28} ${pos.cx + 4},${pos.cy - 28}`}
                        fill={color}
                      />
                    </g>
                  </>
                )}

                {/* 손가락 끝 번호 원형 뱃지 */}
                <circle
                  cx={pos.cx}
                  cy={pos.cy}
                  r={isTarget ? '15' : '12'}
                  fill={isTarget ? color : '#0f172a'}
                  stroke={isTarget ? '#ffffff' : color}
                  strokeWidth={isTarget ? '2.5' : '2'}
                  className="transition-all duration-200"
                />

                {/* 손가락 번호 텍스트 (1~5) */}
                <text
                  x={pos.cx}
                  y={pos.cy + (isTarget ? 5 : 4)}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={isTarget ? '13' : '11'}
                  fontWeight="900"
                  fontFamily="sans-serif"
                >
                  {pos.finger}
                </text>

                {/* 계이름 라벨 ('도', '레' ...) */}
                <g transform={`translate(${pos.cx}, ${pos.cy + (pos.finger === 1 ? 26 : 22)})`}>
                  <rect
                    x="-14"
                    y="-8"
                    width="28"
                    height="16"
                    rx="8"
                    fill="rgba(0, 0, 0, 0.7)"
                    stroke={isTarget ? color : 'rgba(255, 255, 255, 0.25)'}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    fill={isTarget ? color : '#ffffff'}
                    fontSize="10"
                    fontWeight="800"
                  >
                    {koreanName}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
