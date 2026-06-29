export interface AudioBus {
  play(key: string): void;
  stop(key: string): void;
  setMuted(muted: boolean): void;
}
