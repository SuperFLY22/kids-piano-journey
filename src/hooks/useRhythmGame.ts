import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { SongMetadata, SheetNote, HitRating, RhythmGameState, RhythmPlayMode, PlaybackSpeed } from '../types/sheet';
import { AIRPLANE_SONG, beatToSeconds, secondsToBeat, evaluateTiming } from '../utils/songData';
import { soundEffects } from '../utils/soundEffects';
import { accompaniment } from '../utils/accompanimentEngine';
import { audioContextManager } from '../utils/audioContextManager';

export interface HitEvent {
  id: string;
  rating: HitRating;
  note: SheetNote;
}

interface UseRhythmGameOptions {
  initialSong?: SongMetadata;
  initialPlayMode?: RhythmPlayMode;
  onSongComplete?: (score: number, maxCombo: number) => void;
}

// 상태 초기화 순수 팩토리 함수
function createInitialGameState(
  song: SongMetadata,
  isPlaying = false,
  playMode: RhythmPlayMode = 'practice',
  isWaitingForInput = false,
  speed: PlaybackSpeed = 1.0,
  countdown: number | 'GO' | null = null
): RhythmGameState {
  return {
    isPlaying,
    isPaused: false,
    isCompleted: false,
    playMode,
    isWaitingForInput,
    currentTimeSec: isPlaying ? -3.0 : 0, // 3초 카운트다운 준비 기간 (-3.0s ~ 0s)
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfectCount: 0,
    goodCount: 0,
    missCount: 0,
    activeTargetNote: song.notes[0] || null,
    speed,
    countdown,
  };
}

export function useRhythmGame({
  initialSong = AIRPLANE_SONG,
  initialPlayMode = 'practice',
  onSongComplete,
}: UseRhythmGameOptions = {}) {
  // 현재 선택된 곡
  const [currentSong, setCurrentSong] = useState<SongMetadata>(initialSong);
  // 연습 모드(기다려주기) vs 실전 모드(흐르는 리듬)
  const [playMode, setPlayModeState] = useState<RhythmPlayMode>(initialPlayMode);
  const playModeRef = useRef<RhythmPlayMode>(initialPlayMode);
  const isWaitingForInputRef = useRef<boolean>(false);

  // 연주 속도 (거북이 0.75배속 / 토끼 1.0배속)
  const [speed, setSpeedState] = useState<PlaybackSpeed>(1.0);
  const speedRef = useRef<PlaybackSpeed>(1.0);

  // 곡 음표 복사본 (판정 플래그 추적용)
  const [notes, setNotes] = useState<SheetNote[]>(() =>
    initialSong.notes.map((n) => ({ ...n, hit: false, rating: null }))
  );

  const [gameState, setGameState] = useState<RhythmGameState>(() =>
    createInitialGameState(initialSong, false, initialPlayMode, false, 1.0, null)
  );

  const [lastHitEvent, setLastHitEvent] = useState<HitEvent | null>(null);

  // MR 반주 음소거 상태
  const [isMrMuted, setIsMrMuted] = useState<boolean>(() => accompaniment.getIsMuted());

  // 60fps 시간 추적용 Ref (React 렌더 사이클과 분리)
  const timeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const notesRef = useRef<SheetNote[]>(notes);
  notesRef.current = notes;

  const currentSongRef = useRef<SongMetadata>(currentSong);
  currentSongRef.current = currentSong;

  const lastTimestampRef = useRef<number>(performance.now());
  const lastTriggeredBeatRef = useRef<number>(-999);
  const lastCountdownStepRef = useRef<number>(-1);
  const lastUiSyncRef = useRef<number>(0);
  const lastActiveTargetIdRef = useRef<string | null>(initialSong.notes[0]?.id || null);
  // 효과음(딩동댕) 재생 중 마이크 오인식 방지 블랭킹 윈도우 (ms 타임스탬프)
  const blankingUntilRef = useRef<number>(0);
  const hasCompletedRef = useRef<boolean>(false);
  const allProcessedTimeRef = useRef<number>(0);
  const audioZeroTimeRef = useRef<number | null>(null);

  const onSongCompleteRef = useRef(onSongComplete);
  onSongCompleteRef.current = onSongComplete;

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // 60fps 캔버스 직결용 초단위 실시간 시간 getter (React 리렌더링 유발 없음)
  const getCurrentTimeSec = useCallback(() => timeRef.current, []);

  // 곡 총 재생 시간 (초) - currentSong 및 speed 변경 시에만 재계산
  const { totalBeats, totalSongDurationSec } = useMemo(() => {
    const curEffectiveBpm = Math.max(30, Math.round(currentSong.bpm * speed));
    const beats = currentSong.totalMeasures * currentSong.beatsPerMeasure;
    const duration = beatToSeconds(beats, curEffectiveBpm) + 1.5;
    return { totalBeats: beats, totalSongDurationSec: duration, effectiveBpm: curEffectiveBpm };
  }, [currentSong, speed]);

  // 속도 변경 (0.75x <-> 1.0x)
  const setSpeed = useCallback((newSpeed: PlaybackSpeed) => {
    speedRef.current = newSpeed;
    setSpeedState(newSpeed);
    setGameState((prev) => ({
      ...prev,
      speed: newSpeed,
    }));
  }, []);

  const toggleSpeed = useCallback(() => {
    const nextSpeed: PlaybackSpeed = speedRef.current === 1.0 ? 0.75 : 1.0;
    setSpeed(nextSpeed);
  }, [setSpeed]);

  // 모드 변경 (Practice <-> Play)
  const setPlayMode = useCallback((newMode: RhythmPlayMode) => {
    playModeRef.current = newMode;
    setPlayModeState(newMode);
    isWaitingForInputRef.current = false;
    setGameState((prev) => ({
      ...prev,
      playMode: newMode,
      isWaitingForInput: false,
    }));
  }, []);

  const togglePlayMode = useCallback(() => {
    const nextMode = playModeRef.current === 'practice' ? 'play' : 'practice';
    setPlayMode(nextMode);
  }, [setPlayMode]);

  // 곡 변경 함수 (비행기 <-> 나비야 <-> 커리큘럼 곡)
  const selectSong = useCallback((newSong: SongMetadata, autoStart = false) => {
    currentSongRef.current = newSong;
    setCurrentSong(newSong);

    const resetNotes = newSong.notes.map((n) => ({ ...n, hit: false, rating: null }));
    setNotes(resetNotes);
    notesRef.current = resetNotes;
    timeRef.current = autoStart ? -3.0 : 0;
    hasCompletedRef.current = false;
    allProcessedTimeRef.current = 0;
    isPlayingRef.current = autoStart;
    isWaitingForInputRef.current = false;
    lastTriggeredBeatRef.current = -999;
    lastCountdownStepRef.current = -1;
    lastActiveTargetIdRef.current = resetNotes[0]?.id || null;
    lastTimestampRef.current = performance.now();
    audioZeroTimeRef.current = null;

    if (autoStart) {
      accompaniment.resume();
    }

    setGameState(
      createInitialGameState(
        newSong,
        autoStart,
        playModeRef.current,
        false,
        speedRef.current,
        autoStart ? 3 : null
      )
    );
    setLastHitEvent(null);
  }, []);

  // 상태 초기화 / 재시작 (songOverride 전달 시 클로저 딜레이 없이 즉각 해당 곡으로 시작)
  const restartGame = useCallback((songOverride?: SongMetadata) => {
    accompaniment.resume();

    const targetSong = songOverride || currentSongRef.current;
    if (songOverride) {
      currentSongRef.current = songOverride;
      setCurrentSong(songOverride);
    }

    const resetNotes = targetSong.notes.map((n) => ({ ...n, hit: false, rating: null }));
    setNotes(resetNotes);
    notesRef.current = resetNotes;
    timeRef.current = -3.0; // 3초 카운트다운 시작 (-3.0s -> gameLoop에서 3 카운트 틱 자동 트리거)
    hasCompletedRef.current = false;
    allProcessedTimeRef.current = 0;
    isPlayingRef.current = true;
    isWaitingForInputRef.current = false;
    lastTriggeredBeatRef.current = -999;
    lastCountdownStepRef.current = -1;
    lastTimestampRef.current = performance.now();
    lastActiveTargetIdRef.current = resetNotes[0]?.id || null;
    audioZeroTimeRef.current = null;

    setGameState(
      createInitialGameState(
        targetSong,
        true,
        playModeRef.current,
        false,
        speedRef.current,
        3
      )
    );
    setLastHitEvent(null);
  }, []);

  const startGame = useCallback((songOverride?: SongMetadata) => {
    restartGame(songOverride);
  }, [restartGame]);

  const pauseGame = useCallback(() => {
    accompaniment.stop();
    isPlayingRef.current = false;
    setGameState((prev) => ({ ...prev, isPlaying: false, isPaused: true }));
  }, []);

  const resumeGame = useCallback(() => {
    accompaniment.resume();
    isPlayingRef.current = true;
    lastTimestampRef.current = performance.now();
    setGameState((prev) => ({ ...prev, isPlaying: true, isPaused: false }));
  }, []);

  const stopGame = useCallback(() => {
    accompaniment.stop();
    isPlayingRef.current = false;
    hasCompletedRef.current = false;
    isWaitingForInputRef.current = false;
    const resetNotes = currentSong.notes.map((n) => ({ ...n, hit: false, rating: null }));
    setNotes(resetNotes);
    notesRef.current = resetNotes;
    timeRef.current = 0;
    lastTriggeredBeatRef.current = -999;
    lastCountdownStepRef.current = -1;

    setGameState(
      createInitialGameState(
        currentSong,
        false,
        playModeRef.current,
        false,
        speedRef.current,
        null
      )
    );
  }, [currentSong]);



  // 반주 음소거 토글
  const toggleMr = useCallback(() => {
    accompaniment.resume();
    const nextMuted = accompaniment.toggleMute();
    setIsMrMuted(nextMuted);
  }, []);

  // 입력 판정 핸들러 (마이크 피치 감지 또는 키보드 시뮬레이션)
  const handleNoteInput = useCallback(
    (inputPitch: string | null) => {
      if (!inputPitch || !isPlayingRef.current) return;

      // 카운트다운 진행 중(-0.2s 이전)에는 타깃 판정 보류 (준비 시간 보호)
      if (timeRef.current < -0.2) return;

      // 효과음(딩동댕) 재생 중 마이크 역유입 블랭킹 가드 (250ms 무시)
      if (performance.now() < blankingUntilRef.current) return;

      const curTime = Math.max(0, timeRef.current);
      const currentNotes = notesRef.current;
      const song = currentSongRef.current;
      const curEffectiveBpm = Math.max(30, Math.round(song.bpm * speedRef.current));
      const isPractice = playModeRef.current === 'practice';

      // 타깃 후보군 탐색
      let bestCandidateIndex = -1;
      let minDiff = 999;

      if (isPractice) {
        // [연습 모드]: 아직 hit되지 않은 첫 번째 타깃 노트 중심 매칭
        // 판정선에 멈춰서 기다리는 중이거나(isWaitingForInput), 타깃선 직전(-0.35s)부터 대기 중인 첫 타깃을 즉시 판정
        const firstUnprocessedIndex = currentNotes.findIndex((n) => !n.hit);
        if (firstUnprocessedIndex !== -1) {
          const note = currentNotes[firstUnprocessedIndex];
          const noteTargetSec = beatToSeconds(note.beat, curEffectiveBpm);
          const diff = curTime - noteTargetSec;
          // 대기 중이거나, 타깃선 도달 0.35초 전부터 허용
          if (isWaitingForInputRef.current || diff >= -0.35) {
            bestCandidateIndex = firstUnprocessedIndex;
          }
        }
      } else {
        // [실전 모드]: 타깃선 부근(±0.45초 이내)의 가장 가까운 미처리 노트
        for (let i = 0; i < currentNotes.length; i++) {
          const note = currentNotes[i];
          if (note.hit) continue;

          const noteTargetSec = beatToSeconds(note.beat, curEffectiveBpm);
          const diff = curTime - noteTargetSec;

          if (Math.abs(diff) <= 0.45 && Math.abs(diff) < minDiff) {
            minDiff = Math.abs(diff);
            bestCandidateIndex = i;
          }
        }
      }

      if (bestCandidateIndex === -1) return;

      const targetNote = currentNotes[bestCandidateIndex];

      // 피치 일치 여부 판정
      if (targetNote.pitch === inputPitch) {
        const noteTargetSec = beatToSeconds(targetNote.beat, curEffectiveBpm);
        const timeDiffSec = curTime - noteTargetSec;
        // 연습 모드에서는 맞추기만 하면 항상 'PERFECT', 실전 모드에서는 타이밍 평가
        const rating: HitRating = isPractice ? 'PERFECT' : evaluateTiming(timeDiffSec);

        if (rating) {
          // 적중 성공 (PERFECT or GOOD)
          blankingUntilRef.current = performance.now() + 250;

          const updatedNotes = [...currentNotes];
          updatedNotes[bestCandidateIndex] = {
            ...targetNote,
            hit: true,
            rating,
          };
          notesRef.current = updatedNotes;
          setNotes(updatedNotes);

          // 효과음 재생
          soundEffects.playSuccessDing();

          // 팝업 파티클 이벤트
          setLastHitEvent({
            id: `${targetNote.id}-${Date.now()}`,
            rating,
            note: targetNote,
          });

          // 연습 모드 대기 해제 및 다음 음표 위치로 부드럽게 스크롤 재개
          if (isPractice) {
            isWaitingForInputRef.current = false;
            timeRef.current = Math.max(timeRef.current, noteTargetSec) + 0.08;
          }

          // 점수 및 콤보 갱신
          const points = rating === 'PERFECT' ? 100 : 70;
          setGameState((prev) => {
            const nextCombo = prev.combo + 1;
            const nextMaxCombo = Math.max(prev.maxCombo, nextCombo);
            return {
              ...prev,
              isWaitingForInput: false,
              score: prev.score + points,
              combo: nextCombo,
              maxCombo: nextMaxCombo,
              perfectCount: rating === 'PERFECT' ? prev.perfectCount + 1 : prev.perfectCount,
              goodCount: rating === 'GOOD' ? prev.goodCount + 1 : prev.goodCount,
            };
          });
        }
      }
    },
    []
  );


  // 상시 가동 60fps 애니메이션 프레임 루프 (루프 단절 방지 & 끊김 없는 MR 스케줄링)
  useEffect(() => {
    let animId: number;

    const gameLoop = (now: number) => {
      const dt = Math.min((now - lastTimestampRef.current) / 1000, 0.1);
      lastTimestampRef.current = now;

      if (isPlayingRef.current) {
        const song = currentSongRef.current;
        const currentNotes = notesRef.current;
        const curEffectiveBpm = Math.max(30, Math.round(song.bpm * speedRef.current));
        const isPractice = playModeRef.current === 'practice';
        const nextActiveNote = currentNotes.find((n) => !n.hit) || null;

        // 연습 모드 대기 판정:
        // 카운트다운(curTime >= 0s)이 끝난 후, 다음 쳐야 할 타깃 노트가 타깃 판정선에 도달했는가?
        let shouldHoldForPractice = false;
        if (isPractice && nextActiveNote && timeRef.current >= 0) {
          const targetSec = beatToSeconds(nextActiveNote.beat, curEffectiveBpm);
          if (timeRef.current >= targetSec) {
            shouldHoldForPractice = true;
            timeRef.current = targetSec; // 타깃선에 정확히 일시정지 고정
            isWaitingForInputRef.current = true;
          }
        }

        // 스크롤 시간 전진 (연습 모드에서 대기 중이 아닐 때만 dt 가산)
        if (!shouldHoldForPractice) {
          timeRef.current += dt;
          if (isPractice && timeRef.current >= 0) {
            isWaitingForInputRef.current = false;
          }

          // [Phase C]: 실전 모드('play')에서 Web Audio API 오디오 클럭과의 드리프트 자동 댐핑 수렴
          if (!isPractice && timeRef.current >= 0) {
            const ctx = audioContextManager.getContext();
            if (ctx && ctx.state === 'running') {
              if (audioZeroTimeRef.current === null) {
                audioZeroTimeRef.current = ctx.currentTime;
              } else {
                const expectedAudioTime = (ctx.currentTime - audioZeroTimeRef.current) * speedRef.current;
                const drift = expectedAudioTime - timeRef.current;
                if (Math.abs(drift) > 0.04 && Math.abs(drift) < 0.5) {
                  timeRef.current += drift * 0.05;
                }
              }
            }
          }
        }
        const curTime = timeRef.current;

        // 1. 카운트다운 기간(-3.0s ~ 0.6s): 시작 시 3, 2, 1 틱 및 0: 출발! 스타트 사운드
        let currentCountdown: number | 'GO' | null = null;
        if (curTime < 0) {
          const countdownStep = Math.min(3, Math.max(1, Math.ceil(Math.abs(curTime))));
          currentCountdown = countdownStep;
          if (countdownStep !== lastCountdownStepRef.current) {
            lastCountdownStepRef.current = countdownStep;
            accompaniment.playCountdownTick(countdownStep);
          }
        } else if (curTime >= 0 && curTime < 0.6) {
          currentCountdown = 'GO';
          if (lastCountdownStepRef.current !== 0) {
            lastCountdownStepRef.current = 0;
            accompaniment.playCountdownTick(0);
          }
        } else {
          currentCountdown = null;
        }

        // 2. 본 연주 기간(curTime >= 0): 4/4박자마다 MR 배경 반주
        // (단, 연습 모드에서 건반 대기 중에는 박자가 혼자 진행되지 않도록 정지)
        if (curTime >= 0 && !shouldHoldForPractice) {
          const currentBeat = Math.floor(secondsToBeat(curTime, curEffectiveBpm));
          if (
            currentBeat >= 0 &&
            currentBeat < totalBeats &&
            currentBeat !== lastTriggeredBeatRef.current
          ) {
            lastTriggeredBeatRef.current = currentBeat;
            accompaniment.playBeat(currentBeat, song.id, song.accompanimentChords);
          }
        }

        // 3. MISS 자동 처리 (실전 리듬 모드 'play'에서만 작동! 연습 모드에서는 MISS 원천 차단)
        let stateChanged = false;
        const updatedNotes = [...currentNotes];

        if (!isPractice && curTime >= 0) {
          for (let i = 0; i < updatedNotes.length; i++) {
            const note = updatedNotes[i];
            if (!note.hit) {
              const noteTargetSec = beatToSeconds(note.beat, curEffectiveBpm);
              if (curTime - noteTargetSec > 0.45) {
                updatedNotes[i] = {
                  ...note,
                  hit: true,
                  rating: 'MISS',
                };
                stateChanged = true;
              }
            }
          }

          if (stateChanged) {
            notesRef.current = updatedNotes;
            setNotes(updatedNotes);
            setGameState((prev) => ({
              ...prev,
              combo: 0,
              missCount: prev.missCount + 1,
            }));
          }
        }

        // 4. 현재 활성 타깃 음표 추적
        const targetChanged = nextActiveNote?.id !== lastActiveTargetIdRef.current;
        if (targetChanged) {
          lastActiveTargetIdRef.current = nextActiveNote?.id || null;
        }

        // 5. React State 동기화: 100ms 스로틀 또는 대기/타깃/MISS/카운트다운 변경 시 제한 갱신
        const isWaiting = isWaitingForInputRef.current;
        const waitStatusChanged = isWaiting !== gameStateRef.current.isWaitingForInput;
        const countdownChanged = currentCountdown !== gameStateRef.current.countdown;
        const shouldSyncUi =
          now - lastUiSyncRef.current >= 100 ||
          targetChanged ||
          stateChanged ||
          waitStatusChanged ||
          countdownChanged;

        if (shouldSyncUi) {
          lastUiSyncRef.current = now;
          setGameState((prev) => ({
            ...prev,
            currentTimeSec: curTime,
            activeTargetNote: nextActiveNote,
            isWaitingForInput: isWaiting,
            playMode: playModeRef.current,
            speed: speedRef.current,
            countdown: currentCountdown,
          }));
        }

        // 6. 곡 종료 감지 (모든 노트 처리 완료 또는 전체 시간 만료)
        const allNotesProcessed = updatedNotes.length > 0 && updatedNotes.every((n) => n.hit);
        if (allNotesProcessed && allProcessedTimeRef.current === 0) {
          allProcessedTimeRef.current = now;
        } else if (!allNotesProcessed) {
          allProcessedTimeRef.current = 0;
        }

        const lastNote = song.notes[song.notes.length - 1];
        const lastNoteTargetSec = lastNote
          ? beatToSeconds(lastNote.beat + (lastNote.duration || 1), curEffectiveBpm)
          : totalSongDurationSec;

        // 연습(Wait) 모드: 마지막 음표 타건 후 0.4초 뒤 즉시 완곡 팡파르 & 결과 팝업 노출 (답답함 해소)
        // 실전(Play) 모드: 오선보 자연스러운 통과(+0.8초) 후 완곡
        const isCompletedByNotes =
          allNotesProcessed &&
          (isPractice
            ? allProcessedTimeRef.current > 0 && now - allProcessedTimeRef.current >= 400
            : curTime >= lastNoteTargetSec + 0.8);
        const isCompletedByDuration = !isPractice && curTime >= totalSongDurationSec;

        if (!hasCompletedRef.current && (isCompletedByNotes || isCompletedByDuration)) {
          hasCompletedRef.current = true;
          isPlayingRef.current = false;
          isWaitingForInputRef.current = false;
          setGameState((prev) => ({
            ...prev,
            currentTimeSec: curTime,
            isPlaying: false,
            isCompleted: true,
            isWaitingForInput: false,
            countdown: null,
          }));
          soundEffects.playFanfare();
          if (onSongCompleteRef.current) {
            onSongCompleteRef.current(gameStateRef.current.score, gameStateRef.current.maxCombo);
          }
        }
      }


      animId = requestAnimationFrame(gameLoop);
    };

    lastTimestampRef.current = performance.now();
    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [currentSong, totalSongDurationSec, totalBeats]);


  return {
    song: currentSong,
    notes,
    gameState,
    lastHitEvent,
    isMrMuted,
    getCurrentTimeSec,
    selectSong,
    toggleMr,
    playMode,
    setPlayMode,
    togglePlayMode,
    startGame,
    pauseGame,
    resumeGame,
    restartGame,
    stopGame,
    speed,
    setSpeed,
    toggleSpeed,
    handleNoteInput,
  };
}
