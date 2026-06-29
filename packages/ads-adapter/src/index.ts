import { Capacitor } from '@capacitor/core';
import { AdmobAds } from './admob';
import { WebAds } from './web-ads';
import { UmpConsentManager } from './ump';
import { Ads, ConsentManager } from '@blublux/engine';

export const createAds = (): Ads => {
  return Capacitor.getPlatform() === 'web' ? new WebAds() : new AdmobAds();
};

export const createConsentManager = (): ConsentManager => {
  return new UmpConsentManager();
};
