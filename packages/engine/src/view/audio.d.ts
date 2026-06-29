import { AudioBus } from '../ports/audio';
export declare class WebAudioBus implements AudioBus {
    private context;
    private buffers;
    private muted;
    constructor();
    setMuted(muted: boolean): void;
    play(key: string): void;
    stop(key: string): void;
    addBuffer(key: string, buffer: AudioBuffer): void;
}
//# sourceMappingURL=audio.d.ts.map