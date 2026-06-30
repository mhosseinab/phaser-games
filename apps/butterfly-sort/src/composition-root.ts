import { createAds } from '@blublux/ads-adapter';
import { 
  FakeAnalytics,
  NoopHaptics,
  SystemClock,
  createRng,
  WebAudioBus
} from '@blublux/engine';
import { SortScenePorts } from '@blublux/engine-sort';

export function createPorts(): SortScenePorts {
  return {
    ads: createAds(),
    analytics: new FakeAnalytics(),
    audio: new WebAudioBus(),
    haptics: new NoopHaptics(),
    rng: createRng(SystemClock.now()),
    clock: SystemClock
  };
}
