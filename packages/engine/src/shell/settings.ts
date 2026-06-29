import { Storage } from '../ports/storage';
import { Analytics } from '../ports/analytics';
import { AudioBus } from '../ports/audio';
import { Haptics } from '../ports/haptics';
import { ConsentManager } from '../ports/consent';
import { IAP } from '../ports/iap';

export interface SettingsState {
  colorblindMode: boolean;
  reducedMotion: boolean;
  sound: boolean;
  music: boolean;
  haptics: boolean;
}

export class Settings {
  private state: SettingsState = {
    colorblindMode: false,
    reducedMotion: false,
    sound: true,
    music: true,
    haptics: true
  };
  private readonly storageKey = 'blublux_settings';

  constructor(
    private storage: Storage,
    private analytics: Analytics,
    private audio: AudioBus,
    private hapticsPort: Haptics,
    private consentManager: ConsentManager,
    private iap: IAP
  ) {}

  async init(): Promise<void> {
    const saved = await this.storage.getItem(this.storageKey);
    if (saved) {
      this.state = { ...this.state, ...JSON.parse(saved) };
    } else {
      if (typeof window !== 'undefined' && window.matchMedia) {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (mq.matches) {
          this.state.reducedMotion = true;
        }
      }
    }
    
    this.applyAudioState();
  }

  get<K extends keyof SettingsState>(key: K): SettingsState[K] {
    return this.state[key];
  }

  async toggle(key: keyof SettingsState): Promise<void> {
    this.state[key] = !this.state[key];
    await this.storage.setItem(this.storageKey, JSON.stringify(this.state));
    
    if (key === 'sound' || key === 'music') {
      this.applyAudioState();
    }
    
    this.analytics.log('settings_changed', { key, value: this.state[key] });
  }

  private applyAudioState() {
    this.audio.setMuted(!this.state.sound);
  }

  async restorePurchases(): Promise<void> {
    await this.iap.restore();
  }

  async reopenConsent(): Promise<void> {
    await this.consentManager.request();
  }
}
