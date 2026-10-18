declare module 'pitchfinder' {
  export interface YinConfig {
    sampleRate?: number;
    threshold?: number;
    probabilityThreshold?: number;
  }

  export interface AmdfConfig {
    sampleRate?: number;
    minFrequency?: number;
    maxFrequency?: number;
    sensitivity?: number;
    ratio?: number;
  }

  export function YIN(config?: YinConfig): (float32AudioBuffer: Float32Array) => number | null;
  export function AMDF(config?: AmdfConfig): (float32AudioBuffer: Float32Array) => number | null;
  export function DynamicWavelet(config?: Record<string, unknown>): (float32AudioBuffer: Float32Array) => number | null;
  export function Macleod(config?: Record<string, unknown>): (float32AudioBuffer: Float32Array) => { freq: number; probability: number } | null;
}
