export interface ConsentManager {
  request(): Promise<{ canRequestAds: boolean }>;
}
