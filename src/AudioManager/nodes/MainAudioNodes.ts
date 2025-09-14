import { AudioAnalyser } from "../utils/AudioAnalyser";
import { useLocalUserStateStore } from "@/stores";

export class MainAudioNodes {
    private audioContext: AudioContext;
    public mainGainNode: GainNode;
    public mainAnalyserNode: AnalyserNode;
    public mainDestination: MediaStreamAudioDestinationNode;

    constructor(audioContext: AudioContext) {
        this.audioContext = audioContext;
        this.mainDestination = this.audioContext.createMediaStreamDestination();
        this.mainGainNode = this.audioContext.createGain();
        this.mainAnalyserNode = AudioAnalyser.createAnalyserNode(this.audioContext);
        this.mainGainNode.gain.value = 1.0;

        // play global audio only when local user is in chat
        useLocalUserStateStore.subscribe(
            (state) => state.userState.isInChat,
            (isInChat, prevIsInChat) => {
                if (isInChat && !prevIsInChat) {
                    this.mainGainNode.connect(this.mainAnalyserNode);
                } else if (!isInChat && prevIsInChat) {
                    this.mainGainNode.disconnect(this.mainAnalyserNode);
                }
            }
        )
        
        this.mainAnalyserNode.connect(this.mainDestination);

        // this.playRandomNoise(); // random noise for testing
    }

    private playRandomNoise(): void {
        const bufferSize = this.audioContext.sampleRate * 1; // 1秒噪声
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const random = Math.random() * 2 - 1; // 随机值 -1 到 1
            data[i] = random * 0.5; // 降低音量以防过大
        }
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true; // 循环播放
        source.connect(this.mainGainNode);
        source.start();
    }

    /**
     * set main output volume
     * @param volume any number value bigger or equal than 0
     */
    public setMainOutputVolume(volume: number): void {
        if (volume < 0) {
            console.warn('[MainAudioNodes] Volume must be >= 0. Setting to 0.');
            volume = 0;
        }
        this.mainGainNode.gain.value = volume;
    }

    /**
     * get main output volume
     * @returns volume value
     */
    public getMainOutputVolume(): number {
        return this.mainGainNode.gain.value;
    }

    /**
     * mute/unmute main output
     * @param muted whether to mute
     */
    public setMainOutputMuted(muted: boolean): void {
        this.mainGainNode.gain.value = muted ? 0 : this.mainGainNode.gain.value;
    }

    // getter 方法
    // public get gainNode(): GainNode { return this.mainGainNode; }
    // public get analyserNode(): AnalyserNode { return this.mainAnalyserNode; }
    // public get destination(): MediaStreamAudioDestinationNode { return this.mainDestination; }

    /**
     * 获取指定 peer 的频率数据
     * @returns Uint8Array 频率数据 (0-255)，或 null 如果节点不存在
     */
    public getMainFrequencyData(): Uint8Array | null {
        return AudioAnalyser.getFrequencyData(this.mainAnalyserNode);
    }

    /**
     * get the main volume level (average frequency amplitude)
     * @returns number 音量水平 (0-255)，或 NaN 如果节点不存在
     */
    public getMainVolumeLevel(): number {
        return AudioAnalyser.getVolumeLevel(this.mainAnalyserNode);
    }

    /**
     * get RMS level from the main analyser node
     * @returns number RMS 值 (0-1)，或 NaN 如果节点不存在
     */
    public getMainRMSLevel(): number {
        return AudioAnalyser.getRMSLevel(this.mainAnalyserNode);
    }
    /**
     * Clean up audio nodes and disconnect connections
     */
    public cleanup(): void {
        if (this.mainGainNode) {
            this.mainGainNode.disconnect();
        }

        if (this.mainAnalyserNode) {
            this.mainAnalyserNode.disconnect();
        }

        if (this.mainDestination) {
            this.mainDestination.disconnect();
        }
    }
}