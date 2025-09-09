import { MainAudioNodes } from "./nodes/MainAudioNodes";
import { PeerNodeManager } from "./nodes/PeerNodeManager";
import { TrackNodeManager } from "./nodes/TrackNodeManager";
import { AudioElementManager } from "./utils/AudioElementManager";

class AudioContextManager {
    private static instance: AudioContextManager | null = null;
    private audioContext: AudioContext;
    private mainNodes: MainAudioNodes;
    private peerManager: PeerNodeManager;
    private trackManager: TrackNodeManager;
    private elementManager: AudioElementManager;
    private isInitialized: boolean = false;

    private constructor() {
        this.audioContext = new AudioContext();
        this.mainNodes = new MainAudioNodes(this.audioContext);
        this.peerManager = new PeerNodeManager(this.audioContext, this.mainNodes);
        this.trackManager = new TrackNodeManager(this.audioContext, this.peerManager);
        this.peerManager.setTrackManager(this.trackManager);
        this.elementManager = new AudioElementManager(this.mainNodes.mainDestination.stream);
    }

    public static getInstance(): AudioContextManager {
        if (!AudioContextManager.instance) {
            AudioContextManager.instance = new AudioContextManager();
        }
        return AudioContextManager.instance;
    }

    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            // 如果 AudioContext 处于 suspended 状态，尝试恢复
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.isInitialized = true;
            console.log('[AudioContextManager] Explicitly initialized', {
                state: this.audioContext.state,
                sampleRate: this.audioContext.sampleRate
            });
        } catch (error) {
            console.error('[AudioContextManager] Failed to initialize:', error);
            throw error;
        }
    }

    public createTrackAudioNodes(peerIP: string, trackID: string, track: MediaStreamTrack): boolean {
        return this.trackManager.createTrackAudioNodes(peerIP, trackID, track);
    }

    public setMainOutputVolume(volume: number): void {
        this.mainNodes.setMainOutputVolume(volume);
    }

    public setTrackVolume(peerIP: string, trackID: string, volume: number): void {
        this.trackManager.setTrackVolume(peerIP, trackID, volume);
    }

    public getContextInfo(): {
        state: string;
        sampleRate: number;
        currentTime: number;
        activePeersCount: number;
        activeTracksCount: number;
    } {
        return {
            state: this.audioContext.state,
            sampleRate: this.audioContext.sampleRate,
            currentTime: this.audioContext.currentTime,
            activePeersCount: this.peerManager.getPeersCount(),
            activeTracksCount: this.trackManager.getTracksCount()
        };
    }

    public async close(): Promise<void> {
        try {
            this.elementManager.cleanup();
            this.trackManager.cleanup()
            this.peerManager.cleanup();
            this.mainNodes.cleanup();
            await this.audioContext.close();
            AudioContextManager.instance = null;
            this.isInitialized = false;

            console.log('[AudioContextManager] AudioContext and resources cleaned up');
        } catch (error) {
            console.error('[AudioContextManager] Failed to close AudioContext:', error);
            throw error;
        }
    }
}

const initAudioContextManager = async (): Promise<AudioContextManager> => {
    const manager = AudioContextManager.getInstance();
    await manager.initialize();
    return manager;
};

export { AudioContextManager, initAudioContextManager };