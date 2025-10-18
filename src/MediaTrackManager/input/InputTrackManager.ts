import {
    useLocalUserStateStore, useRemoteUsersStore,
    useAudioProcessing, useWsStore, useDesktopCapture
} from "@/stores"
import InputAudioProcessor from "./audioEncoder"
import InputVideoProcessor from "./videoEncoder"
import { TrackID } from "@/types"


export class InputTrackManager {
    private static instance: InputTrackManager | null = null;
    private microphoneProcessor: InputAudioProcessor | null = null;
    private cpaProcessor: InputAudioProcessor | null = null;
    private screenProcessor: InputVideoProcessor | null = null;

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
                const enteredChat = current.isInChat && !previous.isInChat;
                const leftChat = !current.isInChat && previous.isInChat;


                if (enteredChat) {
                    this.startTransMicAudio();
                    // 如果在进入前本地已勾选共享状态（例如持久化恢复），补启动
                    if (current.isSharingAudio) this.startTransCpaAudio();
                    if (current.isSharingScreen) this.startTransScreenVideo();
                }

                if (leftChat) {
                    // close all when leaving chat
                    this.stopTransMicAudio();
                    this.stopTransCpaAudio();
                    this.stopTransScreenVideo();
                    return;
                }

                if (current.isInChat) {
                    if (current.isSharingAudio && !previous.isSharingAudio) {
                        this.startTransCpaAudio();
                    } else if (!current.isSharingAudio && previous.isSharingAudio) {
                        this.stopTransCpaAudio();
                    }

                    if (current.isSharingScreen && !previous.isSharingScreen) {
                        this.startTransScreenVideo();
                    } else if (!current.isSharingScreen && previous.isSharingScreen) {
                        this.stopTransScreenVideo();
                    }
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

    private async startTransMicAudio(): Promise<void> {
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
            this.microphoneProcessor = new InputAudioProcessor(TrackID.MICROPHONE_AUDIO, mediaWs, microphoneTrack);
            console.log('[MediaTrackManager] Started transmitting microphone audio');

        } catch (error) {
            console.error('[MediaTrackManager] Failed to start microphone transmission:', error);
            this.microphoneProcessor = null;
        }
    }

    private async startTransCpaAudio(): Promise<void> {
        if (this.cpaProcessor?.isActive()) {
            console.log('[MediaTrackManager] CPA audio transmission already active');
            return;
        }

        const { localAddonStream } = useAudioProcessing.getState();
        if (!localAddonStream) {
            console.warn('[MediaTrackManager] No local addon stream available for CPA audio.');
            return;
        }

        const cpaTrack = localAddonStream.getAudioTracks()[0];
        if (!cpaTrack) {
            console.warn('[MediaTrackManager] No CPA track available.');
            return;
        }

        const { mediaWs } = useWsStore.getState();
        if (!mediaWs) {
            console.warn('[MediaTrackManager] No media WebSocket available.');
            return;
        }

        try {
            this.cpaProcessor = new InputAudioProcessor(TrackID.CPA_AUDIO, mediaWs, cpaTrack);
            console.log('[MediaTrackManager] Started transmitting CPA audio');

        } catch (error) {
            console.error('[MediaTrackManager] Failed to start CPA transmission:', error);
            this.cpaProcessor = null;
        }
    }

    private async startTransScreenVideo(): Promise<void> {
        if (this.screenProcessor?.isActive()) {
            console.log('[MediaTrackManager] Screen video transmission already active');
            return;
        }

        const { stream } = useDesktopCapture.getState();
        if (!stream) {
            console.warn('[MediaTrackManager] No desktop capture stream available for screen video.');
            return;
        }

        const screenVideoTrack = stream.getVideoTracks()[0];
        if (!screenVideoTrack) {
            console.warn('[MediaTrackManager] No screen video track available.');
            return;
        }

        const { mediaWs } = useWsStore.getState();
        if (!mediaWs) {
            console.warn('[MediaTrackManager] No media WebSocket available.');
            return;
        }

        try {
            this.screenProcessor = new InputVideoProcessor(TrackID.SCREEN_SHARE_VIDEO, mediaWs, screenVideoTrack);
            console.log('[MediaTrackManager] Started transmitting screen video');

        } catch (error) {
            console.error('[MediaTrackManager] Failed to start screen video transmission:', error);
            this.screenProcessor = null;
        }
    }

    private async stopTransMicAudio(): Promise<void> {
        if (this.microphoneProcessor) {
            this.microphoneProcessor.stop();
            this.microphoneProcessor = null;
            console.log('[MediaTrackManager] Stopped transmitting microphone audio');
        }
    }

    private async stopTransCpaAudio(): Promise<void> {
        if (this.cpaProcessor) {
            this.cpaProcessor.stop();
            this.cpaProcessor = null;
            console.log('[MediaTrackManager] Stopped transmitting CPA audio');
        }
    }

    private async stopTransScreenVideo(): Promise<void> {
        if (this.screenProcessor) {
            this.screenProcessor.stop();
            this.screenProcessor = null;
            console.log('[MediaTrackManager] Stopped transmitting screen video');
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
