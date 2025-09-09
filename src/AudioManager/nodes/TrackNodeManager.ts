import type { trackNodesType } from '../types';
import { PeerNodeManager } from './PeerNodeManager';

export class TrackNodeManager {
    private audioContext: AudioContext;
    private peerManager: PeerNodeManager;
    private trackNodes: trackNodesType = {};

    constructor(audioContext: AudioContext, peerManager: PeerNodeManager) {
        this.audioContext = audioContext;
        this.peerManager = peerManager;
    }

    /**
     * create and ensure track audio nodes exist
     * @param peerIP peer's IP address
     * @param trackID track ID
     * @param track track's media stream
     * @returns whether the creation was successful
     */
    public createTrackAudioNodes(peerIP: string, trackID: string, track: MediaStreamTrack): boolean {
        if (!this.peerManager.ensurePeerNodes(peerIP)) {
            return false;
        }

        try {
            const stream = new MediaStream([track]);
            const sourceNode = this.audioContext.createMediaStreamSource(stream);
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = 1.0;

            const peerNodes = this.peerManager.getPeerNodes(peerIP);
            sourceNode.connect(gainNode);
            gainNode.connect(peerNodes!.gainNode);

            // 存储轨道节点
            if (!this.trackNodes[peerIP]) {
                this.trackNodes[peerIP] = {};
            }
            this.trackNodes[peerIP][trackID] = { sourceNode, gainNode };

            return true;
        } catch (error) {
            console.error(`Failed to create track nodes for ${peerIP}-${trackID}:`, error);
            return false;
        }
    }

    /**
     * set specific track volume
     * @param peerIP peer's IP address
     * @param trackID track ID
     * @param volume specific track volume of a peer, accept any number value greater than or equal to 0
     */
    public setTrackVolume(peerIP: string, trackID: string, volume: number): void {
        if (!this.trackNodes[peerIP] || !this.trackNodes[peerIP][trackID]) {
            console.warn(`[TrackNodeManager] No track nodes found for ${peerIP}-${trackID}`);
            return;
        }

        if (volume < 0) {
            console.warn(`[TrackNodeManager] Volume for ${peerIP}-${trackID} must be >= 0. Setting to 0.`);
            volume = 0;
        }
        this.trackNodes[peerIP][trackID].gainNode.gain.value = volume;
    }

    /**
     * mute/unmute a specific track
     * @param peerIP peer's IP address
     * @param trackID track ID
     * @param muted whether to mute the track
     */
    public setTrackMuted(peerIP: string, trackID: string, muted: boolean): void {
        if (!this.trackNodes[peerIP] || !this.trackNodes[peerIP][trackID]) {
            console.warn(`[TrackNodeManager] No track nodes found for ${peerIP}-${trackID}`);
            return;
        }

        this.trackNodes[peerIP][trackID].gainNode.gain.value = muted ? 0 : 1;
    }

    /**
     * remove a track's all audio nodes
     * @param peerIP peer's IP address
     * @param trackID track ID
     */
    public removeTrackAudioNodes(peerIP: string, trackID: string): void {
        if (!this.trackNodes[peerIP] || !this.trackNodes[peerIP][trackID]) {
            console.warn(`[AudioContextManager] No track nodes found for ${peerIP}-${trackID}`);
            return;
        }

        try {
            const trackNodes = this.trackNodes[peerIP][trackID];

            // 断开轨道节点连接
            trackNodes.sourceNode.disconnect();
            trackNodes.gainNode.disconnect();

            // 从存储中移除
            delete this.trackNodes[peerIP][trackID];

            console.log(`[AudioContextManager] Removed track nodes for ${peerIP}-${trackID}`);

            // 如果该 peer 没有剩余轨道，移除 peer 节点
            if (Object.keys(this.trackNodes[peerIP]).length === 0) {
                this.peerManager.removePeerNodes(peerIP);
            }
        } catch (error) {
            console.error(`[AudioContextManager] Error removing track nodes for ${peerIP}-${trackID}:`, error);
        }
    }

    /**
     * get all track IDs of a specific peer
     * @param peerIP peer's IP address
     */
    public getPeerTrackIDs(peerIP: string): string[] {
        return this.trackNodes[peerIP] ? Object.keys(this.trackNodes[peerIP]) : [];
    }

    public getTracksCount(): number {
        let count = 0;
        for (const peerTracks of Object.values(this.trackNodes)) {
            count += Object.keys(peerTracks).length;
        }
        return count;
    }

    public cleanup(): void {
        Object.keys(this.trackNodes).forEach(peerIP => {
            this.peerManager.removePeerNodes(peerIP);
        });
        
        this.trackNodes = {};
    }
}