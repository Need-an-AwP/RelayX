import { usePeerStateStore, useAudioProcessing, useRTCStore } from "@/stores"
import type { PeerState, peerMap } from "@/stores"


export default class MediaTrackManager {
    private static instance: MediaTrackManager;
    private replacedTracks: Map<string, Set<string>> = new Map();

    private constructor() {
        usePeerStateStore.subscribe((state, prevState) => {
            const isInChat = state.selfState.isInChat
            const wasInChat = prevState.selfState.isInChat
            const selfChanged = this.didSelfStateChange(prevState.selfState, state.selfState)
            const peersChanged = this.didPeersChange(prevState.peers, state.peers);
            if (isInChat && (selfChanged || peersChanged)) {
                this.updateAllPeerTracks(state.selfState, state.peers);
            } else if (!isInChat && wasInChat) {
                this.clearAllPeerTracks(state.peers);
            }
        });
    }

    private didSelfStateChange(prevSelf: PeerState, currentSelf: PeerState): boolean {
        if (prevSelf.isInChat !== currentSelf.isInChat) {
            return true;
        } else if (prevSelf.isSharingAudio !== currentSelf.isSharingAudio) {
            return true;
        } else if (prevSelf.isSharingScreen !== currentSelf.isSharingScreen) {
            return true;
        }
        return false;
    }

    private didPeersChange(prevPeers: peerMap, currentPeers: peerMap): boolean {
        if (prevPeers.size !== currentPeers.size) {
            return true;
        }

        // omit irrelevant properties
        const relevantKeys: (keyof PeerState)[] = [
            'isInChat',
            // 'isSharingScreen', 'isSharingAudio'
        ];

        for (const [peerIP, currentPeerState] of currentPeers) {
            const prevPeerState = prevPeers.get(peerIP);
            if (!prevPeerState) {
                return true; // New peer
            }

            for (const key of relevantKeys) {
                if (prevPeerState[key] !== currentPeerState[key]) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 遍历所有已知的对等体，并根据当前状态更新其媒体轨道。
     * 这是在任何状态更改时触发的主要"规则引擎"。
     */
    private async updateAllPeerTracks(selfState: PeerState, peers: peerMap) {
        for (const peerIP of peers.keys()) {
            const peerState = peers.get(peerIP);
            if (!peerState) continue;

            if (!this.replacedTracks.has(peerIP)) {
                this.replacedTracks.set(peerIP, new Set());
            }
            const peerReplacedTracks = this.replacedTracks.get(peerIP)!;

            const shouldBeInAudioChat = selfState.isInChat && peerState.isInChat;
            if (shouldBeInAudioChat) {
                if (peerReplacedTracks.has('micphone')) {
                    console.log(`[MediaTrackManager] Micphone track for ${peerIP} already replaced.`);
                } else {
                    const connection = await useRTCStore.getState().getConnection({ peerIP })
                    if (!connection) {
                        console.warn(`[MediaTrackManager] Wanted to send audio to ${peerIP}, but no connection available.`);
                        continue;
                    }

                    const { localFinalStream } = useAudioProcessing.getState();
                    if (!localFinalStream) {
                        console.warn(`[MediaTrackManager] Wanted to send audio to ${peerIP}, but no local track available.`);
                        continue;
                    }
                    const micphoneTrack = localFinalStream.getAudioTracks()[0];
                    if (!micphoneTrack) {
                        console.warn(`[MediaTrackManager] Wanted to send audio to ${peerIP}, but no micphone track available.`);
                        continue;
                    }

                    connection.replaceTrack(micphoneTrack, 'micphone');
                    peerReplacedTracks.add('micphone');

                    console.log('replace micphone Track for ' + peerIP + 'done')
                }
            }

            const shouldShareCaptureAudio = selfState.isInChat && selfState.isSharingAudio;
            if (shouldShareCaptureAudio) {
                if (peerReplacedTracks.has('capture_audio')) {
                    console.log(`[MediaTrackManager] Capture audio track for ${peerIP} already replaced.`);
                } else {
                    const connection = await useRTCStore.getState().getConnection({ peerIP })
                    if (!connection) {
                        console.warn(`[MediaTrackManager] Wanted to send audio to ${peerIP}, but no connection available.`);
                        continue;
                    }

                    const { localAddonStream } = useAudioProcessing.getState();
                    if (!localAddonStream) {
                        console.warn(`[MediaTrackManager] Wanted to send audio to ${peerIP}, but no local track available.`);
                        continue;
                    }

                    const addonTrack = localAddonStream.getAudioTracks()[0];
                    if (!addonTrack) {
                        console.warn(`[MediaTrackManager] Wanted to send audio to ${peerIP}, but no addon track available.`);
                        continue;
                    }
                    connection.replaceTrack(addonTrack, 'capture_audio');
                    peerReplacedTracks.add('capture_audio');

                    console.log('replace capture_audio Track for ' + peerIP + 'done')
                }
            }
        }
    }

    private async clearAllPeerTracks(peers: peerMap) {
        console.log("MediaTrackManager: Clearing all peer tracks...");
        this.replacedTracks.clear();

        for (const peerIP of peers.keys()) {
            const peerState = peers.get(peerIP);
            if (!peerState) continue;

            const connection = await useRTCStore.getState().getConnection({ peerIP })
            if (!connection) {
                console.warn(`[MediaTrackManager] Wanted to clear tracks for ${peerIP}, but no connection available.`);
                continue;
            }

            connection.replaceTrack(null, 'micphone');
            connection.replaceTrack(null, 'capture_audio');
            connection.replaceTrack(null, 'screen_share_video');
            connection.replaceTrack(null, 'screen_share_audio');
            connection.replaceTrack(null, 'camera_video');
        }
    }

    public static getInstance(): MediaTrackManager {
        if (!MediaTrackManager.instance) {
            MediaTrackManager.instance = new MediaTrackManager()
        }
        return MediaTrackManager.instance
    }
}
