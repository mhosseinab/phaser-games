export const SystemClock = {
    now() {
        // This is the ONE sanctioned Date.now() site
        return Date.now();
    }
};
export class FakeClock {
    time;
    constructor(time = 0) {
        this.time = time;
    }
    now() {
        return this.time;
    }
    advance(ms) {
        this.time += ms;
    }
}
//# sourceMappingURL=clock.js.map