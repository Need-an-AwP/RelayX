export class AudioElementManager {
    private audioElement: HTMLAudioElement | null = null;
    private destinationStream: MediaStream;
    
    constructor(destinationStream: MediaStream) {
        this.destinationStream = destinationStream;
        this.createAutoPlayAudioElement();
    }
    
    private createAutoPlayAudioElement(): void {
        this.audioElement = new Audio();
        this.audioElement.id = 'global-audio-player';
        this.audioElement.autoplay = true;
        this.audioElement.controls = false;
        this.audioElement.style.display = 'none';
        this.audioElement.volume = 1.0;
        
        document.body.appendChild(this.audioElement);
        this.audioElement.srcObject = this.destinationStream;
    }
    
    public updateAudioSource(newStream: MediaStream): void {
        if (this.audioElement) {
            this.audioElement.srcObject = newStream;
        }
    }
    
    public cleanup(): void {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.srcObject = null;
            document.body.removeChild(this.audioElement);
            this.audioElement = null;
        }
    }
}