export interface SafeArea {
    top: number;
    bottom: number;
    left: number;
    right: number;
}
export declare class ScaleHelper {
    width: number;
    height: number;
    safeArea: SafeArea;
    constructor(width: number, height: number, safeArea?: SafeArea);
    getFitTransform(screenWidth: number, screenHeight: number): {
        scale: number;
        offsetX: number;
        offsetY: number;
    };
}
//# sourceMappingURL=scale.d.ts.map