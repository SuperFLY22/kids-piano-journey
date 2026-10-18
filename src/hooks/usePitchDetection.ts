import { useState, useRef, useEffect, useCallback } from 'react';
import { NoteInfo, DetectedPitch, PitchDetectionConfig, AudioLogEntry } from '../types/audio';
import {
  calculateRmsAndDb,
  frequencyToNoteInfo,
  midiToFrequency,
  detectPianoPitch,
  correctPianoHarmonics,
  detectNoteOnset,
  EnergyHistoryEntry,
} from '../utils/audioMath';
import { audioContextManager } from '../utils/audioContextManager';
import { loadCalibrationProfile, PianoCalibrationProfile } from '../utils/calibrationStorage';

const DEFAULT_CONFIG: Required<PitchDetectionConfig> = {
  bufferSize: 2048,
  noiseThresholdDb: -55, // 피아노 타건 소리가 편안하게 통과하도록 -55dB
  yinThreshold: 0.18,
};

/**
 * 실시간 오디오 측정치 로그 메시지 포맷팅 헬퍼 (순수 함수)
 */
function formatRawMeasurementMessage(db: number, freq: number | null, note: NoteInfo | null): string {
  const roundedDb = Math.round(db);
  if (freq && note) {
    return `🔍 [실시간 측정] Vol: ${roundedDb}dB | 감지 Hz: ${freq.toFixed(1)}Hz | 매핑: ${note.fullName}(${note.koreanName})`;
  }
  if (freq) {
    return `🔍 [실시간 측정] Vol: ${roundedDb}dB | 감지 Hz: ${freq.toFixed(1)}Hz | 매핑: 피아노범위 외`;
  }
  return `🔍 [실시간 측정] Vol: ${roundedDb}dB | 감지 Hz: 피치 미감지 (노이즈/과도상태)`;
}

export interface UsePitchDetectionReturn {
  isListening: boolean;
  isInitializing: boolean;
  error: string | null;
  confirmedNote: NoteInfo | null;
  debugInfo: DetectedPitch;
  noiseThreshold: number;
  logs: AudioLogEntry[];
  calibrationProfile: PianoCalibrationProfile | null;
  
  startListening: () => Promise<void>;
  stopListening: () => void;
  setNoiseThreshold: (db: number) => void;
  clearLogs: () => void;
  simulateNote: (fullName: string | null) => void;
  reloadCalibrationProfile: () => void;
}

export function usePitchDetection(
  customConfig?: PitchDetectionConfig,
  onNoteDetected?: (note: NoteInfo) => void
): UsePitchDetectionReturn {
  const yinThreshold = customConfig?.yinThreshold ?? DEFAULT_CONFIG.yinThreshold;
  const bufferSize = customConfig?.bufferSize ?? DEFAULT_CONFIG.bufferSize;
  const noiseThresholdDb = customConfig?.noiseThresholdDb ?? DEFAULT_CONFIG.noiseThresholdDb;

  const [isListening, setIsListening] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedNote, setConfirmedNote] = useState<NoteInfo | null>(null);
  const [noiseThreshold, setNoiseThresholdState] = useState<number>(noiseThresholdDb);
  const [logs, setLogs] = useState<AudioLogEntry[]>([]);
  const [calibrationProfile, setCalibrationProfile] = useState<PianoCalibrationProfile | null>(() => loadCalibrationProfile());
  const calibrationProfileRef = useRef<PianoCalibrationProfile | null>(calibrationProfile);

  const reloadCalibrationProfile = useCallback(() => {
    const loaded = loadCalibrationProfile();
    setCalibrationProfile(loaded);
    calibrationProfileRef.current = loaded;
  }, []);

  useEffect(() => {
    calibrationProfileRef.current = calibrationProfile;
  }, [calibrationProfile]);

  const [debugInfo, setDebugInfo] = useState<DetectedPitch>({
    frequency: 0,
    note: null,
    clarity: 0,
    volumeDb: -100,
    isGateOpen: false,
    timestamp: 0,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const hpfFilterRef = useRef<BiquadFilterNode | null>(null);
  const notchFilterRef = useRef<BiquadFilterNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 슬라이딩 윈도우 피치 큐
  const pitchHistoryRef = useRef<{ note: NoteInfo; time: number }[]>([]);
  const lastConfirmedTimeRef = useRef<number>(0);
  const lastDebugUpdateRef = useRef<number>(0);
  const lastRawMeasureLogRef = useRef<number>(0);
  const lastHeartbeatLogRef = useRef<number>(0);
  const lastConfirmedFullNameRef = useRef<string | null>(null);
  const noiseThresholdRef = useRef<number>(noiseThreshold);
  const onNoteDetectedRef = useRef(onNoteDetected);

  // Onset(타건 에너지 급상승) 감지용 RMS 이력 및 쿨다운 추적
  const energyHistoryRef = useRef<EnergyHistoryEntry[]>([]);
  const lastOnsetTimeRef = useRef<number>(0);

  useEffect(() => {
    noiseThresholdRef.current = noiseThreshold;
  }, [noiseThreshold]);

  useEffect(() => {
    onNoteDetectedRef.current = onNoteDetected;
  }, [onNoteDetected]);

  // 로그 추가
  const addLog = useCallback((message: string, volumeDb: number, frequency: number, noteName: string | null, isGateOpen: boolean) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    const newEntry: AudioLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      time: timeStr,
      volumeDb,
      frequency: Math.round(frequency * 10) / 10,
      noteName,
      isGateOpen,
      message,
    };

    setLogs((prev) => [newEntry, ...prev].slice(0, 50)); // 최근 50개 유지
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // 자원 해제
  const cleanupAudio = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Failed to stop media track:', e);
        }
      });
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextManager.closeMicContext();
      audioContextRef.current = null;
    }

    // QUAL-03: 전역 공유 AudioContext가 suspended 상태로 방치되지 않도록 점검
    const sharedCtx = audioContextManager.getContext();
    if (sharedCtx && sharedCtx.state === 'suspended') {
      sharedCtx.resume().catch(() => {});
    }

    if (filterRef.current) {
      try {
        filterRef.current.disconnect();
      } catch {
        // 무시
      }
      filterRef.current = null;
    }

    if (hpfFilterRef.current) {
      try {
        hpfFilterRef.current.disconnect();
      } catch {
        // 무시
      }
      hpfFilterRef.current = null;
    }

    if (notchFilterRef.current) {
      try {
        notchFilterRef.current.disconnect();
      } catch {
        // 무시
      }
      notchFilterRef.current = null;
    }

    analyserRef.current = null;
    pitchHistoryRef.current = [];
    energyHistoryRef.current = [];
    lastOnsetTimeRef.current = 0;
  }, []);

  // 피치 분석 루프
  const runDetectionLoop = useCallback(() => {
    const analyser = analyserRef.current;
    const ctx = audioContextRef.current;
    if (!analyser || !ctx) return;

    const buffer = new Float32Array(analyser.fftSize);

    const loop = (timestamp: number) => {
      analyser.getFloatTimeDomainData(buffer);

      // 1. RMS 및 dBFS 계산 & Onset(Attack Spike) 감지
      const { rms, db } = calculateRmsAndDb(buffer);
      const isGateOpen = db >= noiseThresholdRef.current;
      const isOnset = detectNoteOnset(rms, db, energyHistoryRef.current, timestamp);

      // 에너지 이력 갱신 (최근 150ms 윈도우 유지)
      energyHistoryRef.current.push({ rms, db, time: timestamp });
      energyHistoryRef.current = energyHistoryRef.current
        .filter((entry) => timestamp - entry.time <= 150)
        .slice(-15);

      let detectedFreq: number | null = null;
      let rawNote: NoteInfo | null = null;

      // 2. 소리가 들어오면 Min-Tau 피아노 피치 분석 수행
      if (isGateOpen) {
        try {
          const rawF = detectPianoPitch(buffer, ctx.sampleRate, yinThreshold);
          if (rawF && Number.isFinite(rawF)) {
            detectedFreq = correctPianoHarmonics(rawF);
            rawNote = frequencyToNoteInfo(detectedFreq, calibrationProfileRef.current);
          }
        } catch (err) {
          console.error('Pitch detection error:', err);
        }
      }

      // 3. 실시간 측정치 전수 로깅 (게이트 열렸을 때 180ms마다 원시 측정값 출력)
      if (isGateOpen && timestamp - lastRawMeasureLogRef.current > 180) {
        lastRawMeasureLogRef.current = timestamp;
        const logMsg = formatRawMeasurementMessage(db, detectedFreq, rawNote);
        addLog(
          logMsg,
          Math.round(db),
          detectedFreq || 0,
          rawNote?.fullName || null,
          true
        );
      } else if (!isGateOpen && timestamp - lastHeartbeatLogRef.current > 2000) {
        lastHeartbeatLogRef.current = timestamp;
        addLog(`[대기중] 입력 볼륨 ${Math.round(db)}dB (게이트: ${noiseThresholdRef.current}dB)`, Math.round(db), 0, null, false);
      }

      // 4. 슬라이딩 윈도우 기반 음표 확정 및 동음 연타(Repeated Notes) 분리
      if (isGateOpen && rawNote) {
        const history = pitchHistoryRef.current;
        history.push({ note: rawNote, time: timestamp });

        pitchHistoryRef.current = history
          .filter((item) => timestamp - item.time < 160)
          .slice(-6);

        const noteCounts: Record<string, { count: number; note: NoteInfo }> = {};
        for (const item of pitchHistoryRef.current) {
          const key = item.note.fullName;
          if (!noteCounts[key]) {
            noteCounts[key] = { count: 0, note: item.note };
          }
          noteCounts[key].count += 1;
        }

        let bestCandidate: NoteInfo | null = null;
        let maxCount = 0;
        for (const item of Object.values(noteCounts)) {
          if (item.count > maxCount) {
            maxCount = item.count;
            bestCandidate = item.note;
          }
        }

        if (bestCandidate && (maxCount >= 2 || pitchHistoryRef.current.length === 1)) {
          const chosen = bestCandidate;
          lastConfirmedTimeRef.current = timestamp;

          const isSameNote = lastConfirmedFullNameRef.current === chosen.fullName;
          const timeSinceLastOnset = timestamp - lastOnsetTimeRef.current;
          // 동음 연타(미-미-미) 분리 판정:
          // 동일 음표라도 Attack Spike(isOnset)가 포착되었고 최소 80ms 이상 지났다면 개별 타건으로 인정
          const isRepeatedOnset = isSameNote && isOnset && timeSinceLastOnset >= 80;

          if (!isSameNote || isRepeatedOnset) {
            lastConfirmedFullNameRef.current = chosen.fullName;
            lastOnsetTimeRef.current = timestamp;

            // React 리렌더링 및 UI 펄스 리트리거 보장을 위해 새 객체 생성
            setConfirmedNote({ ...chosen });

            if (onNoteDetectedRef.current) {
              onNoteDetectedRef.current(chosen);
            }

            const prefix = isRepeatedOnset ? '⚡ [동음 연타 Onset]' : '🎯 [음표 확정]';
            addLog(
              `${prefix} ${chosen.fullName}(${chosen.koreanName}) ${detectedFreq?.toFixed(1)}Hz | Vol: ${Math.round(db)}dB`,
              Math.round(db),
              detectedFreq || 0,
              chosen.fullName,
              true
            );
          }
        }
      } else {
        pitchHistoryRef.current = [];
        if (timestamp - lastConfirmedTimeRef.current > 900) {
          setConfirmedNote(null);
          lastConfirmedFullNameRef.current = null;
        }
      }


      // 5. 실시간 UI 디버그 모니터 (50ms)
      if (timestamp - lastDebugUpdateRef.current > 50) {
        lastDebugUpdateRef.current = timestamp;
        setDebugInfo({
          frequency: detectedFreq ?? 0,
          note: rawNote,
          clarity: isGateOpen && rawNote ? 0.95 : isGateOpen ? 0.3 : 0,
          volumeDb: Math.round(db),
          isGateOpen,
          timestamp,
        });
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
  }, [addLog, yinThreshold]);

  // 마이크 시작
  const startListening = useCallback(async () => {
    if (isListening || isInitializing) return;

    setIsInitializing(true);
    setError(null);

    try {
      const ctx = audioContextManager.getOrCreateMicContext();
      if (!ctx) {
        throw new Error('Web Audio API가 지원되지 않는 브라우저입니다.');
      }
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      audioContextRef.current = ctx;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });
      mediaStreamRef.current = stream;

      const source = ctx.createMediaStreamSource(stream);

      // [Phase 7 Multi-Stage Audio Filter Chain]
      // 1. High-Pass Filter (80Hz): 태블릿 터치/바람소리/테이블 충격 저주파 럼블 차단
      const hpf = ctx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = 80;
      hpf.Q.value = 0.707;
      hpfFilterRef.current = hpf;

      // 2. Notch Filter (1800Hz): 반주 퍼커션/메트로놈 틱 주파수 대역 감쇠 대역 저지 필터
      const notch = ctx.createBiquadFilter();
      notch.type = 'notch';
      notch.frequency.value = 1800;
      notch.Q.value = 3.5;
      notchFilterRef.current = notch;

      // 3. Low-Pass Filter (2,200Hz): 피아노 C3 ~ C6 전 대역 수용 및 초고주파 19kHz 차단
      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 2200;
      lpf.Q.value = 0.707;
      filterRef.current = lpf;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = bufferSize; // 2048

      // 체인 연결: source -> hpf -> notch -> lpf -> analyser
      source.connect(hpf);
      hpf.connect(notch);
      notch.connect(lpf);
      lpf.connect(analyser);
      analyserRef.current = analyser;

      setIsListening(true);
      setIsInitializing(false);

      addLog(
        `🎙️ [마이크 시작] 샘플레이트: ${ctx.sampleRate}Hz, HPF(80Hz)+Notch(1800Hz)+LPF(2200Hz), 게이트: ${noiseThresholdRef.current}dB`,
        -50,
        0,
        null,
        true
      );
      runDetectionLoop();
    } catch (err: unknown) {
      cleanupAudio();
      setIsListening(false);
      setIsInitializing(false);
      const errMsg = err instanceof Error ? err.message : '마이크 접근에 실패했습니다.';
      setError(errMsg);
      addLog(`❌ [마이크 에러] ${errMsg}`, -100, 0, null, false);
      console.error('Audio initialization failed:', err);
    }
  }, [isListening, isInitializing, bufferSize, runDetectionLoop, cleanupAudio, addLog]);

  // 마이크 중지
  const stopListening = useCallback(() => {
    addLog(`🛑 [마이크 중지]`, -100, 0, null, false);
    cleanupAudio();
    setIsListening(false);
    setIsInitializing(false);
    setConfirmedNote(null);
    lastConfirmedFullNameRef.current = null;
    setDebugInfo({
      frequency: 0,
      note: null,
      clarity: 0,
      volumeDb: -100,
      isGateOpen: false,
      timestamp: 0,
    });
  }, [cleanupAudio, addLog]);

  const setNoiseThreshold = useCallback((db: number) => {
    setNoiseThresholdState(db);
    addLog(`⚙️ [노이즈 게이트 변경] ${db} dB`, db, 0, null, false);
  }, [addLog]);

  // 키보드 시뮬레이션
  const simulateNote = useCallback((fullName: string | null) => {
    if (!fullName) {
      setConfirmedNote(null);
      lastConfirmedFullNameRef.current = null;
      setDebugInfo((prev) => ({
        ...prev,
        frequency: 0,
        note: null,
        clarity: 0,
        isGateOpen: false,
      }));
      return;
    }

    const noteMap: Record<string, number> = {
      'C4': midiToFrequency(60),
      'D4': midiToFrequency(62),
      'E4': midiToFrequency(64),
      'F4': midiToFrequency(65),
      'G4': midiToFrequency(67),
      'A4': midiToFrequency(69),
      'B4': midiToFrequency(71),
      'C5': midiToFrequency(72),
    };

    const freq = noteMap[fullName] || 261.63;
    const note = frequencyToNoteInfo(freq);
    if (note) {
      setConfirmedNote({ ...note });
      lastConfirmedFullNameRef.current = note.fullName;
      lastConfirmedTimeRef.current = performance.now();
      lastOnsetTimeRef.current = performance.now();
      if (onNoteDetectedRef.current) {
        onNoteDetectedRef.current(note);
      }
      setDebugInfo({
        frequency: freq,
        note,
        clarity: 1.0,
        volumeDb: -15,
        isGateOpen: true,
        timestamp: performance.now(),
      });
      addLog(`🎹 [키보드 시뮬레이션] ${note.fullName}(${note.koreanName}) ${freq.toFixed(1)}Hz`, -15, freq, note.fullName, true);

      try {
        const playCtx = audioContextManager.getContext();
        if (playCtx) {
          if (playCtx.state === 'suspended') {
            playCtx.resume().catch(() => {});
          }

          const osc = playCtx.createOscillator();
          const gain = playCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, playCtx.currentTime);
          gain.gain.setValueAtTime(0.15, playCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, playCtx.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(playCtx.destination);
          osc.start();
          osc.stop(playCtx.currentTime + 0.35);
        }
      } catch (e) {
        console.warn('Audio tone feedback skipped:', e);
      }
    }
  }, [addLog]);

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  return {
    isListening,
    isInitializing,
    error,
    confirmedNote,
    debugInfo,
    noiseThreshold,
    logs,
    startListening,
    stopListening,
    setNoiseThreshold,
    clearLogs,
    simulateNote,
    calibrationProfile,
    reloadCalibrationProfile,
  };
}
