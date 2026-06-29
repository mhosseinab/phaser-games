import { ConsentManager } from '../ports/consent';

export class FakeConsent implements ConsentManager {
  async request(): Promise<{ canRequestAds: boolean }> {
    return { canRequestAds: true };
  }
}
