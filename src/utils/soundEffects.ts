/**
 * Kids Piano Journey - 브라우저 네이티브 사운드 이펙트 합성기
 * 외부 mp3 파일 없이 Web Audio API 오실레이터로 맑고 따뜻한 키즈 차임/효과음 생성
 */

import { audioContextManager } from './audioContextManager';

class SoundEffectsEngine {
  private isMuted: boolean = false;
  private volume: number = 0.5; // 효과음 기본 마스터 볼륨 (0.0 ~ 1.0)

  constructor() {
    try {
      const savedVol = localStorage.getItem('piano_sfx_volume');
      if (savedVol !== null) {
        const parsed = parseFloat(savedVol);
        if (!isNaN(parsed)) {
          this.volume = Math.max(0, Math.min(1, parsed));
        }
      }
      const savedMute = localStorage.getItem('piano_sfx_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
    } catch {
      // 로컬 스토리지 접근 실패 시 기본값 사용
    }
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('piano_sfx_volume', this.volume.toString());
    } catch {
      // 무시
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('piano_sfx_muted', this.isMuted.toString());
    } catch {
      // 무시
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * 컴포넌트 언마운트 또는 세션 종료 시 AudioContext 명시적 해제
   */
  public close(): void {
    // audioContextManager에서 전역 수명주기 관리
  }

  /**
   * 딩-동-댕 칭찬 차임벨 사운드 (C5 -> E5 -> G5 영롱한 벨소리)
   */
  public playSuccessDing(): void {
    if (this.isMuted || this.volume <= 0.001) return;

    try {
      const ctx = audioContextManager.getContext();
      if (!ctx) return;
      const startTime = ctx.currentTime + 0.005;
      // 도(523.25Hz), 미(659.25Hz), 솔(783.99Hz)
      const freqs = [523.25, 659.25, 783.99];

      // 효과음 피크 게인: MR 사운드 대비 과도하게 튀지 않도록 마스터 볼륨 연동 (기본 약 0.11)
      const peakGain = Math.max(0.001, this.volume * 0.22);

      freqs.forEach((freq, idx) => {
        const noteTime = startTime + idx * 0.1;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // 맑은 벨/마림바 톤을 위한 사인파 합성
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        // 급격한 어택 후 길고 부드러운 감쇄
        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.linearRampToValueAtTime(peakGain, noteTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.65);
      });
    } catch {
      // AudioContext 초기화 실패 시 조용히 무시 (무중단 UX 보장)
    }
  }

  /**
   * 튜토리얼 5단계 올클리어 축하 팡파르 (C5 -> E5 -> G5 -> C6 반짝이는 축하 코드)
   */
  public playFanfare(): void {
    if (this.isMuted || this.volume <= 0.001) return;

    try {
      const ctx = audioContextManager.getContext();
      if (!ctx) return;
      const startTime = ctx.currentTime + 0.005;
      const notes = [
        { freq: 523.25, delay: 0.0, dur: 0.3 },   // C5
        { freq: 659.25, delay: 0.12, dur: 0.3 },  // E5
        { freq: 783.99, delay: 0.24, dur: 0.4 },  // G5
        { freq: 1046.50, delay: 0.4, dur: 1.0 },  // C6 (하이라이트)
      ];

      const peakGain = Math.max(0.001, this.volume * 0.30);

      notes.forEach(({ freq, delay, dur }) => {
        const noteTime = startTime + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle'; // 조금 더 풍성하고 따뜻한 팡파르 음색
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.linearRampToValueAtTime(peakGain, noteTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + dur + 0.05);
      });
    } catch {
      // 무중단
    }
  }
}

export const soundEffects = new SoundEffectsEngine();
