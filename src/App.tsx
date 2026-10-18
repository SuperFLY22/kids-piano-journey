import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  AlertCircle,
  Activity,
  BookOpen,
  Sliders,
  Volume2,
  Map as MapIcon,
  Music,
} from 'lucide-react';
import { usePitchDetection } from './hooks/usePitchDetection';
import { useKeyboardSimulation } from './hooks/useKeyboardSimulation';
import { useFingerTutorial } from './hooks/useFingerTutorial';
import { useRhythmGame } from './hooks/useRhythmGame';

// 4대 모드 분리 뷰
import { AdventureModeView } from './views/AdventureModeView';
import { SongPlayModeView } from './views/SongPlayModeView';
import { TutorialModeView } from './views/TutorialModeView';
import { FreePlayModeView } from './views/FreePlayModeView';

// 공통 모달 및 이펙트
import { PitchMonitor } from './components/PitchMonitor';
import { AudioLogViewer } from './components/AudioLogViewer';
import { TutorialCompletionModal } from './components/TutorialCompletionModal';
import { SongCompletionModal } from './components/SongCompletionModal';
import { ConfettiEffect } from './components/ConfettiEffect';
import { PianoCalibrationModal } from './components/PianoCalibrationModal';
import { IntroSplashScreen } from './components/IntroSplashScreen';
import { ComboFireworkOverlay } from './components/ComboFireworkOverlay';
import { SoundMixerModal } from './components/SoundMixerModal';
import { LevelIntroModal } from './components/LevelIntroModal';
import { StickerBookModal } from './components/StickerBookModal';

import { SongMetadata, PlaybackSpeed } from './types/sheet';
import { RewardSticker } from './types/sticker';
import { evaluateSongPerformance, SONG_CATALOG } from './utils/songData';
import { checkAndUnlockLevelSticker, checkAndUnlockSongSticker } from './utils/stickerStorage';
import {
  loadCurriculumProgress,
  saveLevelClear,
  resetCurriculumProgress,
} from './utils/curriculumStorage';
import { getCurriculumLevel } from './utils/curriculumData';
import { CurriculumLevel, LevelProgress } from './types/curriculum';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { App as CapApp } from '@capacitor/app';

export type AppPlayMode = 'curriculum' | 'song' | 'tutorial' | 'free';

export const App: React.FC = () => {
  const [playMode, setPlayMode] = useState<AppPlayMode>('curriculum');
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [showDebug, setShowDebug] = useState(false);
  const [showCalibrationModal, setShowCalibrationModal] = useState<boolean>(false);
  const [showSoundMixerModal, setShowSoundMixerModal] = useState<boolean>(false);
  const [showStickerBookModal, setShowStickerBookModal] = useState<boolean>(false);
  const [newlyUnlockedSticker, setNewlyUnlockedSticker] = useState<RewardSticker | null>(null);
  const [isSongModalDismissed, setIsSongModalDismissed] = useState(false);

  // 10단계 모험 커리큘럼 상태
  const [curriculumProgress, setCurriculumProgress] = useState<LevelProgress>(() => loadCurriculumProgress());
  const [selectedLevelForIntro, setSelectedLevelForIntro] = useState<CurriculumLevel | null>(null);
  const [activeCurriculumLevel, setActiveCurriculumLevel] = useState<CurriculumLevel | null>(null);
  const [isCurriculumPlaying, setIsCurriculumPlaying] = useState<boolean>(false);

  // 화면 꺼짐 방지
  useEffect(() => {
    KeepAwake.keepAwake().catch(() => {});
    return () => {
      KeepAwake.allowSleep().catch(() => {});
    };
  }, []);

  const {
    isListening,
    isInitializing,
    error,
    confirmedNote,
    debugInfo,
    noiseThreshold,
    logs,
    calibrationProfile,
    startListening,
    stopListening,
    setNoiseThreshold,
    clearLogs,
    simulateNote,
    reloadCalibrationProfile,
  } = usePitchDetection();

  const tutorial = useFingerTutorial();
  // 동요 자유 연주 전용 리듬 게임 훅 (SONG_CATALOG 동요 5곡 독립 상태 격리)
  const songRhythmGame = useRhythmGame({
    initialSong: SONG_CATALOG[0],
    initialPlayMode: 'practice',
  });

  // 10단계 모험 커리큘럼 전용 리듬 게임 훅 (커리큘럼 단계별 연습곡 독립 격리)
  const curriculumRhythmGame = useRhythmGame({
    initialSong: getCurriculumLevel(1)?.songData || SONG_CATALOG[0],
    initialPlayMode: 'practice',
  });

  // 렌더 사이클 의존성 분리를 위한 Refs
  const tutorialHandleNoteInputRef = useRef(tutorial.handleNoteInput);
  tutorialHandleNoteInputRef.current = tutorial.handleNoteInput;
  const tutorialIsActiveRef = useRef(tutorial.isActive);
  tutorialIsActiveRef.current = tutorial.isActive;

  const songGameHandleNoteInputRef = useRef(songRhythmGame.handleNoteInput);
  songGameHandleNoteInputRef.current = songRhythmGame.handleNoteInput;
  const songGameIsPlayingRef = useRef(songRhythmGame.gameState.isPlaying);
  songGameIsPlayingRef.current = songRhythmGame.gameState.isPlaying;

  const curriculumGameHandleNoteInputRef = useRef(curriculumRhythmGame.handleNoteInput);
  curriculumGameHandleNoteInputRef.current = curriculumRhythmGame.handleNoteInput;
  const curriculumGameIsPlayingRef = useRef(curriculumRhythmGame.gameState.isPlaying);
  curriculumGameIsPlayingRef.current = curriculumRhythmGame.gameState.isPlaying;

  const playModeRef = useRef(playMode);
  playModeRef.current = playMode;
  const isCurriculumPlayingRef = useRef(isCurriculumPlaying);
  isCurriculumPlayingRef.current = isCurriculumPlaying;

  // 건반 클릭 또는 키보드 시뮬레이션 시 입력 디스패치
  const handleKeyOrSimulate = useCallback((fullName: string | null) => {
    simulateNote(fullName);
    if (!fullName) return;

    const currentMode = playModeRef.current;
    if (currentMode === 'tutorial' && tutorialIsActiveRef.current) {
      tutorialHandleNoteInputRef.current(fullName);
    } else if (currentMode === 'song' && songGameIsPlayingRef.current) {
      songGameHandleNoteInputRef.current(fullName);
    } else if (
      currentMode === 'curriculum' &&
      isCurriculumPlayingRef.current &&
      curriculumGameIsPlayingRef.current
    ) {
      curriculumGameHandleNoteInputRef.current(fullName);
    }
  }, [simulateNote]);

  useKeyboardSimulation(handleKeyOrSimulate);

  // 마이크 피치 감지 시 현재 모드별 판정 자동 연동
  useEffect(() => {
    if (!confirmedNote) return;

    const currentMode = playModeRef.current;
    if (currentMode === 'tutorial' && tutorialIsActiveRef.current) {
      tutorialHandleNoteInputRef.current(confirmedNote);
    } else if (currentMode === 'song' && songGameIsPlayingRef.current) {
      songGameHandleNoteInputRef.current(confirmedNote.fullName);
    } else if (
      currentMode === 'curriculum' &&
      isCurriculumPlayingRef.current &&
      curriculumGameIsPlayingRef.current
    ) {
      curriculumGameHandleNoteInputRef.current(confirmedNote.fullName);
    }
  }, [confirmedNote]);

  // 커리큘럼 모드 완곡 시 진행도 자동 저장 및 스티커 해금
  const lastSavedCompletedRef = useRef<boolean>(false);
  useEffect(() => {
    if (
      playMode === 'curriculum' &&
      isCurriculumPlaying &&
      activeCurriculumLevel &&
      curriculumRhythmGame.gameState.isCompleted
    ) {
      if (!lastSavedCompletedRef.current) {
        lastSavedCompletedRef.current = true;
        const totalNotes = curriculumRhythmGame.song.notes.length || 1;
        const processedHits = curriculumRhythmGame.gameState.perfectCount + curriculumRhythmGame.gameState.goodCount;
        const accuracy = Math.min(100, Math.round((processedHits / totalNotes) * 100));
        const evalResult = evaluateSongPerformance(curriculumRhythmGame.gameState.score, totalNotes);
        const updated = saveLevelClear(activeCurriculumLevel.level, accuracy, evalResult.stars);
        setCurriculumProgress(updated);

        const newlySticker = checkAndUnlockLevelSticker(activeCurriculumLevel.level, evalResult.stars);
        if (newlySticker) {
          setNewlyUnlockedSticker(newlySticker);
        }
      }
    } else {
      lastSavedCompletedRef.current = false;
    }
  }, [
    playMode,
    isCurriculumPlaying,
    activeCurriculumLevel,
    curriculumRhythmGame.gameState.isCompleted,
    curriculumRhythmGame.gameState.score,
    curriculumRhythmGame.gameState.perfectCount,
    curriculumRhythmGame.gameState.goodCount,
    curriculumRhythmGame.song.notes.length,
  ]);

  // 동요 모드 완곡 시 스티커 해금 체크
  const lastSongCompletedRef = useRef<boolean>(false);
  useEffect(() => {
    if (playMode === 'song' && songRhythmGame.gameState.isCompleted) {
      if (!lastSongCompletedRef.current) {
        lastSongCompletedRef.current = true;
        const totalNotes = songRhythmGame.song.notes.length || 1;
        const evalResult = evaluateSongPerformance(songRhythmGame.gameState.score, totalNotes);
        const newlySticker = checkAndUnlockSongSticker(songRhythmGame.song.id, evalResult.stars);
        if (newlySticker) {
          setNewlyUnlockedSticker(newlySticker);
        }
      }
    } else {
      lastSongCompletedRef.current = false;
    }
  }, [playMode, songRhythmGame.gameState.isCompleted, songRhythmGame.gameState.score, songRhythmGame.song.notes.length, songRhythmGame.song.id]);

  // 커리큘럼 스테이지 시작
  const handleStartCurriculumLevel = (level: CurriculumLevel, speed?: PlaybackSpeed) => {
    setSelectedLevelForIntro(null);
    setActiveCurriculumLevel(level);
    setIsCurriculumPlaying(true);
    setIsSongModalDismissed(false);
    curriculumRhythmGame.setSpeed(speed ?? 1.0);
    curriculumRhythmGame.setPlayMode('practice');
    curriculumRhythmGame.startGame(level.songData);
  };

  // 모험 지도로 복귀
  const handleReturnToCurriculumMap = useCallback(() => {
    curriculumRhythmGame.stopGame();
    setIsCurriculumPlaying(false);
    setActiveCurriculumLevel(null);
  }, [curriculumRhythmGame]);

  // 다음 레벨 도전
  const handleNextCurriculumLevel = useCallback(() => {
    if (!activeCurriculumLevel || activeCurriculumLevel.level >= 10) return;
    const nextLevelNum = activeCurriculumLevel.level + 1;
    const nextLevel = getCurriculumLevel(nextLevelNum);
    if (nextLevel) {
      setIsSongModalDismissed(false);
      setActiveCurriculumLevel(nextLevel);
      curriculumRhythmGame.setPlayMode('practice');
      curriculumRhythmGame.restartGame(nextLevel.songData);
    }
  }, [activeCurriculumLevel, curriculumRhythmGame]);

  // 모드 전환 핸들러
  const handleSwitchMode = useCallback((newMode: AppPlayMode) => {
    if (newMode !== 'tutorial' && tutorial.isActive) {
      tutorial.stopTutorial();
    }
    if (newMode !== 'song' && songRhythmGame.gameState.isPlaying) {
      songRhythmGame.stopGame();
    }
    if (newMode !== 'curriculum') {
      if (curriculumRhythmGame.gameState.isPlaying) {
        curriculumRhythmGame.stopGame();
      }
      setIsCurriculumPlaying(false);
      setActiveCurriculumLevel(null);
    }
    setIsSongModalDismissed(false);
    setPlayMode(newMode);
  }, [tutorial, songRhythmGame, curriculumRhythmGame]);

  // [Phase D]: 안드로이드 하드웨어 Back Button 핸들러 연동
  useEffect(() => {
    const backHandler = CapApp.addListener('backButton', () => {
      if (showDebug) { setShowDebug(false); return; }
      if (showSoundMixerModal) { setShowSoundMixerModal(false); return; }
      if (showCalibrationModal) { setShowCalibrationModal(false); return; }
      if (showStickerBookModal) { setShowStickerBookModal(false); return; }
      if (selectedLevelForIntro) { setSelectedLevelForIntro(null); return; }

      if (playMode === 'curriculum' && isCurriculumPlaying) {
        handleReturnToCurriculumMap();
        return;
      }

      if (playMode !== 'curriculum') {
        handleSwitchMode('curriculum');
        return;
      }

      CapApp.exitApp();
    });

    return () => {
      backHandler.then((h: { remove: () => Promise<void> }) => h.remove()).catch(() => {});
    };
  }, [
    showDebug,
    showSoundMixerModal,
    showCalibrationModal,
    showStickerBookModal,
    selectedLevelForIntro,
    playMode,
    isCurriculumPlaying,
    handleReturnToCurriculumMap,
    handleSwitchMode,
  ]);

  const currentTargetNoteName =
    playMode === 'tutorial' && tutorial.isActive
      ? tutorial.currentStep.key.fullName
      : playMode === 'song' && songRhythmGame.gameState.isPlaying
      ? songRhythmGame.gameState.activeTargetNote?.pitch || null
      : playMode === 'curriculum' && isCurriculumPlaying && curriculumRhythmGame.gameState.isPlaying
      ? curriculumRhythmGame.gameState.activeTargetNote?.pitch || null
      : null;

  const currentBgImage =
    playMode === 'curriculum' || playMode === 'song'
      ? '/images/backgrounds/bg_song_mode.png'
      : playMode === 'tutorial'
      ? '/images/backgrounds/bg_tutorial_mode.png'
      : '/images/backgrounds/bg_free_mode.png';

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-start p-1.5 sm:p-2.5 select-none overflow-x-hidden">
      {/* 고화질 일러스트 배경 레이어 */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center transition-all duration-700 ease-in-out opacity-100 filter brightness-100 saturate-110"
        style={{ backgroundImage: `url(${currentBgImage})` }}
      />
      <div className="fixed inset-0 pointer-events-none z-0 bg-black/10 backdrop-blur-[0.5px]" />

      {/* 상단 네비게이션 & 헤더 */}
      <header className="relative z-10 w-full max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 pb-1.5 sm:pb-2 border border-white/30 backdrop-blur-2xl bg-white/[0.12] px-3 py-1.5 sm:py-2 rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
        <div
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group active:scale-95 transition-transform"
          onClick={() => setShowSplash(true)}
          title="홈 / 시작 화면으로 이동"
        >
          <img
            src="/images/app_icon/app_icon.png"
            alt="키즈 피아노 저니"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl shadow-md shadow-cyan-500/30 object-contain ring-2 ring-white/40 group-hover:ring-amber-400 shrink-0 transition-all"
          />
          <div>
            <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white flex items-center gap-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight">
              Kids Piano Journey
              <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.2 rounded-full bg-gradient-to-r from-amber-500/30 to-cyan-500/30 text-amber-300 border border-amber-300/60 backdrop-blur-md shadow-sm">
                ✨ 피아노 스타터
              </span>
            </h1>
            <p className="text-[9px] sm:text-[10px] text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] font-medium leading-none">
              디지털 피아노 마이크 인식 & 가로 스크롤 동요 리듬 게임
            </p>
          </div>
        </div>

        {/* 4대 모드 선택 탭 */}
        <div className="flex items-center bg-black/40 backdrop-blur-md p-1 rounded-2xl border border-white/30 shadow-inner">
          <button
            type="button"
            onClick={() => handleSwitchMode('curriculum')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              playMode === 'curriculum'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-md'
                : 'text-white/90 hover:text-white hover:bg-white/15 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>모험 모드 🗺️</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMode('song')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              playMode === 'song'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                : 'text-white/90 hover:text-white hover:bg-white/15 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>동요 자유 연주 🎵</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMode('tutorial')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              playMode === 'tutorial'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-md'
                : 'text-white/90 hover:text-white hover:bg-white/15 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>손가락 연습 🖐️</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMode('free')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              playMode === 'free'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-white/90 hover:text-white hover:bg-white/15 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>자유 연주 🎹</span>
          </button>
        </div>

        {/* 컨트롤 버튼 그룹 */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowStickerBookModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-2xl transition-all border cursor-pointer active:scale-95 backdrop-blur-md shadow-sm bg-amber-950/45 hover:bg-amber-900/55 text-amber-300 border-amber-300/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
            title="내가 모은 피아노 스티커북 열기"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">스티커북 📖</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSoundMixerModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-2xl transition-all border cursor-pointer active:scale-95 backdrop-blur-md shadow-sm bg-black/40 hover:bg-black/60 text-white border-white/35 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
            title="배경 반주(MR) 및 효과음 볼륨 조절"
          >
            <Volume2 className="w-3.5 h-3.5 text-sky-300" />
            <span className="hidden sm:inline">볼륨 조절</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCalibrationModal(true)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-2xl transition-all border cursor-pointer active:scale-95 backdrop-blur-md shadow-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${
              calibrationProfile?.isCustom
                ? 'bg-amber-950/50 text-amber-300 border-amber-400/80 shadow-amber-950/30'
                : 'bg-black/40 hover:bg-black/60 text-white border-white/35'
            }`}
            title="사용자 피아노 8음 맞춤 주파수 캘리브레이션"
          >
            <Sliders className={`w-3.5 h-3.5 ${calibrationProfile?.isCustom ? 'text-amber-300' : 'text-amber-200'}`} />
            <span className="hidden sm:inline">
              {calibrationProfile?.isCustom ? '조율 완료 ✨' : '건반 맞추기'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowDebug((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-2xl transition-all border cursor-pointer active:scale-95 backdrop-blur-md shadow-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${
              showDebug
                ? 'bg-cyan-950/50 text-cyan-300 border-cyan-400/80 shadow-cyan-950/30'
                : 'bg-black/40 hover:bg-black/60 text-white border-white/35'
            }`}
            title="상세 오디오 분석 및 실시간 로그 드로어 열기"
          >
            <Activity className={`w-3.5 h-3.5 ${showDebug ? 'text-cyan-300 animate-pulse' : 'text-cyan-200'}`} />
            <span className="hidden sm:inline">{showDebug ? '분석 닫기' : '소리 분석'}</span>
          </button>

          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            disabled={isInitializing}
            className={`min-h-[40px] px-3.5 sm:px-5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/50'
            }`}
          >
            {isInitializing ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>연결 중...</span>
              </>
            ) : isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>마이크 끄기</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-slate-950" />
                <span>마이크 켜기</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 메인 작업 영역: 4대 독립 뷰 라우팅 */}
      <main className="relative z-10 w-full max-w-6xl mx-auto flex-1 flex flex-col justify-start py-1.5 sm:py-2 gap-1.5 sm:gap-2">
        {error && (
          <div className="w-full bg-rose-950/80 border border-rose-800 text-rose-200 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="text-xs sm:text-sm">
              <span className="font-bold">마이크 권한 오류: </span>
              {error}
            </div>
          </div>
        )}

        {playMode === 'curriculum' && (
          <AdventureModeView
            isCurriculumPlaying={isCurriculumPlaying}
            curriculumProgress={curriculumProgress}
            activeCurriculumLevel={activeCurriculumLevel}
            rhythmGame={curriculumRhythmGame}
            confirmedNote={confirmedNote}
            debugInfo={debugInfo}
            isListening={isListening}
            noiseThreshold={noiseThreshold}
            currentTargetNoteName={currentTargetNoteName}
            onSelectLevel={(level) => setSelectedLevelForIntro(level)}
            onResetProgress={() => setCurriculumProgress(resetCurriculumProgress())}
            onReturnToMap={handleReturnToCurriculumMap}
            onKeyClick={handleKeyOrSimulate}
            onThresholdChange={setNoiseThreshold}
            onRestartStage={() => {
              setIsSongModalDismissed(false);
              curriculumRhythmGame.restartGame(activeCurriculumLevel?.songData);
            }}
          />
        )}

        {playMode === 'song' && (
          <SongPlayModeView
            rhythmGame={songRhythmGame}
            confirmedNote={confirmedNote}
            debugInfo={debugInfo}
            isListening={isListening}
            noiseThreshold={noiseThreshold}
            currentTargetNoteName={currentTargetNoteName}
            onSelectSong={(song: SongMetadata) => {
              setIsSongModalDismissed(false);
              songRhythmGame.selectSong(song);
            }}
            onPlay={() => {
              setIsSongModalDismissed(false);
              songRhythmGame.startGame();
            }}
            onRestart={() => {
              setIsSongModalDismissed(false);
              songRhythmGame.restartGame();
            }}
            onKeyClick={handleKeyOrSimulate}
            onThresholdChange={setNoiseThreshold}
            onOpenSoundMixer={() => setShowSoundMixerModal(true)}
          />
        )}

        {playMode === 'tutorial' && (
          <TutorialModeView
            tutorial={tutorial}
            confirmedNote={confirmedNote}
            debugInfo={debugInfo}
            noiseThreshold={noiseThreshold}
            currentTargetNoteName={currentTargetNoteName}
            onClose={() => handleSwitchMode('free')}
            onKeyClick={handleKeyOrSimulate}
            onThresholdChange={setNoiseThreshold}
          />
        )}

        {playMode === 'free' && (
          <FreePlayModeView
            confirmedNote={confirmedNote}
            debugInfo={debugInfo}
            isListening={isListening}
            noiseThreshold={noiseThreshold}
            onKeyClick={handleKeyOrSimulate}
            onThresholdChange={setNoiseThreshold}
          />
        )}
      </main>

      {/* 별가루 파티클 효과 */}
      <ConfettiEffect
        isActive={
          (playMode === 'tutorial' && (tutorial.isCelebrating || tutorial.isCompleted)) ||
          (playMode === 'song' && songRhythmGame.gameState.isCompleted && !isSongModalDismissed) ||
          (playMode === 'curriculum' &&
            isCurriculumPlaying &&
            curriculumRhythmGame.gameState.isCompleted &&
            !isSongModalDismissed)
        }
        onComplete={() => {
          tutorial.dismissCelebration();
        }}
      />

      {/* 튜토리얼 올클리어 모달 */}
      <TutorialCompletionModal
        isOpen={playMode === 'tutorial' && tutorial.isCompleted}
        onRestart={tutorial.restartTutorial}
        onFreePlay={() => {
          tutorial.dismissCelebration();
          tutorial.stopTutorial();
          handleSwitchMode('free');
        }}
      />

      {/* 완곡 축하 모달: 동요 모드 */}
      {playMode === 'song' &&
        songRhythmGame.gameState.isCompleted &&
        !isSongModalDismissed && (
          <SongCompletionModal
            song={songRhythmGame.song}
            gameState={songRhythmGame.gameState}
            isCurriculumMode={false}
            hasNextLevel={false}
            onNextLevel={handleNextCurriculumLevel}
            onRestart={() => {
              setIsSongModalDismissed(false);
              songRhythmGame.restartGame();
            }}
            onClose={() => {
              setIsSongModalDismissed(true);
            }}
            unlockedSticker={newlyUnlockedSticker}
            onOpenStickerBook={() => setShowStickerBookModal(true)}
          />
        )}

      {/* 완곡 축하 모달: 커리큘럼 모드 */}
      {playMode === 'curriculum' &&
        isCurriculumPlaying &&
        curriculumRhythmGame.gameState.isCompleted &&
        !isSongModalDismissed && (
          <SongCompletionModal
            song={curriculumRhythmGame.song}
            gameState={curriculumRhythmGame.gameState}
            isCurriculumMode={true}
            hasNextLevel={activeCurriculumLevel ? activeCurriculumLevel.level < 10 : false}
            onNextLevel={handleNextCurriculumLevel}
            onRestart={() => {
              setIsSongModalDismissed(false);
              curriculumRhythmGame.restartGame();
            }}
            onClose={() => {
              setIsSongModalDismissed(true);
              setIsCurriculumPlaying(false);
              setActiveCurriculumLevel(null);
            }}
            unlockedSticker={newlyUnlockedSticker}
            onOpenStickerBook={() => setShowStickerBookModal(true)}
          />
        )}

      {/* 커리큘럼 스테이지 안내 모달 */}
      <LevelIntroModal
        level={selectedLevelForIntro}
        isOpen={!!selectedLevelForIntro}
        initialSpeed={curriculumRhythmGame.speed}
        onClose={() => setSelectedLevelForIntro(null)}
        onStartPractice={handleStartCurriculumLevel}
      />

      {/* 8음 캘리브레이션 위저드 모달 */}
      <PianoCalibrationModal
        isOpen={showCalibrationModal}
        onClose={() => setShowCalibrationModal(false)}
        onCalibrationComplete={() => {
          reloadCalibrationProfile();
        }}
        detectedNote={confirmedNote}
        detectedFrequency={debugInfo.frequency}
        isListening={isListening}
        startListening={startListening}
        simulateNote={handleKeyOrSimulate}
      />

      {/* 볼륨 믹서 모달 */}
      <SoundMixerModal
        isOpen={showSoundMixerModal}
        onClose={() => setShowSoundMixerModal(false)}
      />

      {/* 스티커북 모달 */}
      <StickerBookModal
        isOpen={showStickerBookModal}
        onClose={() => setShowStickerBookModal(false)}
      />

      {/* 콤보 오버레이 */}
      {(playMode === 'song' || (playMode === 'curriculum' && isCurriculumPlaying)) && (
        <ComboFireworkOverlay
          combo={
            playMode === 'song'
              ? songRhythmGame.gameState.combo
              : curriculumRhythmGame.gameState.combo
          }
        />
      )}

      {/* 시작/스플래시 화면 */}
      {showSplash && (
        <IntroSplashScreen
          onStartPlay={() => {
            setShowSplash(false);
            startListening().catch(() => {});
          }}
          onOpenCalibration={() => {
            setShowSplash(false);
            setShowCalibrationModal(true);
            startListening().catch(() => {});
          }}
        />
      )}

      {/* 엔지니어링 모니터 드로어 */}
      {showDebug && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-700/80 p-4 sm:p-6 overflow-y-auto flex flex-col gap-4 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base sm:text-lg font-bold text-white">
                  엔지니어링 모니터 & 텔레메트리
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowDebug(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="닫기 (ESC)"
              >
                ✕
              </button>
            </div>

            <PitchMonitor
              debugInfo={debugInfo}
              noiseThreshold={noiseThreshold}
              onThresholdChange={setNoiseThreshold}
              onSimulateNote={handleKeyOrSimulate}
            />

            <AudioLogViewer logs={logs} onClear={clearLogs} />
          </div>
        </div>
      )}
    </div>
  );
};
