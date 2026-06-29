import { Analytics } from '../ports/analytics';

export type AnalyticsEvent = 
  | 'level_start' | 'level_complete' | 'level_fail' 
  | 'round_start' | 'game_over' 
  | 'hint_used' | 'undo_used' | 'addtube_used' | 'revive_used' 
  | 'daily_claimed' | 'streak_day' 
  | 'ad_interstitial' | 'ad_rewarded'
  | 'iap_purchase' | 'remove_ads_active' 
  | 'theme_unlocked' | 'settings_changed';

export class FirebaseAnalytics implements Analytics {
  private hasConsent = false;

  constructor(private transport: (event: string, params?: any) => void) {}

  setConsent(consent: boolean): void {
    this.hasConsent = consent;
  }

  log(event: AnalyticsEvent, params?: any): void {
    if (this.hasConsent) {
      this.transport(event, params);
    }
  }
}
