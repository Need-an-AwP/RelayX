import { useLocalUserStateStore, useRemoteUsersStore, useAudioProcessing, useWsStore } from "@/stores"
import MicrophoneAudioProcessor from "./audioEncoder"

class InputTrackManager {
    private static instance: InputTrackManager | null = null;
    private microphoneProcessor: MicrophoneAudioProcessor | null = null;

    private constructor() {
        // only subscribe core state changes
        useLocalUserStateStore.subscribe(
            (state) => ({
                isInChat: state.userState.isInChat,
                isSharingAudio: state.userState.isSharingAudio,
                isSharingScreen: state.userState.isSharingScreen,
            }),
            (current, previous) => {
                console.log('[MediaTrackManager] Local user state changed:', { previous, current });

                if (current.isInChat) {
                    this.startTransmittingMicrophoneAudio();

                    if (current.isSharingAudio) {
                        // TODO: Start transmitting capture audio
                    }

                    if (current.isSharingScreen) {
                        // TODO: Start transmitting screen share
                    }
                } else {
                    this.stopTransmittingMicrophoneAudio();
                }
            }
        );

        useRemoteUsersStore.subscribe(
            (state) => {
                // 提取每个 peer 的核心状态
                const peersStates: Record<string, { isInChat: boolean }> = {};
                Object.entries(state.peers).forEach(([peerIP, peerState]) => {
                    peersStates[peerIP] = {
                        isInChat: peerState.isInChat,
                    };
                });
                return peersStates;
            },
            (current, previous) => {
                // console.log('[MediaTrackManager] Remote users state changed:', { previous, current });
            }
        );
    }

    private async startTransmittingMicrophoneAudio(): Promise<void> {
        // Avoid duplicate initialization
        if (this.microphoneProcessor?.isActive()) {
            console.log('[MediaTrackManager] Microphone transmission already active');
            return;
        }

        const { localFinalStream } = useAudioProcessing.getState();
        if (!localFinalStream) {
            console.warn('[MediaTrackManager] No local final stream available for microphone audio.');
            return;
        }

        const microphoneTrack = localFinalStream.getAudioTracks()[0];
        if (!microphoneTrack) {
            console.warn('[MediaTrackManager] No microphone track available.');
            return;
        }

        const { mediaWs } = useWsStore.getState();
        if (!mediaWs) {
            console.warn('[MediaTrackManager] No media WebSocket available.');
            return;
        }

        try {
            this.microphoneProcessor = new MicrophoneAudioProcessor(mediaWs, microphoneTrack);
            console.log('[MediaTrackManager] Started transmitting microphone audio');

        } catch (error) {
            console.error('[MediaTrackManager] Failed to start microphone transmission:', error);
            this.microphoneProcessor = null;
        }
    }

    private async stopTransmittingMicrophoneAudio(): Promise<void> {
        if (this.microphoneProcessor) {
            this.microphoneProcessor.stop();
            this.microphoneProcessor = null;
            console.log('[MediaTrackManager] Stopped transmitting microphone audio');
        }
    }

    public static init(): void {
        if (InputTrackManager.instance) {
            console.warn('[MediaTrackManager] Already initialized, skipping...');
            return;
        }
        InputTrackManager.instance = new InputTrackManager();
        console.log('[MediaTrackManager] Initialized successfully');
    }


}

export const initInputTrackManager = (): void => {
    InputTrackManager.init();
};
