import { AudioBus } from '../ports/audio';

export class WebAudioBus implements AudioBus {
  private context: AudioContext | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private muted = false;

  constructor() {
    if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      this.context = new Ctx();
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  play(key: string): void {
    if (this.muted || !this.context) return;
    const buffer = this.buffers.get(key);
    if (!buffer) return;
    
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    source.start(0);
  }

  stop(key: string): void {
  }
  
  addBuffer(key: string, buffer: AudioBuffer): void {
    this.buffers.set(key, buffer);
  }
}
