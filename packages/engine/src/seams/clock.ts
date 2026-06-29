export interface Clock {
  now(): number;
}

export const SystemClock: Clock = {
  now() {
    // This is the ONE sanctioned Date.now() site
    return Date.now();
  }
};

export class FakeClock implements Clock {
  constructor(public time: number = 0) {}
  now() {
    return this.time;
  }
  advance(ms: number) {
    this.time += ms;
  }
}
