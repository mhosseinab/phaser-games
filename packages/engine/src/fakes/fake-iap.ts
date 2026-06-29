import { IAP, Product } from '../ports/iap';

export class FakeIAP implements IAP {
  async getProducts(): Promise<Product[]> { return []; }
  async purchase(id: string): Promise<void> {}
  async restore(): Promise<void> {}
  async isRemoveAds(): Promise<boolean> { return false; }
}
