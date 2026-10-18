import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, CheckCircle2, RotateCcw, Volume2, X } from 'lucide-react';
import { NoteInfo } from '../types/audio';
import { CORE_PIANO_KEYS, CorePianoKeyDef } from '../utils/audioMath';
import {
  saveCalibrationProfile,
  PianoCalibrationProfile,
  markCalibrationOnboardingDone,
} from '../utils/calibrationStorage';
import { soundEffects } from '../utils/soundEffects';

interface PianoCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCalibrationComplete: () => void;
  detectedNote: NoteInfo | null;
  detectedFrequency: number;
  isListening: boolean;
  startListening: () => Promise<void>;
  simulateNote?: (fullName: string | null) => void;
}

export const PianoCalibrationModal: React.FC<PianoCalibrationModalProps> = ({
  isOpen,
  onClose,
  onCalibrationComplete,
  detectedNote,
  detectedFrequency,
  isListening,
  startListening,
  simulateNote,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [collectedFrequencies, setCollectedFrequencies] = useState<Record<string, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('피아노 건반을 통통 쳐보세요!');
  const lastProcessedTimeRef = useRef(0);

  const targetKey: CorePianoKeyDef = CORE_PIANO_KEYS[currentStepIndex] || CORE_PIANO_KEYS[0];

  // 모달 오픈 시 마이크가 꺼져있으면 켜기 시도
  useEffect(() => {
    if (isOpen && !isListening) {
      startListening().catch(() => {});
    }
  }, [isOpen, isListening, startListening]);

  // 마이크 음고 감지 시 타깃 음 캘리브레이션 판정
  useEffect(() => {
    if (!isOpen || isCompleted) return;
    if (!detectedFrequency || detectedFrequency <= 0) return;

    const now = performance.now();
    if (now - lastProcessedTimeRef.current < 600) return; // 디바운스 600ms

    // 타깃 음표 이론 주파수 대비 ±60센트(오차 범위) 또는 이름 일치
    const targetFreq = targetKey.frequency;
    const centsDiff = Math.abs(1200 * Math.log2(detectedFrequency / targetFreq));

    const isMatch =
      centsDiff < 80 ||
      (detectedNote && detectedNote.fullName === targetKey.fullName);

    if (isMatch) {
      lastProcessedTimeRef.current = now;
      soundEffects.playSuccessDing();

      const updated = {
        ...collectedFrequencies,
        [targetKey.fullName]: Math.round(detectedFrequency * 10) / 10,
      };
      setCollectedFrequencies(updated);
      setFeedbackMsg(`찰칵! ${targetKey.koreanName}(${targetKey.fullName}) 인식 완료 (${detectedFrequency.toFixed(1)}Hz)`);

      if (currentStepIndex + 1 < CORE_PIANO_KEYS.length) {
        setTimeout(() => {
          setCurrentStepIndex((prev) => prev + 1);
          setFeedbackMsg('다음 건반을 쳐주세요!');
        }, 400);
      } else {
        // 8음 전수 수집 완료
        setIsCompleted(true);
        soundEffects.playFanfare();

        // A4(라) 기준 계산
        const a4Freq = updated['A4'] || 440.0;
        const profile: PianoCalibrationProfile = {
          calibratedAt: new Date().toISOString(),
          isCustom: true,
          notes: updated,
          baseA4: Math.round(a4Freq * 10) / 10,
        };
        saveCalibrationProfile(profile);
      }
    }
  }, [detectedFrequency, detectedNote, targetKey, isOpen, isCompleted, currentStepIndex, collectedFrequencies]);

  if (!isOpen) return null;

  const handleReset = () => {
    setCurrentStepIndex(0);
    setCollectedFrequencies({});
    setIsCompleted(false);
    setFeedbackMsg('도(C4)부터 다시 시작해요!');
  };

  const handleFinish = () => {
    markCalibrationOnboardingDone();
    onCalibrationComplete();
    onClose();
  };

  const handleSkip = () => {
    markCalibrationOnboardingDone();
    onClose();
  };

  // 수동 타건 (시뮬레이터 지원)
  const handleKeyClick = (key: CorePianoKeyDef) => {
    if (simulateNote) {
      simulateNote(key.fullName);
    }
    // 직접 주파수 입력 처리
    const updated = {
      ...collectedFrequencies,
      [key.fullName]: key.frequency,
    };
    setCollectedFrequencies(updated);
    soundEffects.playSuccessDing();

    if (currentStepIndex + 1 < CORE_PIANO_KEYS.length) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      soundEffects.playFanfare();
      const profile: PianoCalibrationProfile = {
        calibratedAt: new Date().toISOString(),
        isCustom: true,
        notes: updated,
        baseA4: 440.0,
      };
      saveCalibrationProfile(profile);
    }
  };

  return (
    <div
      onClick={handleSkip}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-white"
      >
        {/* 상단 바 */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                피아노 소리 맞춤 캘리브레이션
              </h2>
              <p className="text-[11px] text-slate-400">
                아이의 피아노 소리에 꼭 맞게 마이크 주파수를 자동 조율합니다
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="닫기 (다음에 하기)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 바디 컨텐츠 */}
        {!isCompleted ? (
          <div className="flex flex-col sm:flex-row items-center gap-5 my-1">
            {/* 캐릭터 마스코트 가이드 */}
            <div className="relative shrink-0 flex flex-col items-center">
              <img
                src="/images/characters/mascot_guide.png"
                alt="피아노 조율 마스코트"
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-xl animate-bounce"
                style={{ animationDuration: '3s' }}
              />
              <span className="text-[10px] font-bold text-amber-300 mt-1 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/40">
                조율 친구
              </span>
            </div>

            {/* 현재 타깃 안내 카드 */}
            <div className="flex-1 w-full flex flex-col items-center sm:items-start text-center sm:text-left gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>
                  진행: <strong className="text-white">{currentStepIndex + 1}</strong> / 8음
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span
                  className="text-3xl sm:text-4xl font-black drop-shadow-md"
                  style={{ color: targetKey.color }}
                >
                  '{targetKey.koreanName}' ({targetKey.fullName})
                </span>
                <span className="text-sm text-slate-300 font-semibold">건반을 소리 내어 쳐보세요!</span>
              </div>

              <p className="text-xs text-amber-200/90 font-medium">
                {feedbackMsg}
              </p>

              {/* 실시간 감지 상태 바 */}
              <div className="w-full bg-slate-950/60 rounded-xl p-2 border border-slate-800/90 flex items-center justify-between text-xs text-slate-400">
                <span>현재 마이크:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {detectedFrequency > 0 ? `${detectedFrequency.toFixed(1)} Hz` : '소리를 기다리는 중...'}
                </span>
                <span>목표: {targetKey.frequency}Hz</span>
              </div>
            </div>
          </div>
        ) : (
          /* 캘리브레이션 완료 화면 */
          <div className="flex flex-col items-center justify-center text-center py-4 gap-3 animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">피아노 맞춤 조율 완료!</h3>
            <p className="text-xs text-slate-300 max-w-md">
              실제 피아노 8음(C4~C5)의 고유 주파수 프로파일이 성공적으로 저장되었습니다. 이제 더 정확하고 즉각적으로 피아노 소리를 인식합니다!
            </p>
          </div>
        )}

        {/* 8건반 진행도 그리드 */}
        <div className="grid grid-cols-8 gap-1.5 sm:gap-2 w-full pt-1">
          {CORE_PIANO_KEYS.map((k, idx) => {
            const isRecorded = !!collectedFrequencies[k.fullName];
            const isCurrent = idx === currentStepIndex && !isCompleted;
            return (
              <button
                key={k.fullName}
                type="button"
                onClick={() => handleKeyClick(k)}
                className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all text-center cursor-pointer active:scale-95 ${
                  isCurrent
                    ? 'ring-2 ring-white scale-105 shadow-lg'
                    : isRecorded
                    ? 'opacity-100 bg-slate-800/90 border-emerald-500/60'
                    : 'opacity-40 bg-slate-900 border-slate-800'
                }`}
                style={{
                  borderColor: isCurrent ? k.color : undefined,
                  backgroundColor: isCurrent ? `${k.color}20` : undefined,
                }}
                title={`${k.koreanName} (${k.fullName}) 직접 터치하여 완료`}
              >
                <span className="text-[10px] text-slate-400 font-bold">{k.fullName}</span>
                <span
                  className="text-xs sm:text-sm font-black"
                  style={{ color: k.color }}
                >
                  {k.koreanName}
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5">
                  {isRecorded ? '✓' : `${k.shortcut.split('/')[0].trim()}`}
                </span>
              </button>
            );
          })}
        </div>

        {/* 하단 제어 버튼 */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
          {!isCompleted ? (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>처음부터</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  건너뛰기 (기본값)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // 현재까지의 값 또는 기본값으로 강제 완료
                    const fallbackProfile: PianoCalibrationProfile = {
                      calibratedAt: new Date().toISOString(),
                      isCustom: true,
                      notes: collectedFrequencies,
                      baseA4: collectedFrequencies['A4'] || 440.0,
                    };
                    saveCalibrationProfile(fallbackProfile);
                    handleFinish();
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md active:scale-95"
                >
                  현재 값으로 저장
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-2.5 text-xs sm:text-sm font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 rounded-xl transition-all shadow-lg shadow-emerald-950/40 active:scale-98"
            >
              피아노 연주 시작하기 🚀
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
