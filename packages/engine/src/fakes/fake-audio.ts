import { AudioBus } from '../ports/audio';

export class FakeAudioBus implements AudioBus {
  play(key: string): void {}
  stop(key: string): void {}
  setMuted(muted: boolean): void {}
}
