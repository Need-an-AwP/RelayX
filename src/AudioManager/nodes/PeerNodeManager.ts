import type { peerNodesType, PeerAudioNodes } from '../types';
import { MainAudioNodes } from './MainAudioNodes';
import type { TrackNodeManager } from './TrackNodeManager';
import { AudioAnalyser } from "../utils/AudioAnalyser";

export class PeerNodeManager {
    private audioContext: AudioContext;
    private mainNodes: MainAudioNodes;
    private peerNodes: peerNodesType = {};
    private trackManager: TrackNodeManager | null = null; // 注入引用

    constructor(audioContext: AudioContext, mainNodes: MainAudioNodes) {
        this.audioContext = audioContext;
        this.mainNodes = mainNodes;
    }

    public setTrackManager(trackManager: TrackNodeManager): void {
        this.trackManager = trackManager;
    }

    /**
     * create and ensure peer audio nodes exist
     * @param peerIP peer's IP address
     * @returns whether the creation was successful
     */
    public ensurePeerNodes(peerIP: string): boolean {
        if (this.peerNodes[peerIP]) {
            return true;
        }

        try {
            const gainNode = this.audioContext.createGain();
            const analyserNode = AudioAnalyser.createAnalyserNode(this.audioContext);
            gainNode.gain.value = 1.0;

            gainNode.connect(analyserNode);
            analyserNode.connect(this.mainNodes.mainGainNode);

            this.peerNodes[peerIP] = { gainNode, analyserNode };
            return true;
        } catch (error) {
            console.error(`Failed to create peer nodes for ${peerIP}:`, error);
            return false;
        }
    }

    /**
     * set specific peer volume
     * @param peerIP peer's IP address
     * @param volume peer's overall volume, any number value greater than or equal to 0
     */
    public setPeerVolume(peerIP: string, volume: number): void {
        if (!this.peerNodes[peerIP]) {
            console.warn(`[PeerNodeManager] No peer nodes found for ${peerIP}`);
            return;
        }

        if (volume < 0) {
            console.warn(`[PeerNodeManager] Volume must be >= 0. Setting to 0.`);
            volume = 0;
        }
        this.peerNodes[peerIP].gainNode.gain.value = volume;
    }

    /**
     * set specific peer mute state
     * @param peerIP peer's IP address
     * @param muted whether to mute
     */
    public setPeerMuted(peerIP: string, muted: boolean): void {
        if (!this.peerNodes[peerIP]) {
            console.warn(`[PeerNodeManager] No peer nodes found for ${peerIP}`);
            return;
        }

        this.peerNodes[peerIP].gainNode.gain.value = muted ? 0 : 1;
    }

    /**
     * remove specific peer audio nodes and all its track nodes
     * @param peerIP peer's IP address
     */
    public removePeerNodes(peerIP: string): void {
        // 先移除所有轨道
        if (this.trackManager) {
            const trackIDs = this.trackManager.getPeerTrackIDs(peerIP);
            for (const trackID of trackIDs) {
                this.trackManager.removeTrackAudioNodes(peerIP, trackID);
            }
        }

        // 移除 peer 节点
        if (this.peerNodes[peerIP]) {
            try {
                this.peerNodes[peerIP].gainNode.disconnect();
                this.peerNodes[peerIP].analyserNode.disconnect();

                delete this.peerNodes[peerIP];

                console.log(`[PeerNodeManager] Removed peer nodes for ${peerIP}`);
            } catch (error) {
                console.error(`[PeerNodeManager] Error removing peer nodes for ${peerIP}:`, error);
            }
        }
    }

    public getPeerNodes(peerIP: string): PeerAudioNodes | null {
        return this.peerNodes[peerIP] || null;
    }

    public getPeersCount(): number {
        return Object.keys(this.peerNodes).length;
    }

    /**
     * get specific peer's frequency data from its analyser node
     * @param peerIP peer's IP address
     * @returns Uint8Array frequency data (0-255), or null if the node doesn't exist
     */
    public getPeerFrequencyData(peerIP: string): Uint8Array | null {
        const nodes = this.getPeerNodes(peerIP);
        if (!nodes?.analyserNode) {
            console.warn(`[PeerNodeManager] No analyserNode found for ${peerIP}`);
            return null;
        }
        return AudioAnalyser.getFrequencyData(nodes.analyserNode);
    }

    /**
     * get specific peer's volume level (average frequency amplitude)
     * @param peerIP peer's IP address
     * @returns number volume level (0-255), or NaN if the node doesn't exist
     */
    public getPeerVolumeLevel(peerIP: string): number {
        const nodes = this.getPeerNodes(peerIP);
        if (!nodes?.analyserNode) {
            console.warn(`[PeerNodeManager] No analyserNode found for ${peerIP}`);
            return NaN;
        }
        return AudioAnalyser.getVolumeLevel(nodes.analyserNode);
    }

    /**
     * get specific peer's RMS level
     * @param peerIP peer's IP address
     * @returns number RMS level (0-1), or NaN if the node doesn't exist
     */
    public getPeerRMSLevel(peerIP: string): number {
        const nodes = this.getPeerNodes(peerIP);
        if (!nodes?.analyserNode) {
            console.warn(`[PeerNodeManager] No analyserNode found for ${peerIP}`);
            return NaN;
        }
        return AudioAnalyser.getRMSLevel(nodes.analyserNode);
    }

    /**
     * Clean up all peer nodes and disconnect their audio connections
     */
    public cleanup(): void {
        Object.keys(this.peerNodes).forEach(peerIP => {
            this.removePeerNodes(peerIP);
        });
        
        this.peerNodes = {};
    }
}