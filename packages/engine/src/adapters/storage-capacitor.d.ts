import { Storage } from '../ports/storage';
export declare class CapacitorStorage implements Storage {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
}
//# sourceMappingURL=storage-capacitor.d.ts.map