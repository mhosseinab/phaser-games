import { describe, it, expect, vi } from 'vitest';
import { createRevenueCatIAP } from './iap-revenuecat';

describe('IAPAdapter (RevenueCat)', () => {
  it('maps products and remove_ads', async () => {
    const fakeClient = {
      getOfferings: vi.fn().mockResolvedValue({
        current: {
          availablePackages: [
            { product: { identifier: 'remove_ads', priceString: '$1.99' } }
          ]
        }
      }),
      purchasePackage: vi.fn(),
      restorePurchases: vi.fn(),
      getCustomerInfo: vi.fn().mockResolvedValue({
        entitlements: { active: { remove_ads: {} } }
      })
    };

    const iap = createRevenueCatIAP(fakeClient as any);
    const products = await iap.getProducts();
    expect(products.length).toBe(1);
    expect(products[0]?.id).toBe('remove_ads');

    expect(await iap.isRemoveAds()).toBe(true);
  });
});
