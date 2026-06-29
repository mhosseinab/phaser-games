import { Storage } from '../ports/storage';
export declare class MemoryStorage implements Storage {
    private data;
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
}
//# sourceMappingURL=memory-storage.d.ts.map