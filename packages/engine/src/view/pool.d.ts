export declare class Pool<T> {
    private factory;
    private active;
    private inactive;
    constructor(factory: () => T);
    acquire(): T;
    release(item: T): void;
    getActive(): T[];
}
//# sourceMappingURL=pool.d.ts.map