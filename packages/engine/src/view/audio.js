export class WebAudioBus {
    context = null;
    buffers = new Map();
    muted = false;
    constructor() {
        if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            this.context = new Ctx();
        }
    }
    setMuted(muted) {
        this.muted = muted;
    }
    play(key) {
        if (this.muted || !this.context)
            return;
        const buffer = this.buffers.get(key);
        if (!buffer)
            return;
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        source.connect(this.context.destination);
        source.start(0);
    }
    stop(key) {
    }
    addBuffer(key, buffer) {
        this.buffers.set(key, buffer);
    }
}
//# sourceMappingURL=audio.js.map