export interface Product {
    id: string;
    price: string;
}
export interface IAP {
    getProducts(): Promise<Product[]>;
    purchase(id: string): Promise<void>;
    restore(): Promise<void>;
    isRemoveAds(): Promise<boolean>;
}
//# sourceMappingURL=iap.d.ts.map