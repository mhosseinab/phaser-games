export declare class RemoteConfig {
    private fetcher?;
    private defaults;
    constructor(fetcher?: ((key: string) => number | boolean | undefined) | undefined);
    getNumber(key: string, defaultVal?: number): number;
    getBool(key: string, defaultVal?: boolean): boolean;
}
//# sourceMappingURL=remote-config.d.ts.map