import { create } from "zustand";
import { AudioContextManager } from "@/AudioManager/AudioContextManager";
import { useLocalUserStateStore } from "./localUserStateStore";

interface AudioStore {
    // 主音量状态
    mainVolume: number;
    mainMuted: boolean;
    volumeBeforeMute: number; // 静音前的音量值

    // 主音量控制方法
    setMainVolume: (volume: number) => void;
    setMainMuted: (muted: boolean) => void;
    toggleMute: () => void; // 切换静音状态的便捷方法

    // 获取音频上下文信息
    getAudioContextInfo: () => any;
}

const useAudioStore = create<AudioStore>((set, get) => ({
    // 初始状态
    mainVolume: 1.0,
    mainMuted: false,
    volumeBeforeMute: 1.0,


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
    }
}));

export { useAudioStore };