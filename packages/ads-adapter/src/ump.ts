import { ConsentManager } from '@blublux/engine';
import { AdMob } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

export class UmpConsentManager implements ConsentManager {
  async request(): Promise<{ canRequestAds: boolean }> {
    if (Capacitor.getPlatform() === 'web') {
      return { canRequestAds: true };
    }
    
    await AdMob.initialize({});
    
    const info = await AdMob.requestConsentInfo();
    if (info.status === 'REQUIRED') {
      await AdMob.showConsentForm();
    }
    
    const finalInfo = await AdMob.requestConsentInfo();
    const canRequestAds = finalInfo.status === 'OBTAINED' || finalInfo.status === 'NOT_REQUIRED';
    
    return { canRequestAds };
  }
}
