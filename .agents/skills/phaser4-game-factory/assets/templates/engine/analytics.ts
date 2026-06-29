// @studio/engine — analytics wrapper. Initialize Firebase/GA4 only AFTER consent.
// Event names follow GA4's game taxonomy (references/05-production-checklist.md §Analytics).
export type GameEvent =
  | 'level_start' | 'level_end' | 'level_up' | 'post_score'
  | 'tutorial_begin' | 'tutorial_complete' | 'unlock_achievement'
  | 'earn_virtual_currency' | 'spend_virtual_currency'
  | 'ad_impression' | 'game_over';

export interface Analytics {
  enabled: boolean;
  log(event: GameEvent | string, params?: Record<string, string | number | boolean>): void;
}

/** No-op until consent is granted; swap in the real Firebase impl after UMP resolves. */
export class ConsentGatedAnalytics implements Analytics {
  enabled = false;
  private sink?: (e: string, p?: Record<string, unknown>) => void;
  /** Call after consent: pass the firebase logEvent function (or a Capacitor Firebase plugin). */
  enable(sink: (e: string, p?: Record<string, unknown>) => void) { this.sink = sink; this.enabled = true; }
  log(event: string, params?: Record<string, string | number | boolean>) {
    if (!this.enabled || !this.sink) return;           // never send before consent
    if (event.length > 40) event = event.slice(0, 40); // GA4 name limit
    this.sink(event, params);
  }
}
