import Phaser from 'phaser';
import { makeGameConfig } from '@blublux/engine';
import { createAds } from '@blublux/ads-adapter';
import { BootScene } from './scenes/boot';
import { SortScene } from '@blublux/engine-sort';

async function boot() {
  const ads = createAds();
  try {
    const consentManager = (await import('@blublux/ads-adapter')).createConsentManager();
    const { canRequestAds } = await consentManager.request();
    ads.init(canRequestAds);
  } catch (e) { console.warn('Ads init failed', e); }

  const config = makeGameConfig({
    width: 1080,
    height: 1920,
    parent: 'game',
    scenes: [
      BootScene,
      SortScene,
    ],
  });
  new Phaser.Game(config);
}

boot();
