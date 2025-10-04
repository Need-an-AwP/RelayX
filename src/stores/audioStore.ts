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

    mutedPeers: string[]; // array of peer IPs that are muted
    peerAnalysers: Record<string, AnalyserNode>;
    
    setMainVolume: (volume: number) => void;
    setMainMuted: (muted: boolean) => void;
    toggleMute: () => void;

    getAudioContextInfo: () => any;
    setAudioActiveThreshold?: (threshold: number) => void;

    // peer analyser management methods
    setPeerAnalyser: (peerIP: string, analyser: AnalyserNode) => void;
    removePeerAnalyser: (peerIP: string) => void;

    setMutedPeer: (peerIP: string, muted: boolean) => void;
}

const useAudioStore = create<AudioStore>((set, get) => ({
    audioActiveThreshold: 5,
    // 初始状态
    mainVolume: 1.0,
    mainMuted: false,
    mutedPeers: [],
    peerAnalysers: {},

    /**
     * 设置主音量
     * @param volume 音量值 (0.0 - 1.0)
     */
    setMainVolume: (volume: number) => {
        set({ mainVolume: volume });

        // 直接调用 AudioContextManager 设置实际音量
        // muteGainNode 会处理静音，所以这里不需要关心静音状态
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
        set({ mainMuted: muted });

        // 调用 AudioContextManager 设置实际静音状态
        try {
            const mgr = AudioContextManager.getInstance();
            mgr.setMainOutputMuted(muted);
        } catch (error) {
            console.error('[AudioStore] Failed to set main muted:', error);
        }
    },

    /**
     * 切换静音状态
     */
    toggleMute: () => {
        const currentState = get();
        const newMutedState = !currentState.mainMuted;
        
        // 更新 zustand store
        set({ mainMuted: newMutedState });

        // 更新本地用户状态
        useLocalUserStateStore.getState().updateSelfState({
            isOutputMuted: newMutedState
        });

        // 调用 AudioContextManager 设置实际静音状态
        try {
            const mgr = AudioContextManager.getInstance();
            mgr.setMainOutputMuted(newMutedState);
        } catch (error) {
            console.error('[AudioStore] Failed to toggle mute:', error);
        }
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

    setMutedPeer: (peerIP: string, muted: boolean) => {
        set((state) => {
            let updatedMutedPeers = [...state.mutedPeers];
            if (muted) {
                updatedMutedPeers.push(peerIP);
            } else {
                updatedMutedPeers = updatedMutedPeers.filter(ip => ip !== peerIP);
            }
            return { mutedPeers: updatedMutedPeers };
        });
    }

}));

export { useAudioStore };