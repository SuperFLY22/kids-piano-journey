/**
 * Kids Piano Journey - 전역 단일 AudioContext 공유 싱글톤 매니저
 * 
 * 브라우저 다중 AudioContext 생성 제한(Chrome 6개 한도) 및 자동 일시중단 방지
 * 효과음(soundEffects)과 배경반주(accompaniment)가 단 하나의 컨텍스트를 공유하여
 * 한 번의 사용자 제스처로 모든 사운드가 즉시 100% 동기화 재생되도록 보장
 */

class AudioContextManager {
  private static instance: AudioContextManager;
  private audioCtx: AudioContext | null = null;

  private constructor() {}

  public static getInstance(): AudioContextManager {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager();
    }
    return AudioContextManager.instance;
  }

  /**
   * 공유 AudioContext 인스턴스 반환 (지연 초기화)
   */
  public getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return null;
      this.audioCtx = new AudioCtxClass();
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  /**
   * 사용자 클릭/터치 이벤트 핸들러에서 호출하여 AudioContext 즉시 활성화
   */
  public async resume(): Promise<void> {
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // 무시
      }
    }
  }

  private micContext: AudioContext | null = null;

  /**
   * 마이크 분석 전용 AudioContext 반환 (전역 풀 관리 및 누수 방지)
   */
  public getOrCreateMicContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.micContext || this.micContext.state === 'closed') {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return null;
      this.micContext = new AudioCtxClass();
    }

    if (this.micContext.state === 'suspended') {
      this.micContext.resume().catch(() => {});
    }

    return this.micContext;
  }

  /**
   * 마이크 분석 AudioContext 정상 해제
   */
  public closeMicContext(): void {
    if (this.micContext && this.micContext.state !== 'closed') {
      try {
        this.micContext.close().catch(() => {});
      } catch {
        // 무시
      } finally {
        this.micContext = null;
      }
    }
  }

  /**
   * 전체 오디오 컨텍스트 닫기 (세션 종료 시)
   */
  public close(): void {
    this.closeMicContext();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close().catch(() => {});
      } catch {
        // 무시
      } finally {
        this.audioCtx = null;
      }
    }
  }
}

export const audioContextManager = AudioContextManager.getInstance();
