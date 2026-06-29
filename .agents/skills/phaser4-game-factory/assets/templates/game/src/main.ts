// Per-game entry point. Wires the shared engine config, the ad adapter, and scenes.
import Phaser from 'phaser';
import { createGameConfig, BootScene, PreloaderScene, createAds } from '@studio/engine';
// import { GameScene } from './scenes/GameScene';

async function boot() {
  // 1) Ads + consent FIRST (UMP gates ad loading). Game still starts if this fails.
  const ads = createAds();
  try {
    await ads.init({
      admob: {
        bannerId: import.meta.env.VITE_ADMOB_BANNER ?? '',
        interstitialId: import.meta.env.VITE_ADMOB_INTERSTITIAL ?? '',
        rewardedId: import.meta.env.VITE_ADMOB_REWARDED ?? '',
      },
      testMode: import.meta.env.DEV,
      interstitial: { minIntervalSec: 45, minActions: 2 },
      // web: { interstitial: ..., rewarded: ... }  // wire your portal SDK (see ads-adapter.ts example)
    });
  } catch (e) { console.warn('Ads init failed; continuing without ads', e); }

  // 2) Start Phaser with shared, mobile-correct config.
  const config = createGameConfig({
    width: 720,
    height: 1280,
    scenes: [
      BootScene,
      new PreloaderScene({ pack: 'assets/preload-asset-pack.json', next: 'Game' }),
      // GameScene,
    ],
  });
  new Phaser.Game(config);
}

boot();
