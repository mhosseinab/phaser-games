export interface Clock {
    now(): number;
}
export declare const SystemClock: Clock;
export declare class FakeClock implements Clock {
    time: number;
    constructor(time?: number);
    now(): number;
    advance(ms: number): void;
}
//# sourceMappingURL=clock.d.ts.map