/**
 * 軽量レトロSEシンセ（WebAudio直叩き、外部アセットなし）。
 * オシレータ＋エンベロープ＋ノイズで ZzFX 的な8bit風SEを生成する。
 * AudioContext はブラウザ仕様上、最初のユーザー操作後に作る。
 */
type SfxName =
  | 'shoot'
  | 'hit'
  | 'kill'
  | 'gem'
  | 'levelup'
  | 'evolve'
  | 'hurt'
  | 'pickup'
  | 'boss'
  | 'explosion'
  | 'devour'
  | 'death'
  | 'select';

interface SfxDef {
  type: OscillatorType | 'noise';
  freq: number;
  freqEnd: number;
  duration: number;
  volume: number;
}

const SFX: Record<SfxName, SfxDef> = {
  shoot: { type: 'square', freq: 880, freqEnd: 440, duration: 0.06, volume: 0.06 },
  hit: { type: 'square', freq: 320, freqEnd: 180, duration: 0.05, volume: 0.08 },
  kill: { type: 'sawtooth', freq: 520, freqEnd: 80, duration: 0.14, volume: 0.12 },
  gem: { type: 'sine', freq: 920, freqEnd: 1500, duration: 0.07, volume: 0.07 },
  levelup: { type: 'square', freq: 440, freqEnd: 1320, duration: 0.3, volume: 0.14 },
  evolve: { type: 'sawtooth', freq: 220, freqEnd: 1760, duration: 0.6, volume: 0.16 },
  hurt: { type: 'sawtooth', freq: 180, freqEnd: 60, duration: 0.18, volume: 0.16 },
  pickup: { type: 'triangle', freq: 660, freqEnd: 1320, duration: 0.12, volume: 0.12 },
  boss: { type: 'sawtooth', freq: 110, freqEnd: 55, duration: 0.8, volume: 0.2 },
  explosion: { type: 'noise', freq: 0, freqEnd: 0, duration: 0.35, volume: 0.18 },
  devour: { type: 'sine', freq: 1200, freqEnd: 200, duration: 0.25, volume: 0.16 },
  death: { type: 'sawtooth', freq: 440, freqEnd: 30, duration: 0.9, volume: 0.22 },
  select: { type: 'square', freq: 660, freqEnd: 880, duration: 0.05, volume: 0.08 },
};

export class AudioManager {
  private ctx: AudioContext | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private lastPlayed = new Map<SfxName, number>();
  muted = false;

  /** ユーザー操作のタイミングで呼ぶ */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      this.ctx = new AudioContext();
      const len = this.ctx.sampleRate * 0.5;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    } catch {
      this.ctx = null;
    }
  }

  play(name: SfxName): void {
    if (this.muted || !this.ctx) return;
    const now = performance.now();
    // 同種SEの連打を間引く（特に shoot / gem / hit）
    const last = this.lastPlayed.get(name) ?? 0;
    const minGap = name === 'shoot' || name === 'gem' || name === 'hit' ? 45 : 25;
    if (now - last < minGap) return;
    this.lastPlayed.set(name, now);

    const def = SFX[name];
    const t = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(def.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + def.duration);
    gain.connect(this.ctx.destination);

    if (def.type === 'noise') {
      if (!this.noiseBuf) return;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, t);
      filter.frequency.exponentialRampToValueAtTime(120, t + def.duration);
      src.connect(filter);
      filter.connect(gain);
      src.start(t);
      src.stop(t + def.duration);
    } else {
      const osc = this.ctx.createOscillator();
      osc.type = def.type;
      osc.frequency.setValueAtTime(def.freq, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, def.freqEnd), t + def.duration);
      osc.connect(gain);
      osc.start(t);
      osc.stop(t + def.duration);
    }
  }
}

export const audio = new AudioManager();
