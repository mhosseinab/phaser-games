import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Settings } from './settings';
import { Storage } from '../ports/storage';
import { Analytics } from '../ports/analytics';
import { AudioBus } from '../ports/audio';
import { Haptics } from '../ports/haptics';
import { ConsentManager } from '../ports/consent';
import { IAP } from '../ports/iap';

class MockStorage implements Storage {
  private data = new Map<string, string>();
  async getItem(key: string) { return this.data.get(key) || null; }
  async setItem(key: string, value: string) { this.data.set(key, value); }
  async remove(key: string) { this.data.delete(key); }
}

describe('Settings', () => {
  let storage: Storage;
  let analytics: Analytics;
  let audio: AudioBus;
  let haptics: Haptics;
  let consent: ConsentManager;
  let iap: IAP;
  let settings: Settings;

  beforeEach(async () => {
    storage = new MockStorage();
    analytics = { log: vi.fn(), setConsent: vi.fn() } as unknown as Analytics;
    audio = { setMuted: vi.fn(), play: vi.fn(), stop: vi.fn() } as unknown as AudioBus;
    haptics = { vibrate: vi.fn() } as unknown as Haptics;
    consent = { request: vi.fn().mockResolvedValue({ canRequestAds: true }) } as unknown as ConsentManager;
    iap = { restore: vi.fn(), getProducts: vi.fn(), purchase: vi.fn(), isRemoveAds: vi.fn() } as unknown as IAP;
    
    settings = new Settings(storage, analytics, audio, haptics, consent, iap);
    await settings.init();
  });

  it('initializes with default values', () => {
    expect(settings.get('colorblindMode')).toBe(false);
    expect(settings.get('sound')).toBe(true);
  });

  it('can toggle settings and persist them', async () => {
    await settings.toggle('colorblindMode');
    expect(settings.get('colorblindMode')).toBe(true);
    
    const saved = await storage.getItem('blublux_settings');
    expect(saved).toContain('"colorblindMode":true');
    expect(analytics.log).toHaveBeenCalledWith('settings_changed', { key: 'colorblindMode', value: true });
  });

  it('updates audio bus when sound is toggled', async () => {
    await settings.toggle('sound');
    expect(settings.get('sound')).toBe(false);
  });

  it('can restore purchases', async () => {
    await settings.restorePurchases();
    expect(iap.restore).toHaveBeenCalled();
  });

  it('can reopen consent', async () => {
    await settings.reopenConsent();
    expect(consent.request).toHaveBeenCalled();
  });
});
