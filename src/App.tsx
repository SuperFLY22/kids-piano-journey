import React, { useState, useEffect, useRef } from 'react';
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
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import { usePitchDetection } from './hooks/usePitchDetection';
import { useKeyboardSimulation } from './hooks/useKeyboardSimulation';
import { useFingerTutorial } from './hooks/useFingerTutorial';
import { useRhythmGame } from './hooks/useRhythmGame';
import { PitchCard } from './components/PitchCard';
import { PitchMonitor } from './components/PitchMonitor';
import { NoiseGateControl } from './components/NoiseGateControl';
import { PianoRangeTester } from './components/PianoRangeTester';
import { VirtualPiano } from './components/VirtualPiano';
import { AudioLogViewer } from './components/AudioLogViewer';
import { TutorialGuide } from './components/TutorialGuide';
import { TutorialCompletionModal } from './components/TutorialCompletionModal';
import { SheetMusicCanvas } from './components/SheetMusicCanvas';
import { SongPlayHeader } from './components/SongPlayHeader';
import { SongSelectionCardList } from './components/SongSelectionCardList';
import { SongCompletionModal } from './components/SongCompletionModal';
import { SongModeSoundMonitor } from './components/SongModeSoundMonitor';
import { ConfettiEffect } from './components/ConfettiEffect';
import { PianoCalibrationModal } from './components/PianoCalibrationModal';
import { IntroSplashScreen } from './components/IntroSplashScreen';
import { ComboFireworkOverlay } from './components/ComboFireworkOverlay';
import { SoundMixerModal } from './components/SoundMixerModal';
import { CurriculumMap } from './components/CurriculumMap';
import { LevelIntroModal } from './components/LevelIntroModal';
import { SONG_CATALOG, evaluateSongPerformance } from './utils/songData';
import { isCalibrationOnboardingDone } from './utils/calibrationStorage';
import {
  loadCurriculumProgress,
  saveLevelClear,
  resetCurriculumProgress,
} from './utils/curriculumStorage';
import { getCurriculumLevel } from './utils/curriculumData';
import { CurriculumLevel, LevelProgress } from './types/curriculum';
import { KeepAwake } from '@capacitor-community/keep-awake';

export type AppPlayMode = 'curriculum' | 'song' | 'tutorial' | 'free';

export const App: React.FC = () => {
  const [playMode, setPlayMode] = useState<AppPlayMode>('curriculum'); // 기본값: 10단계 모험 커리큘럼 모드
  const [showSplash, setShowSplash] = useState<boolean>(true); // 첫 실행 시 스플래시 인트로 화면 노출
  const [showDebug, setShowDebug] = useState(false);
  const [showCalibrationModal, setShowCalibrationModal] = useState<boolean>(() => !isCalibrationOnboardingDone());
  const [showSoundMixerModal, setShowSoundMixerModal] = useState<boolean>(false);
  const [isSongModalDismissed, setIsSongModalDismissed] = useState(false);

  // Phase 8: 10단계 모험 커리큘럼 상태
  const [curriculumProgress, setCurriculumProgress] = useState<LevelProgress>(() => loadCurriculumProgress());
  const [selectedLevelForIntro, setSelectedLevelForIntro] = useState<CurriculumLevel | null>(null);
  const [activeCurriculumLevel, setActiveCurriculumLevel] = useState<CurriculumLevel | null>(null);
  const [isCurriculumPlaying, setIsCurriculumPlaying] = useState<boolean>(false);

  // 안드로이드 태블릿 및 모바일 화면 꺼짐 방지
  useEffect(() => {
    KeepAwake.keepAwake().catch(() => {
      // 일반 브라우저 환경에서는 무시
    });
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

  // Phase 3: 오른손 5손가락 자리 튜토리얼 훅
  const tutorial = useFingerTutorial();

  // Phase 4: 가로 스크롤 오선보 리듬 게임 훅
  const rhythmGame = useRhythmGame();

  // 렌더 사이클 의존성 분리를 위한 Ref
  const tutorialHandleNoteInputRef = useRef(tutorial.handleNoteInput);
  tutorialHandleNoteInputRef.current = tutorial.handleNoteInput;
  const tutorialIsActiveRef = useRef(tutorial.isActive);
  tutorialIsActiveRef.current = tutorial.isActive;

  const rhythmGameHandleNoteInputRef = useRef(rhythmGame.handleNoteInput);
  rhythmGameHandleNoteInputRef.current = rhythmGame.handleNoteInput;
  const rhythmGameIsPlayingRef = useRef(rhythmGame.gameState.isPlaying);
  rhythmGameIsPlayingRef.current = rhythmGame.gameState.isPlaying;

  const playModeRef = useRef(playMode);
  playModeRef.current = playMode;
  const isCurriculumPlayingRef = useRef(isCurriculumPlaying);
  isCurriculumPlayingRef.current = isCurriculumPlaying;

  // 건반 클릭 또는 키보드 시뮬레이션 시 입력 디스패치
  const handleKeyOrSimulate = (fullName: string | null) => {
    simulateNote(fullName);
    if (!fullName) return;

    const currentMode = playModeRef.current;
    if (currentMode === 'tutorial' && tutorialIsActiveRef.current) {
      tutorialHandleNoteInputRef.current(fullName);
    } else if (
      (currentMode === 'song' || (currentMode === 'curriculum' && isCurriculumPlayingRef.current)) &&
      rhythmGameIsPlayingRef.current
    ) {
      rhythmGameHandleNoteInputRef.current(fullName);
    }
  };

  // Mac 키보드(KeyA~G, 1~5, 한글 자음) 피아노 타건 시뮬레이션 연동
  useKeyboardSimulation(handleKeyOrSimulate);

  // 마이크 피치 감지 시 현재 모드별 판정 자동 연동 (모드 전환 시 이전 음표 재트리거 방지)
  useEffect(() => {
    if (!confirmedNote) return;

    const currentMode = playModeRef.current;
    if (currentMode === 'tutorial' && tutorialIsActiveRef.current) {
      tutorialHandleNoteInputRef.current(confirmedNote);
    } else if (
      (currentMode === 'song' || (currentMode === 'curriculum' && isCurriculumPlayingRef.current)) &&
      rhythmGameIsPlayingRef.current
    ) {
      rhythmGameHandleNoteInputRef.current(confirmedNote.fullName);
    }
  }, [confirmedNote]);

  // 커리큘럼 모드 완곡 시 진행도 자동 저장 및 동기화
  const lastSavedCompletedRef = useRef<boolean>(false);
  useEffect(() => {
    if (
      playMode === 'curriculum' &&
      isCurriculumPlaying &&
      activeCurriculumLevel &&
      rhythmGame.gameState.isCompleted
    ) {
      if (!lastSavedCompletedRef.current) {
        lastSavedCompletedRef.current = true;
        const totalNotes = rhythmGame.song.notes.length || 1;
        const processedHits = rhythmGame.gameState.perfectCount + rhythmGame.gameState.goodCount;
        const accuracy = Math.min(100, Math.round((processedHits / totalNotes) * 100));
        const evalResult = evaluateSongPerformance(rhythmGame.gameState.score, totalNotes);
        const updated = saveLevelClear(activeCurriculumLevel.level, accuracy, evalResult.stars);
        setCurriculumProgress(updated);
      }
    } else {
      lastSavedCompletedRef.current = false;
    }
  }, [
    playMode,
    isCurriculumPlaying,
    activeCurriculumLevel,
    rhythmGame.gameState.isCompleted,
    rhythmGame.gameState.score,
    rhythmGame.gameState.perfectCount,
    rhythmGame.gameState.goodCount,
    rhythmGame.song.notes.length,
  ]);

  // 모드 변경 시 보조 훅 상태 정돈 및 모드별 팝업 격리
  const handleSwitchMode = (newMode: AppPlayMode) => {
    setPlayMode(newMode);
    setIsSongModalDismissed(true); // 타 모드 전환 시 이전 연주 결과 팝업 강제 차단
    if (newMode !== 'tutorial') {
      tutorial.stopTutorial();
    }
    if (newMode !== 'song' && newMode !== 'curriculum') {
      rhythmGame.stopGame();
    }
    if (newMode === 'curriculum') {
      setIsCurriculumPlaying(false);
      setActiveCurriculumLevel(null);
      setSelectedLevelForIntro(null);
      rhythmGame.stopGame();
    }
    if (newMode === 'song') {
      setIsCurriculumPlaying(false);
      setActiveCurriculumLevel(null);
    }
    if (newMode === 'tutorial') {
      tutorial.startTutorial();
    }
  };

  // 커리큘럼 레벨 연습 시작 (Wait Mode)
  const handleStartCurriculumLevel = (level: CurriculumLevel) => {
    setSelectedLevelForIntro(null);
    setActiveCurriculumLevel(level);
    setIsCurriculumPlaying(true);
    setIsSongModalDismissed(false);
    rhythmGame.setPlayMode('practice'); // 학습자 친화형 Wait Mode로 즉시 진입
    rhythmGame.selectSong(level.songData, true); // 즉시 해당 레벨 악보 로드 및 자동 시작 (원자적 동기화)
  };

  // 커리큘럼 모험 지도로 복귀
  const handleReturnToCurriculumMap = () => {
    rhythmGame.stopGame();
    setIsCurriculumPlaying(false);
    setActiveCurriculumLevel(null);
    setIsSongModalDismissed(true);
  };

  // 다음 레벨 도전 핸들러
  const handleNextCurriculumLevel = () => {
    if (!activeCurriculumLevel) return;
    const nextLevelNum = activeCurriculumLevel.level + 1;
    const nextLevelData = getCurriculumLevel(nextLevelNum);
    setIsSongModalDismissed(true);
    setIsCurriculumPlaying(false);
    setActiveCurriculumLevel(null);

    if (nextLevelData) {
      setSelectedLevelForIntro(nextLevelData);
    }
  };

  // 연주 시작 또는 재시작 시 완곡 모달 닫힘 상태 자동 초기화 (결과 미출력 버그 방지)
  useEffect(() => {
    if (rhythmGame.gameState.isPlaying) {
      setIsSongModalDismissed(false);
    }
  }, [rhythmGame.gameState.isPlaying]);

  // ESC 키로 엔지니어링 모니터 드로어 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showDebug) {
        setShowDebug(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDebug]);

  // 현재 하단 건반에 표시할 타깃 음표
  const isGameActive =
    (playMode === 'song' || (playMode === 'curriculum' && isCurriculumPlaying)) &&
    rhythmGame.gameState.isPlaying;

  const currentTargetNoteName =
    playMode === 'tutorial' && tutorial.isActive
      ? tutorial.currentStep.key.fullName
      : isGameActive
      ? rhythmGame.gameState.activeTargetNote?.pitch || null
      : null;

  const currentBgImage =
    playMode === 'curriculum'
      ? '/images/backgrounds/bg_song_mode.png'
      : playMode === 'song'
      ? '/images/backgrounds/bg_song_mode.png'
      : playMode === 'tutorial'
      ? '/images/backgrounds/bg_tutorial_mode.png'
      : '/images/backgrounds/bg_free_mode.png';

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-start p-1.5 sm:p-2.5 select-none overflow-x-hidden">
      {/* 모드별 고화질 일러스트 배경 레이어 */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center transition-all duration-700 ease-in-out opacity-100 filter brightness-100 saturate-110"
        style={{ backgroundImage: `url(${currentBgImage})` }}
      />
      {/* 배경이 생생하게 투과되는 초미세 비네팅 글래스 오버레이 */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-black/10 backdrop-blur-[0.5px]" />

      {/* 상단 네비게이션 & 헤더 (루미너스 크리스탈 글래스 바) */}
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

        {/* 중앙: 4대 모드 선택 탭 (모험 모드 / 동요 연주 / 손가락 연습 / 자유 연주) */}
        <div className="flex items-center bg-black/25 backdrop-blur-md p-1 rounded-2xl border border-white/20 shadow-inner">
          <button
            type="button"
            onClick={() => handleSwitchMode('curriculum')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              playMode === 'curriculum'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black shadow-md'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>모험 모드 🗺️</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMode('song')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              playMode === 'song'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>동요 자유 연주 🎵</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMode('tutorial')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              playMode === 'tutorial'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black shadow-md'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>손가락 연습 🖐️</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMode('free')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              playMode === 'free'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>자유 연주 🎹</span>
          </button>
        </div>

        {/* 컨트롤 버튼 그룹 */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 사운드 볼륨 믹서 (MR & 효과음) */}
          <button
            type="button"
            onClick={() => setShowSoundMixerModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-2xl transition-all border cursor-pointer active:scale-95 backdrop-blur-md shadow-sm bg-white/[0.12] hover:bg-white/[0.22] text-white border-white/25"
            title="배경 반주(MR) 및 효과음 볼륨 조절"
          >
            <Volume2 className="w-3.5 h-3.5 text-sky-300" />
            <span className="hidden sm:inline">사운드 조절</span>
          </button>

          {/* 피아노 8음 캘리브레이션 토글 */}
          <button
            type="button"
            onClick={() => setShowCalibrationModal(true)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-2xl transition-all border cursor-pointer active:scale-95 backdrop-blur-md shadow-sm ${
              calibrationProfile?.isCustom
                ? 'bg-amber-400/30 text-amber-200 border-amber-400/60 shadow-amber-950/20'
                : 'bg-white/[0.12] hover:bg-white/[0.22] text-white border-white/25'
            }`}
            title="사용자 피아노 8음 맞춤 주파수 캘리브레이션"
          >
            <Sliders className={`w-3.5 h-3.5 ${calibrationProfile?.isCustom ? 'text-amber-300' : 'text-white/80'}`} />
            <span className="hidden sm:inline">
              {calibrationProfile?.isCustom ? '피아노 조율됨' : '피아노 조율'}
            </span>
          </button>

          {/* 엔지니어링 모니터 토글 */}
          <button
            type="button"
            onClick={() => setShowDebug((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-2xl transition-all border cursor-pointer active:scale-95 backdrop-blur-md shadow-sm ${
              showDebug
                ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400/60 shadow-cyan-950/20'
                : 'bg-white/[0.12] hover:bg-white/[0.22] text-white border-white/25'
            }`}
            title="상세 오디오 분석 및 실시간 로그 드로어 열기"
          >
            <Activity className={`w-3.5 h-3.5 ${showDebug ? 'text-cyan-300 animate-pulse' : 'text-white/80'}`} />
            <span className="hidden sm:inline">{showDebug ? '모니터 닫기' : '엔지니어링 모니터'}</span>
          </button>

          {/* 마이크 시작/중지 버튼 */}
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            disabled={isInitializing}
            className={`min-h-[40px] px-3.5 sm:px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/40'
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

      {/* 메인 작업 영역 */}
      <main className="relative z-10 w-full max-w-6xl mx-auto flex-1 flex flex-col justify-start py-1.5 sm:py-2 gap-1.5 sm:gap-2">
        {/* 마이크 권한 오류 경고 */}
        {error && (
          <div className="w-full bg-rose-950/80 border border-rose-800 text-rose-200 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="text-xs sm:text-sm">
              <span className="font-bold">마이크 권한 오류: </span>
              {error}
            </div>
          </div>
        )}

        {/* 모드 0: Phase 8 10단계 모험 커리큘럼 모드 */}
        {playMode === 'curriculum' && (
          <div className="flex flex-col gap-2">
            {!isCurriculumPlaying ? (
              /* 모험 지도 화면 */
              <CurriculumMap
                progress={curriculumProgress}
                onSelectLevel={(level) => setSelectedLevelForIntro(level)}
                onResetProgress={() => setCurriculumProgress(resetCurriculumProgress())}
              />
            ) : (
              /* 커리큘럼 스테이지 연주 화면 */
              <div className="flex flex-col gap-2 sm:gap-2.5">
                {/* 상단 스테이지 정보 & 지도로 돌아가기 바 */}
                <div className="w-full flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-900/80 border border-amber-400/40 backdrop-blur-xl shadow-lg">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleReturnToCurriculumMap}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer active:scale-95"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>모험 지도로</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base sm:text-lg">{activeCurriculumLevel?.songData.icon || '🌟'}</span>
                      <span className="text-xs sm:text-sm font-black text-amber-300">
                        STAGE {activeCurriculumLevel?.level}: {activeCurriculumLevel?.title}
                      </span>
                      <span className="hidden md:inline text-xs text-slate-300">
                        • {activeCurriculumLevel?.subtitle}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      진행: {rhythmGame.notes.filter((n) => n.hit).length} / {rhythmGame.notes.length} 음표
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-teal-400/20 text-teal-300 border border-teal-400/30">
                      연습(Wait) 모드
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSongModalDismissed(false);
                        rhythmGame.restartGame(activeCurriculumLevel?.songData);
                      }}
                      className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                      title="처음부터 다시 연주"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 팁 안내 띠 배너 */}
                {activeCurriculumLevel && (
                  <div className="w-full px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs font-medium flex items-center justify-between backdrop-blur-md">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-amber-300">💡 학습 팁:</span>
                      <span className="truncate">{activeCurriculumLevel.handTip}</span>
                    </div>
                    <span className="hidden sm:inline-block text-[11px] text-amber-300/80 shrink-0 ml-2">
                      음표가 멈추면 건반을 톡 눌러주세요!
                    </span>
                  </div>
                )}

                {/* 가로 스크롤 오선보 캔버스 */}
                <SheetMusicCanvas
                  song={rhythmGame.song}
                  getCurrentTime={rhythmGame.getCurrentTimeSec}
                  isPlaying={rhythmGame.gameState.isPlaying}
                  activeTargetNote={rhythmGame.gameState.activeTargetNote}
                  lastHitEvent={rhythmGame.lastHitEvent}
                  isWaitingForInput={rhythmGame.gameState.isWaitingForInput}
                />

                {/* 하단 3D 건반 및 실시간 통합 모니터 */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-2.5 items-stretch">
                  <div className="md:col-span-8 flex flex-col">
                    <VirtualPiano
                      activeNote={confirmedNote || debugInfo.note}
                      targetNoteFullName={currentTargetNoteName}
                      onKeyClick={handleKeyOrSimulate}
                    />
                  </div>
                  <div className="md:col-span-4 flex flex-col">
                    <SongModeSoundMonitor
                      note={confirmedNote || debugInfo.note}
                      rawFrequency={debugInfo.frequency}
                      isListening={isListening}
                      volumeDb={debugInfo.volumeDb}
                      isGateOpen={debugInfo.isGateOpen}
                      noiseThreshold={noiseThreshold}
                      onThresholdChange={setNoiseThreshold}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 모드 1: 동요 리듬 게임 (Phase 4 & 7) */}
        {playMode === 'song' && (
          <div className="flex flex-col gap-2 sm:gap-2.5">
            {/* Phase 7: 알록달록 동요 5곡 선택 카드 슬라이더 */}
            <SongSelectionCardList
              songs={SONG_CATALOG}
              selectedSongId={rhythmGame.song.id}
              isPlaying={rhythmGame.gameState.isPlaying}
              onSelectSong={(song) => {
                setIsSongModalDismissed(false);
                rhythmGame.selectSong(song);
              }}
            />

            {/* 상단 컨트롤러 및 진행바 & MR 반주 토글 & 곡 선택 */}
            <SongPlayHeader
              song={rhythmGame.song}
              gameState={rhythmGame.gameState}
              isMrMuted={rhythmGame.isMrMuted}
              onPlay={() => {
                setIsSongModalDismissed(false);
                rhythmGame.startGame();
              }}
              onResume={rhythmGame.resumeGame}
              onPause={rhythmGame.pauseGame}
              onRestart={() => {
                setIsSongModalDismissed(false);
                rhythmGame.restartGame();
              }}
              onSelectSong={(song) => {
                setIsSongModalDismissed(false);
                rhythmGame.selectSong(song);
              }}
              onToggleMr={rhythmGame.toggleMr}
              onTogglePlayMode={rhythmGame.togglePlayMode}
              onOpenSoundMixer={() => setShowSoundMixerModal(true)}
            />

            {/* 가로 스크롤 오선보 캔버스 */}
            <SheetMusicCanvas
              song={rhythmGame.song}
              getCurrentTime={rhythmGame.getCurrentTimeSec}
              isPlaying={rhythmGame.gameState.isPlaying}
              activeTargetNote={rhythmGame.gameState.activeTargetNote}
              lastHitEvent={rhythmGame.lastHitEvent}
              isWaitingForInput={rhythmGame.gameState.isWaitingForInput}
            />

            {/* 하단 3D 건반 및 실시간 통합 모니터 */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-2.5 items-stretch">
              <div className="md:col-span-8 flex flex-col">
                <VirtualPiano
                  activeNote={confirmedNote || debugInfo.note}
                  targetNoteFullName={currentTargetNoteName}
                  onKeyClick={handleKeyOrSimulate}
                />
              </div>
              <div className="md:col-span-4 flex flex-col">
                <SongModeSoundMonitor
                  note={confirmedNote || debugInfo.note}
                  rawFrequency={debugInfo.frequency}
                  isListening={isListening}
                  volumeDb={debugInfo.volumeDb}
                  isGateOpen={debugInfo.isGateOpen}
                  noiseThreshold={noiseThreshold}
                  onThresholdChange={setNoiseThreshold}
                />
              </div>
            </div>
          </div>
        )}

        {/* 모드 2: 손가락 연습 모드 (Phase 3) */}
        {playMode === 'tutorial' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 items-stretch">
            <div className="md:col-span-5 flex flex-col gap-2.5 justify-between">
              <TutorialGuide
                currentStep={tutorial.currentStep}
                currentStepIndex={tutorial.currentStepIndex}
                isCelebrating={tutorial.isCelebrating}
                onClose={() => handleSwitchMode('free')}
              />
              <NoiseGateControl
                volumeDb={debugInfo.volumeDb}
                noiseThreshold={noiseThreshold}
                isGateOpen={debugInfo.isGateOpen}
                onThresholdChange={setNoiseThreshold}
              />
            </div>
            <div className="md:col-span-7 flex flex-col gap-2.5 justify-between">
              <VirtualPiano
                activeNote={confirmedNote || debugInfo.note}
                targetNoteFullName={currentTargetNoteName}
                onKeyClick={handleKeyOrSimulate}
              />
              <PianoRangeTester currentNote={confirmedNote || debugInfo.note} />
            </div>
          </div>
        )}

        {/* 모드 3: 자유 연주 모드 (Phase 2) */}
        {playMode === 'free' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 items-stretch">
            <div className="md:col-span-5 flex flex-col gap-2.5 justify-between">
              <NoiseGateControl
                volumeDb={debugInfo.volumeDb}
                noiseThreshold={noiseThreshold}
                isGateOpen={debugInfo.isGateOpen}
                onThresholdChange={setNoiseThreshold}
              />
              <PitchCard
                note={confirmedNote || debugInfo.note}
                rawFrequency={debugInfo.frequency}
                isListening={isListening}
                volumeDb={debugInfo.volumeDb}
                isGateOpen={debugInfo.isGateOpen}
              />
            </div>
            <div className="md:col-span-7 flex flex-col gap-2.5 justify-between">
              <VirtualPiano
                activeNote={confirmedNote || debugInfo.note}
                targetNoteFullName={null}
                onKeyClick={handleKeyOrSimulate}
              />
              <PianoRangeTester currentNote={confirmedNote || debugInfo.note} />
            </div>
          </div>
        )}
      </main>

      {/* 별가루 축하 파티클 효과 */}
      <ConfettiEffect
        isActive={
          (playMode === 'tutorial' && (tutorial.isCelebrating || tutorial.isCompleted)) ||
          ((playMode === 'song' || (playMode === 'curriculum' && isCurriculumPlaying)) &&
            rhythmGame.gameState.isCompleted &&
            !isSongModalDismissed)
        }
        onComplete={() => {
          tutorial.dismissCelebration();
        }}
      />

      {/* Phase 3 올클리어 모달 (손가락 연습 모드에서만 단독 발동) */}
      <TutorialCompletionModal
        isOpen={playMode === 'tutorial' && tutorial.isCompleted}
        onRestart={tutorial.restartTutorial}
        onFreePlay={() => {
          tutorial.dismissCelebration();
          tutorial.stopTutorial();
          handleSwitchMode('free');
        }}
      />

      {/* Phase 4 & 8 완곡 축하 모달 (연주 모드 및 커리큘럼 모드) */}
      {(playMode === 'song' || (playMode === 'curriculum' && isCurriculumPlaying)) &&
        rhythmGame.gameState.isCompleted &&
        !isSongModalDismissed && (
          <SongCompletionModal
            song={rhythmGame.song}
            gameState={rhythmGame.gameState}
            isCurriculumMode={playMode === 'curriculum'}
            hasNextLevel={activeCurriculumLevel ? activeCurriculumLevel.level < 10 : false}
            onNextLevel={handleNextCurriculumLevel}
            onRestart={() => {
              setIsSongModalDismissed(false);
              rhythmGame.restartGame();
            }}
            onClose={() => {
              setIsSongModalDismissed(true);
              if (playMode === 'curriculum') {
                setIsCurriculumPlaying(false);
                setActiveCurriculumLevel(null);
              }
            }}
          />
        )}

      {/* Phase 8 커리큘럼 스테이지 안내 모달 */}
      <LevelIntroModal
        level={selectedLevelForIntro}
        isOpen={!!selectedLevelForIntro}
        onClose={() => setSelectedLevelForIntro(null)}
        onStartPractice={handleStartCurriculumLevel}
      />

      {/* 피아노 8음 캘리브레이션 위저드 모달 */}
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

      {/* 배경 반주(MR) 및 효과음 볼륨 믹서 모달 */}
      <SoundMixerModal
        isOpen={showSoundMixerModal}
        onClose={() => setShowSoundMixerModal(false)}
      />

      {/* 리듬 게임 콤보 달성 시 축하 팝업 */}
      {(playMode === 'song' || (playMode === 'curriculum' && isCurriculumPlaying)) && (
        <ComboFireworkOverlay combo={rhythmGame.gameState.combo} />
      )}

      {/* 시작/스플래시 화면 */}
      {showSplash && (
        <IntroSplashScreen
          onStartPlay={() => setShowSplash(false)}
          onOpenCalibration={() => {
            setShowSplash(false);
            setShowCalibrationModal(true);
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
