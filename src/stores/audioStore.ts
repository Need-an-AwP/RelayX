import { create } from "zustand";
import { AudioContextManager } from "@/AudioManager/AudioContextManager";
import { useLocalUserStateStore } from "./localUserStateStore";

interface AudioStore {
    /**
     * User's audio active threshold
     * @description A number between 0 - 255, representing the audio level above which the audio is considered "active".
     */
    audioActiveThreshold: number;
    // main volume states
    mainVolume: number;
    mainMuted: boolean;
    volumeBeforeMute: number;

    // peer analyser nodes management
    peerAnalysers: Record<string, AnalyserNode>;
    
    setMainVolume: (volume: number) => void;
    setMainMuted: (muted: boolean) => void;
    toggleMute: () => void;

    getAudioContextInfo: () => any;
    setAudioActiveThreshold?: (threshold: number) => void;

    // peer analyser management methods
    setPeerAnalyser: (peerIP: string, analyser: AnalyserNode) => void;
    removePeerAnalyser: (peerIP: string) => void;
}

const useAudioStore = create<AudioStore>((set, get) => ({
    audioActiveThreshold: 5,
    // 初始状态
    mainVolume: 1.0,
    mainMuted: false,
    volumeBeforeMute: 1.0,
    peerAnalysers: {},

    /**
     * 设置主音量
     * @param volume 音量值 (0.0 - 1.0)
     */
    setMainVolume: (volume: number) => {
        set({ mainVolume: volume });

        // 如果当前不是静音状态，更新 volumeBeforeMute
        const currentState = get();
        if (!currentState.mainMuted) {
            set({ volumeBeforeMute: volume });
        }

        // 调用 AudioContextManager 设置实际音量
        try {
            const mgr = AudioContextManager.getInstance();
            mgr.setMainOutputVolume(volume);
        } catch (error) {
            console.error('[AudioStore] Failed to set main volume:', error);
        }
    },

    /**
     * 设置主音量静音状态
     * @param muted 是否静音
     */
    setMainMuted: (muted: boolean) => {
        const currentState = get();

        if (muted) {
            // 静音：保存当前音量，设置音量为0
            set({
                volumeBeforeMute: currentState.mainVolume,
                mainMuted: true,
                mainVolume: 0
            });
        } else {
            // 取消静音：恢复之前的音量
            set({
                mainMuted: false,
                mainVolume: currentState.volumeBeforeMute
            });
        }

        // 调用 AudioContextManager 设置实际静音状态
        try {
            const mgr = AudioContextManager.getInstance();
            mgr.setMainOutputMuted(muted);

            // 如果取消静音，恢复音量
            if (!muted) {
                mgr.setMainOutputVolume(currentState.volumeBeforeMute);
            }
        } catch (error) {
            console.error('[AudioStore] Failed to set main muted:', error);
        }
    },

    /**
     * 切换静音状态
     */
    toggleMute: () => {
        const currentState = get();
        const actions = get();
        actions.setMainMuted(!currentState.mainMuted);
        useLocalUserStateStore.getState().updateSelfState({
            isOutputMuted: !currentState.mainMuted
        });
    },


    getAudioContextInfo: () => {
        try {
            const audioManager = AudioContextManager.getInstance();
            return audioManager.getContextInfo();
        } catch (error) {
            console.error('[AudioStore] Failed to get audio context info:', error);
            return null;
        }
    },

    setAudioActiveThreshold: (threshold: number) => {
        if (threshold < 0) threshold = 0;
        if (threshold > 255) threshold = 255;
        set({ audioActiveThreshold: threshold });
    },

    // peer analyser management methods
    setPeerAnalyser: (peerIP: string, analyser: AnalyserNode) => {
        set((state) => ({
            peerAnalysers: {
                ...state.peerAnalysers,
                [peerIP]: analyser
            }
        }));
    },

    removePeerAnalyser: (peerIP: string) => {
        set((state) => {
            const { [peerIP]: removed, ...rest } = state.peerAnalysers;
            return { peerAnalysers: rest };
        });
    },
}));

export { useAudioStore };