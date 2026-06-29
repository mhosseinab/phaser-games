import { IAP, Product } from '../ports/iap';
export declare class FakeIAP implements IAP {
    getProducts(): Promise<Product[]>;
    purchase(id: string): Promise<void>;
    restore(): Promise<void>;
    isRemoveAds(): Promise<boolean>;
}
//# sourceMappingURL=fake-iap.d.ts.map