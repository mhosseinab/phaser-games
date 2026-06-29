export class ScaleHelper {
    width;
    height;
    safeArea;
    constructor(width, height, safeArea = { top: 0, bottom: 0, left: 0, right: 0 }) {
        this.width = width;
        this.height = height;
        this.safeArea = safeArea;
    }
    getFitTransform(screenWidth, screenHeight) {
        const safeW = screenWidth - this.safeArea.left - this.safeArea.right;
        const safeH = screenHeight - this.safeArea.top - this.safeArea.bottom;
        const scaleX = safeW / this.width;
        const scaleY = safeH / this.height;
        const scale = Math.min(scaleX, scaleY);
        const offsetX = this.safeArea.left + (safeW - this.width * scale) / 2;
        const offsetY = this.safeArea.top + (safeH - this.height * scale) / 2;
        return { scale, offsetX, offsetY };
    }
}
//# sourceMappingURL=scale.js.map