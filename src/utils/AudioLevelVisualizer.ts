class AudioVisualizer {
    private audioContext: AudioContext;
    private analyser: AnalyserNode;
    private source: MediaStreamAudioSourceNode;
    private canvas: HTMLCanvasElement;
    private canvasContext: CanvasRenderingContext2D;
    private bufferLength: number;
    private dataArray: Uint8Array;
    private isRunning: boolean = false;

    constructor(audioStream: MediaStream, canvas: HTMLCanvasElement, fftSize: number = 256) {
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = fftSize;
        this.source = this.audioContext.createMediaStreamSource(audioStream);
        this.source.connect(this.analyser);
        this.canvas = canvas;
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get 2D context from canvas');
        }
        this.canvasContext = ctx;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
    }

    public start(): void {
        this.isRunning = true;
        this.draw();
    }

    public cleanup(): void {
        this.isRunning = false;
        this.source.disconnect();
        this.analyser.disconnect();
        this.audioContext.close();
    }

    private draw(): void {
        if (!this.isRunning) return;
        
        requestAnimationFrame(this.draw.bind(this));

        this.analyser.getByteFrequencyData(this.dataArray);

        this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const barWidth = this.canvas.width / this.bufferLength;
        let x = 0;

        for (let i = 0; i < this.bufferLength; i++) {
            const barHeight = this.dataArray[i];
            this.canvasContext.fillStyle = `rgb(${barHeight + 100},180,200)`;
            this.canvasContext.fillRect(x, this.canvas.height - barHeight / 2, barWidth, barHeight / 2);
            x += barWidth;
        }
    }
}

export default AudioVisualizer;