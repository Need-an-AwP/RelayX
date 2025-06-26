import { usePeerStateStore, useMediaStore } from "@/stores";
import type { PeerState, peerMap, peerIP } from "@/stores";



export default class AudioPlaybackController {
    private static instance: AudioPlaybackController | null = null;
    private audioElements: Map<peerIP, HTMLAudioElement> = new Map();
    private audioEl: HTMLAudioElement | null = null;
    private DEV = true;
    private audioContainer: HTMLElement | null = null;

    constructor() {
        if (this.DEV) {
            this.audioContainer = document.getElementById('audio-container');
            if (!this.audioContainer) {
                console.error('Audio container not found');
            }
        }

        // not using selector in subscribe, use basic compare method instead
        usePeerStateStore.subscribe((state, prevState) => {
            const selfWasInChat = prevState.selfState.isInChat;
            const selfIsInChat = state.selfState.isInChat;
            // when join chat
            if (selfIsInChat && !selfWasInChat) {
                this.handleInChatStateUpdate();
                return;
            }
            // when quit chat
            if (!selfIsInChat && selfWasInChat) {
                this.handleQuitChat();
                return;
            }
        })
    }

    public static getInstance(): AudioPlaybackController {
        if (!AudioPlaybackController.instance) {
            AudioPlaybackController.instance = new AudioPlaybackController();
        }
        return AudioPlaybackController.instance;
    }

    private handleInChatStateUpdate() {
        /*
        peers.forEach((peerState, peerIP) => {
            if (!selfState.isInChat) {
                return;
            }

            if (peerState.isInChat) {
                let audioEl = this.audioElements.get(peerIP);
                if (!audioEl) {
                    const { peerStreams } = useMediaStore.getState()
                    const peerStream = peerStreams.get(peerIP);
                    if (!peerStream) {
                        console.error("AudioPlaybackController: No peer stream found for peer", peerIP);
                        return;
                    }

                    
                    const peerTracks = useMediaStore.getState().getPeerAudioTracks(peerIP)
                    if (!peerTracks) {
                        console.error('peerTacks for' + peerIP + 'not found')
                        return;
                    }
                    const audioTrack = peerTracks['micphone']
                    const peerStream = new MediaStream([audioTrack])
                    


                    audioEl = new Audio();
                    audioEl.controls = true;
                    audioEl.autoplay = true;
                    audioEl.srcObject = peerStream;
                    this.audioElements.set(peerIP, audioEl);

                    if (this.audioContainer && this.DEV) {
                        this.audioContainer.appendChild(audioEl);
                    }

                    console.log('AudioPlaybackController: Added or updated audio element for peer', peerIP);
                }

                // if (audioEl.srcObject !== micphoneStream) {
                // audioEl.srcObject = micphoneStream;
                // audioEl.play().catch(err => {
                // console.error('Error playing audio stream:', err);
                // });
                // }

            } else {
                const audioEl = this.audioElements.get(peerIP);
                if (audioEl) {
                    audioEl.pause();
                    audioEl.srcObject = null;
                    audioEl.remove();
                    this.audioElements.delete(peerIP);
                }
            }
        })
        */

        if (this.audioEl) {
            return;
        }

        const { mixedAudioStream, resumeAudioContext } = useMediaStore.getState();
        void resumeAudioContext();

        this.audioEl = new Audio();
        this.audioEl.controls = this.DEV;
        this.audioEl.autoplay = true;
        this.audioEl.srcObject = mixedAudioStream;

        if (this.audioContainer && this.DEV) {
            this.audioContainer.appendChild(this.audioEl);
        }
        console.log('AudioPlaybackController: Started playing mixed audio stream.');
    }

    private handleQuitChat() {
        console.log("AudioPlaybackController: Quit chat");
        if (this.audioEl) {
            this.audioEl.pause();
            this.audioEl.srcObject = null;
            if (this.audioEl.parentNode) {
                this.audioEl.parentNode.removeChild(this.audioEl);
            }
            this.audioEl = null;
        }
    }

    public setPeerVolume(peerIP: peerIP, volume: number) {
        // TODO: This should be implemented by controlling the GainNode in the mediaStore
        console.warn("setPeerVolume is not implemented yet.", peerIP, volume)
    }

    public getPeerVolume(peerIP: peerIP): number {
        // TODO: This should be implemented by reading the GainNode value in the mediaStore
        console.warn("getPeerVolume is not implemented yet.", peerIP)
        return 1;
    }
}