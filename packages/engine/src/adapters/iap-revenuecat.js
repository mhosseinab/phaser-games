export const createRevenueCatIAP = (rcClient) => {
    return {
        async getProducts() {
            const offerings = await rcClient.getOfferings();
            if (!offerings.current)
                return [];
            return offerings.current.availablePackages.map((p) => ({
                id: p.product.identifier,
                price: p.product.priceString,
            }));
        },
        async purchase(id) {
            await rcClient.purchasePackage({ identifier: id });
        },
        async restore() {
            await rcClient.restorePurchases();
        },
        async isRemoveAds() {
            const info = await rcClient.getCustomerInfo();
            return !!info.entitlements.active['remove_ads'];
        }
    };
};
//# sourceMappingURL=iap-revenuecat.js.map