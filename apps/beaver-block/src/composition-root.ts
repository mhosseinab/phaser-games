import { createAds, createConsentManager } from '@blublux/ads-adapter';
import { 
  FakeAnalytics,
  NoopHaptics,
  SystemClock,
  createRng,
  WebAudioBus
} from '@blublux/engine';
import { BlockScenePorts } from '@blublux/engine-block/src/view/BlockScene';

export function createPorts(seed: number): BlockScenePorts & { consentManager: any } {
  return {
    ads: createAds(),
    consentManager: createConsentManager(),
    analytics: new FakeAnalytics(),
    audio: new WebAudioBus(),
    haptics: new NoopHaptics(),
    rng: createRng(seed),
    clock: SystemClock
  };
}
