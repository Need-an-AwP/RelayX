
type DrawCallback = (timestamp: number) => void;

class AnimationLoopManager {
    private callbacks: Map<string, DrawCallback> = new Map();
    private animationFrameId: number | null = null;

    private loop = (timestamp: number) => {
        this.callbacks.forEach(callback => callback(timestamp));
        if (this.callbacks.size > 0) {
            this.animationFrameId = requestAnimationFrame(this.loop);
        } else {
            this.animationFrameId = null;
        }
    };

    public add(id: string, callback: DrawCallback) {
        this.callbacks.set(id, callback);
        if (this.animationFrameId === null) {
            this.animationFrameId = requestAnimationFrame(this.loop);
        }
    }

    public remove(id: string) {
        this.callbacks.delete(id);
        if (this.callbacks.size === 0 && this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
}

export const animationLoopManager = new AnimationLoopManager(); 