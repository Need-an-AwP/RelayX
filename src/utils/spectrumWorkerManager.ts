type SpectrumWorkerListener = (event: MessageEvent) => void;

class SpectrumWorkerManager {
    private static instance: SpectrumWorkerManager;
    private worker: Worker | null = null;
    private listeners: Map<string, SpectrumWorkerListener> = new Map();

    // The constructor is private to ensure a single instance.
    private constructor() {}

    public static getInstance(): SpectrumWorkerManager {
        if (!SpectrumWorkerManager.instance) {
            SpectrumWorkerManager.instance = new SpectrumWorkerManager();
        }
        return SpectrumWorkerManager.instance;
    }

    public initialize() {
        if (this.worker) {
            return;
        }

        // Load the worker from the public path.
        this.worker = new Worker('spectrumWorker.js');

        this.worker.onmessage = (event: MessageEvent) => {
            if (event.data.type === 'ready') {
                console.log("Spectrum worker is ready.");
            } else {
                this.listeners.forEach(listener => listener(event));
            }
        };

        this.worker.onerror = (error) => {
            console.error("Error in SpectrumWorkerManager:", error);
            this.terminate();
        };

        // console.log("Spectrum worker initialized.");
    }

    public postMessage(message: any, transfer?: Transferable[]) {
        if (!this.worker) {
            console.warn("Worker is not initialized. Call initialize() first.");
            return;
        }

        if (transfer) {
            this.worker.postMessage(message, transfer);
        } else {
            this.worker.postMessage(message);
        }
    }

    public addCanvas(id: string, canvas: OffscreenCanvas, config: any) {
        this.postMessage({
            type: 'add-canvas',
            payload: { id, canvas, config }
        }, [canvas]);
    }

    public removeCanvas(id: string) {
        this.postMessage({
            type: 'remove-canvas',
            payload: { id }
        });
    }

    public render(id: string, dataArray: Uint8Array) {
        this.postMessage({
            type: 'render',
            payload: { id, dataArray }
        }, [dataArray.buffer]);
    }

    public updateConfig(id: string, config: any) {
        this.postMessage({
            type: 'update-config',
            payload: { id, config }
        });
    }

    public addListener(id: string, callback: SpectrumWorkerListener) {
        this.listeners.set(id, callback);
    }

    public removeListener(id: string) {
        this.listeners.delete(id);
    }

    public terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            this.listeners.clear();
            console.log("Spectrum worker terminated.");
        }
    }
}

export const spectrumWorkerManager = SpectrumWorkerManager.getInstance(); 