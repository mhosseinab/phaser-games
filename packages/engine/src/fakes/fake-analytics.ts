import { Analytics } from '../ports/analytics';

export class FakeAnalytics implements Analytics {
  private consent = false;
  public events: { event: string; params?: Record<string, any> }[] = [];

  setConsent(bool: boolean): void {
    this.consent = bool;
  }

  log(event: string, params?: Record<string, any>): void {
    if (!this.consent) return; // drop pre-consent
    this.events.push({ event, params });
  }
}
