/**
 * Kids Piano Journey - 동요 실시간 Web Audio API 배경 반주(MR) 엔진
 * Android WebView (APK) 및 모바일/데스크톱 브라우저 100% 호환
 * 
 * [스피커 최적화 및 마이크 간섭 방지 음향 설계]:
 * 1. 베이스: 옥타브 배음(C3 130Hz + C4 261Hz) 합성으로 맥북/태블릿 내장 스피커에서도 풍성한 '쿵' 사운드 보장
 * 2. 피아노/마림바 코드: C4(261Hz)~G4(392Hz) 청음 대역에서 따뜻한 화음 건반 사운드 출력
 * 3. [Phase 7 Master EQ]: 플레이어 피아노 C4~G4(260Hz~420Hz) 기음 대역과의 크로스토크 오인식을 원천 차단하는
 *    마스터 Peaking/Notch 이퀄라이저(-18dB 감쇠) 버스 탑재
 * 4. linearRamp 안전 엔벨로프로 브라우저 0-value AudioParam 예외 100% 차단
 * 5. 동요 5곡('비행기', '나비야', '작은 별', '곰 세 마리', '환희의 송가') 코드 진행 자동 전환
 */

import { audioContextManager } from './audioContextManager';

export interface AccompanimentChord {
  rootNote: string;
  bassFreqs: number[];  // 옥타브 배음 베이스
  chordFreqs: number[]; // 풍성한 화음 주파수
}

// C 장조 주요 화음 정의 (플레이어 연주 대역 C4~G4 간섭 차단을 위해 250Hz 이하 저음역대 격리)
export const CHORDS: Record<'C' | 'G7', AccompanimentChord> = {
  // C 코드: C2(65.4Hz) + C3(130.8Hz) 베이스 / C3(130.8Hz), E3(164.8Hz), G3(196.0Hz) 화음
  C: {
    rootNote: 'C',
    bassFreqs: [65.41, 130.81],
    chordFreqs: [130.81, 164.81, 196.00],
  },
  // G7 코드: G1(49.0Hz) + G2(98.0Hz) 베이스 / D3(146.8Hz), F3(174.6Hz), B3(246.9Hz) 화음
  G7: {
    rootNote: 'G7',
    bassFreqs: [49.00, 98.00],
    chordFreqs: [146.83, 174.61, 246.94],
  },
};

/**
 * 곡별 8마디 코드 진행표 (마디당 4박)
 */
export const CHORD_PROGRESSIONS: Record<string, Array<'C' | 'G7'>> = {
  'song-airplane': ['C', 'C', 'G7', 'C', 'C', 'C', 'G7', 'C'],
  'song-butterfly': ['C', 'G7', 'C', 'C', 'C', 'G7', 'C', 'C'],
  'song-twinkle': ['C', 'C', 'C', 'G7', 'C', 'G7', 'C', 'C'],
  'song-three-bears': ['C', 'C', 'C', 'C', 'C', 'G7', 'G7', 'C'],
  'song-ode-to-joy': ['C', 'G7', 'C', 'G7', 'C', 'G7', 'C', 'C'],
};

class AccompanimentEngine {
  private isMuted: boolean = false;
  private volume: number = 0.9; // 기본 MR 볼륨
  private masterEqNode: BiquadFilterNode | null = null;
  private masterGainNode: GainNode | null = null;
  private lastContext: AudioContext | null = null;

  constructor() {
    try {
      const savedVol = localStorage.getItem('piano_mr_volume');
      if (savedVol !== null) {
        const parsed = parseFloat(savedVol);
        if (!isNaN(parsed)) {
          this.volume = Math.max(0, Math.min(1, parsed));
        }
      }
      const savedMute = localStorage.getItem('piano_mr_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
    } catch {
      // 로컬 스토리지 접근 실패 시 기본값 사용
    }
  }

  /**
   * [Phase 7 Master EQ Bus]: 피아노 기음 대역(C4~G4, 260~400Hz) 오인식 방지 마스터 이퀄라이저 연결
   */
  private getOrCreateMasterChain(ctx: AudioContext): GainNode {
    if (this.masterGainNode && this.lastContext === ctx) {
      return this.masterGainNode;
    }

    try {
      // 1. 피아노 C4~G4 기음 주파수 대역 간섭을 감쇠시키는 Peaking EQ (-18dB Deep Notch)
      const eq = ctx.createBiquadFilter();
      eq.type = 'peaking';
      eq.frequency.value = 330; // C4(261Hz) ~ G4(392Hz)의 중심 대역
      eq.Q.value = 1.2;
      eq.gain.value = -18; // 간섭 기음 주파수 18dB 감쇠

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(1.0, ctx.currentTime);

      eq.connect(masterGain);
      masterGain.connect(ctx.destination);

      this.masterEqNode = eq;
      this.masterGainNode = masterGain;
      this.lastContext = ctx;

      return masterGain;
    } catch {
      // 대체 경로
      const fallbackGain = ctx.createGain();
      fallbackGain.connect(ctx.destination);
      return fallbackGain;
    }
  }

  public resume(): void {
    audioContextManager.resume().catch(() => {});
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('piano_mr_volume', this.volume.toString());
    } catch {
      // 무시
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('piano_mr_muted', this.isMuted.toString());
    } catch {
      // 무시
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * 시작 카운트다운 틱 (준비 중일 때 '딱, 딱, 딱, 딱' 경쾌한 메트로놈 틱)
   */
  public playCountdownTick(count: number): void {
    if (this.isMuted) return;

    try {
      const ctx = audioContextManager.getContext();
      if (!ctx) return;

      const now = ctx.currentTime + 0.005;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(count === 1 ? 1200 : 880, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

      gain.gain.setValueAtTime(this.volume * 0.4, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.06);

      const target = this.masterEqNode || ctx.destination;
      osc.connect(gain);
      gain.connect(target);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // 무시
    }
  }

  /**
   * 박자(Beat 0~31)에 따른 반주 한 박 재생 (쿵-짝-쿵-짝 패턴)
   * @param currentBeat 현재 곡의 박자 위치 (0부터 시작)
   * @param songId 곡 식별자 ('song-airplane' | 'song-butterfly' | 'song-twinkle' 등)
   */
  public playBeat(currentBeat: number, songId: string = 'song-airplane'): void {
    if (this.isMuted || currentBeat < 0) return;

    try {
      const ctx = audioContextManager.getContext();
      if (!ctx) return;

      // 마스터 EQ 버스 준비
      this.getOrCreateMasterChain(ctx);
      const masterTarget = this.masterEqNode || ctx.destination;

      // 10ms 안전 마진 부여
      const now = ctx.currentTime + 0.01;

      const progression = CHORD_PROGRESSIONS[songId] || CHORD_PROGRESSIONS['song-airplane'];
      const beatInMeasure = Math.floor(currentBeat) % 4; // 0, 1, 2, 3
      const measureIndex = Math.min(Math.floor(currentBeat / 4), progression.length - 1);
      const currentChordType = progression[measureIndex];
      const chord = CHORDS[currentChordType];

      // 1. 박자별 베이스 (1박과 3박에 묵직하고 따뜻한 쿵 소리)
      if (beatInMeasure === 0 || beatInMeasure === 2) {
        chord.bassFreqs.forEach((freq, idx) => {
          const bassOsc = ctx.createOscillator();
          const bassGain = ctx.createGain();

          bassOsc.type = idx === 0 ? 'triangle' : 'sine';
          bassOsc.frequency.setValueAtTime(freq, now);

          // 스피커 최적화: 1박/3박 베이스 음량 강화
          const bassVol = idx === 0 ? this.volume * 0.65 : this.volume * 0.48;
          bassGain.gain.setValueAtTime(0.001, now);
          bassGain.gain.linearRampToValueAtTime(bassVol, now + 0.02);
          bassGain.gain.linearRampToValueAtTime(0.001, now + 0.42);

          bassOsc.connect(bassGain);
          bassGain.connect(masterTarget);

          bassOsc.start(now);
          bassOsc.stop(now + 0.45);
        });
      }

      // 2. 화음 코드 건반 (매 박마다 맑고 따뜻한 피아노/마림바 화음 사운드)
      chord.chordFreqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // 맑고 청아한 건반 느낌의 삼각파(Triangle) 합성
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        // 화음 코드가 효과음에 묻히지 않도록 충분한 볼륨 확보
        const isUpbeat = beatInMeasure === 1 || beatInMeasure === 3;
        const attackLevel = isUpbeat ? this.volume * 0.52 : this.volume * 0.44;

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(attackLevel, now + 0.025);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(masterTarget);

        osc.start(now);
        osc.stop(now + 0.38);
      });

      // 3. 경쾌한 리듬 퍼커션 틱 (2박과 4박에 나무블록 틱 소리)
      if (beatInMeasure === 1 || beatInMeasure === 3) {
        const tickOsc = ctx.createOscillator();
        const tickGain = ctx.createGain();

        // 마이크 LPF(1200Hz) 차단 영역인 1800Hz 대역의 경쾌한 림샷 틱
        tickOsc.type = 'sine';
        tickOsc.frequency.setValueAtTime(1800, now);
        tickOsc.frequency.exponentialRampToValueAtTime(1400, now + 0.04);

        tickGain.gain.setValueAtTime(this.volume * 0.16, now);
        tickGain.gain.linearRampToValueAtTime(0.001, now + 0.05);

        tickOsc.connect(tickGain);
        tickGain.connect(masterTarget);

        tickOsc.start(now);
        tickOsc.stop(now + 0.06);
      }
    } catch (e) {
      console.warn('[Accompaniment Error]', e);
    }
  }

  /**
   * 일시정지 또는 정지 시 진행 중인 반주 잔향 즉각 차단
   */
  public stop(): void {
    if (this.masterGainNode && this.lastContext) {
      try {
        const now = this.lastContext.currentTime;
        this.masterGainNode.gain.cancelScheduledValues(now);
        this.masterGainNode.gain.setValueAtTime(0.0001, now);
        // 다음 음표/재개 시 정상 볼륨으로 복귀되도록 약간 뒤 1.0 예약
        this.masterGainNode.gain.setValueAtTime(1.0, now + 0.05);
      } catch {
        // 무시
      }
    }
  }

  public close(): void {
    if (this.masterGainNode) {
      try {
        this.masterGainNode.disconnect();
      } catch {
        // 무시
      }
      this.masterGainNode = null;
    }
    if (this.masterEqNode) {
      try {
        this.masterEqNode.disconnect();
      } catch {
        // 무시
      }
      this.masterEqNode = null;
    }
    this.lastContext = null;
  }
}

export const accompaniment = new AccompanimentEngine();
