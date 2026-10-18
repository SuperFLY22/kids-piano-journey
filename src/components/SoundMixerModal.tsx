import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, Music, RotateCcw, X, Volume1 } from 'lucide-react';
import { accompaniment } from '../utils/accompanimentEngine';
import { soundEffects } from '../utils/soundEffects';

interface SoundMixerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SoundMixerModal: React.FC<SoundMixerModalProps> = ({ isOpen, onClose }) => {
  const [mrVolume, setMrVolumeState] = useState<number>(() => Math.round(accompaniment.getVolume() * 100));
  const [isMrMuted, setIsMrMutedState] = useState<boolean>(() => accompaniment.getIsMuted());

  const [sfxVolume, setSfxVolumeState] = useState<number>(() => Math.round(soundEffects.getVolume() * 100));
  const [isSfxMuted, setIsSfxMutedState] = useState<boolean>(() => soundEffects.getIsMuted());

  // 모달이 열릴 때 최신 값 동기화
  useEffect(() => {
    if (isOpen) {
      setMrVolumeState(Math.round(accompaniment.getVolume() * 100));
      setIsMrMutedState(accompaniment.getIsMuted());
      setSfxVolumeState(Math.round(soundEffects.getVolume() * 100));
      setIsSfxMutedState(soundEffects.getIsMuted());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // MR 볼륨 변경
  const handleMrVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setMrVolumeState(val);
    accompaniment.setVolume(val / 100);
    if (val > 0 && isMrMuted) {
      accompaniment.toggleMute();
      setIsMrMutedState(false);
    }
  };

  // MR 음소거 토글
  const handleToggleMrMute = () => {
    const next = accompaniment.toggleMute();
    setIsMrMutedState(next);
  };

  // SFX 볼륨 변경
  const handleSfxVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setSfxVolumeState(val);
    soundEffects.setVolume(val / 100);
    if (val > 0 && isSfxMuted) {
      soundEffects.toggleMute();
      setIsSfxMutedState(false);
    }
  };

  // SFX 음소거 토글
  const handleToggleSfxMute = () => {
    const next = soundEffects.toggleMute();
    setIsSfxMutedState(next);
  };

  // 효과음 미리듣기
  const handleTestSfx = () => {
    soundEffects.playSuccessDing();
  };

  // 황금 밸런스 기본값 복원 (MR: 90%, SFX: 50%)
  const handleResetDefault = () => {
    accompaniment.setVolume(0.9);
    setMrVolumeState(90);
    if (accompaniment.getIsMuted()) {
      accompaniment.toggleMute();
      setIsMrMutedState(false);
    }

    soundEffects.setVolume(0.5);
    setSfxVolumeState(50);
    if (soundEffects.getIsMuted()) {
      soundEffects.toggleMute();
      setIsSfxMutedState(false);
    }

    soundEffects.playSuccessDing();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-2xl border border-white/30 rounded-3xl p-5 sm:p-6 shadow-[0_16px_48px_rgba(0,0,0,0.5)] text-white">
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition active:scale-95 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 모달 헤더 */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
            <Volume2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              사운드 볼륨 조절
            </h3>
            <p className="text-xs text-white/70 font-medium">
              반주(MR)와 효과음의 크기 밸런스를 조절하세요
            </p>
          </div>
        </div>

        {/* 볼륨 컨트롤 목록 */}
        <div className="space-y-4">
          {/* 1. MR 반주 사운드 */}
          <div className="bg-white/[0.07] border border-white/15 rounded-2xl p-4 transition-all">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-sm text-white">배경 반주 (MR)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-semibold border border-sky-400/30">
                  베이스 & 코드
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-sky-300 w-10 text-right">
                  {isMrMuted ? '음소거' : `${mrVolume}%`}
                </span>
                <button
                  type="button"
                  onClick={handleToggleMrMute}
                  className={`p-1.5 rounded-xl border text-xs transition active:scale-95 cursor-pointer ${
                    isMrMuted
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-sky-500/20 text-sky-300 border-sky-400/40 hover:bg-sky-500/30'
                  }`}
                  title={isMrMuted ? '음소거 해제' : '음소거'}
                >
                  {isMrMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Volume1 className="w-4 h-4 text-white/50 shrink-0" />
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={isMrMuted ? 0 : mrVolume}
                onChange={handleMrVolumeChange}
                className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
              <Volume2 className="w-4 h-4 text-sky-400 shrink-0" />
            </div>
          </div>

          {/* 2. 효과음 (딩동댕 / 팡파르) */}
          <div className="bg-white/[0.07] border border-white/15 rounded-2xl p-4 transition-all">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm text-white">효과음 (차임/팡파르)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-400/30">
                  딩동댕
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-300 w-10 text-right">
                  {isSfxMuted ? '음소거' : `${sfxVolume}%`}
                </span>
                <button
                  type="button"
                  onClick={handleToggleSfxMute}
                  className={`p-1.5 rounded-xl border text-xs transition active:scale-95 cursor-pointer ${
                    isSfxMuted
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-400/40 hover:bg-amber-500/30'
                  }`}
                  title={isSfxMuted ? '음소거 해제' : '음소거'}
                >
                  {isSfxMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Volume1 className="w-4 h-4 text-white/50 shrink-0" />
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={isSfxMuted ? 0 : sfxVolume}
                onChange={handleSfxVolumeChange}
                className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
            </div>

            {/* 효과음 미리듣기 버튼 */}
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleTestSfx}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>딩동댕 소리 들어보기</span>
              </button>
            </div>
          </div>
        </div>

        {/* 하단 버튼 액션: 황금 밸런스 복원 & 확인 */}
        <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefault}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-bold transition active:scale-95 cursor-pointer"
            title="추천 기본 밸런스로 초기화 (MR 90%, 효과음 50%)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>추천 밸런스 (MR 90% / 효과음 50%)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/30 transition active:scale-95 cursor-pointer"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
