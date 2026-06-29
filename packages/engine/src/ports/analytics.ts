export interface Analytics {
  setConsent(bool: boolean): void;
  log(event: string, params?: Record<string, any>): void;
}
