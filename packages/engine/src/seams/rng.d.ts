export interface Rng {
    next(): number;
    intRange(min: number, max: number): number;
    pick<T>(arr: T[]): T;
    shuffle<T>(arr: T[]): T[];
    fork(): Rng;
}
export declare function createRng(seed: number): Rng;
//# sourceMappingURL=rng.d.ts.map