import { IAP, Product } from '../ports/iap';
import type { Purchases } from '@revenuecat/purchases-capacitor';

export const createRevenueCatIAP = (rcClient: typeof Purchases | any): IAP => {
  return {
    async getProducts(): Promise<Product[]> {
      const offerings = await rcClient.getOfferings();
      if (!offerings.current) return [];
      return offerings.current.availablePackages.map((p: any) => ({
        id: p.product.identifier,
        price: p.product.priceString,
      }));
    },
    async purchase(id: string): Promise<void> {
      await rcClient.purchasePackage({ identifier: id });
    },
    async restore(): Promise<void> {
      await rcClient.restorePurchases();
    },
    async isRemoveAds(): Promise<boolean> {
      const info = await rcClient.getCustomerInfo();
      return !!info.entitlements.active['remove_ads'];
    }
  };
};
