import type { TrackIDType } from '@/types';

interface AudioDecoderInstance {
    decoder: AudioDecoder;
    generator: MediaStreamTrackGenerator<AudioData>;
    track: MediaStreamTrack;
    gainNode: GainNode;
    analyserNode: AnalyserNode;
    mediaStreamSource: MediaStreamAudioSourceNode;
    writer: WritableStreamDefaultWriter<AudioData>;
}

class OutputTrackManager {
    private static instance: OutputTrackManager | null = null;
    private decoders = new Map<string, AudioDecoderInstance>();
    private audioContext: AudioContext;
    private audioElement: HTMLAudioElement;
    private mixerNode: GainNode;
    private destinationStream: MediaStream;

    private constructor() {
        // 创建 AudioContext
        this.audioContext = new AudioContext();
        
        // 创建主混音器节点
        this.mixerNode = this.audioContext.createGain();
        this.mixerNode.gain.value = 1.0;
        
        // 创建音频元素
        this.audioElement = document.createElement('audio');
        this.audioElement.autoplay = true;
        this.audioElement.controls = false;
        this.audioElement.style.display = 'none'; // 隐藏音频元素
        document.body.appendChild(this.audioElement);
        
        // 创建目标流
        const destination = this.audioContext.createMediaStreamDestination();
        this.mixerNode.connect(destination);
        this.destinationStream = destination.stream;
        
        // 将流连接到音频元素
        this.audioElement.srcObject = this.destinationStream;
        
        console.log('[OutputTrackManager] Initialized with AudioContext and AudioElement');
    }

    public static getInstance(): OutputTrackManager {
        if (!OutputTrackManager.instance) {
            OutputTrackManager.instance = new OutputTrackManager();
        }
        return OutputTrackManager.instance;
    }

    /**
     * 生成解码器的唯一键
     */
    private generateDecoderKey(peerIP: string, trackID: TrackIDType): string {
        return `${peerIP}-${trackID}`;
    }

    /**
     * 获取或创建音频解码器实例
     */
    private getOrCreateDecoder(peerIP: string, trackID: TrackIDType): AudioDecoderInstance | null {
        const key = this.generateDecoderKey(peerIP, trackID);

        if (this.decoders.has(key)) {
            return this.decoders.get(key)!;
        }

        try {
            // 创建 MediaStreamTrackGenerator
            const generator = new MediaStreamTrackGenerator({ kind: 'audio' });
            const track = generator;

            // 为这个实例创建专用的 writer
            const writer = generator.writable.getWriter();

            // 创建专属的音频节点
            const gainNode = this.audioContext.createGain();
            const analyserNode = this.audioContext.createAnalyser();
            
            // 配置 analyser
            analyserNode.fftSize = 256;
            analyserNode.smoothingTimeConstant = 0.8;
            
            // 设置初始音量
            gainNode.gain.value = 1.0;

            // 从轨道创建 MediaStream 并连接到 AudioContext
            const mediaStream = new MediaStream([track]);
            const mediaStreamSource = this.audioContext.createMediaStreamSource(mediaStream);
            
            // 连接音频节点链：source -> gain -> analyser -> mixer
            mediaStreamSource.connect(gainNode);
            gainNode.connect(analyserNode);
            analyserNode.connect(this.mixerNode);

            // 创建音频解码器
            const decoder = new AudioDecoder({
                output: (audioData: AudioData) => {
                    // 使用专用的 writer 写入音频数据
                    writer.write(audioData).catch(err => {
                        console.error(`[OutputTrackManager] Failed to write audio data for ${peerIP}-${trackID}:`, err);
                    });
                },
                error: (error: Error) => {
                    console.error(`[OutputTrackManager] Decoder error for ${peerIP}-${trackID}:`, error);
                    this.removeDecoder(peerIP, trackID);
                }
            });

            // 配置解码器 (Opus)
            decoder.configure({
                codec: 'opus',
                sampleRate: 48000,
                numberOfChannels: 2
            });

            const decoderInstance: AudioDecoderInstance = {
                decoder,
                generator,
                track,
                gainNode,
                analyserNode,
                mediaStreamSource,
                writer
            };

            this.decoders.set(key, decoderInstance);
            console.log(`[OutputTrackManager] Created new decoder for ${peerIP}-${trackID} with audio processing chain`);

            return decoderInstance;
        } catch (error) {
            console.error(`[OutputTrackManager] Failed to create decoder for ${peerIP}-${trackID}:`, error);
            return null;
        }
    }

    /**
     * 处理来自 WebSocket 的音频数据
     * @param peerIP 来源 peer 的 IP 地址
     * @param trackID 音频轨道 ID
     * @param audioChunk 编码的音频数据块
     */
    public processAudioChunk(peerIP: string, trackID: TrackIDType, audioChunk: EncodedAudioChunk): void {
        const decoderInstance = this.getOrCreateDecoder(peerIP, trackID);

        if (!decoderInstance) {
            console.error(`[OutputTrackManager] Failed to get decoder for ${peerIP}-${trackID}`);
            return;
        }

        try {
            decoderInstance.decoder.decode(audioChunk);
        } catch (error) {
            console.error(`[OutputTrackManager] Failed to decode audio chunk for ${peerIP}-${trackID}:`, error);
        }
    }

    /**
     * 获取特定 peer 和 track 的音频轨道
     * @param peerIP peer IP 地址
     * @param trackID 轨道 ID
     * @returns MediaStreamTrack 或 null
     */
    public getAudioTrack(peerIP: string, trackID: TrackIDType): MediaStreamTrack | null {
        const key = this.generateDecoderKey(peerIP, trackID);
        const decoderInstance = this.decoders.get(key);
        return decoderInstance?.track || null;
    }

    /**
     * 设置特定轨道的音量
     * @param peerIP peer IP 地址
     * @param trackID 轨道 ID
     * @param volume 音量值 (0.0 - 1.0)
     */
    public setTrackVolume(peerIP: string, trackID: TrackIDType, volume: number): void {
        const key = this.generateDecoderKey(peerIP, trackID);
        const decoderInstance = this.decoders.get(key);
        if (decoderInstance) {
            decoderInstance.gainNode.gain.value = Math.max(0, Math.min(1, volume));
            console.log(`[OutputTrackManager] Set volume for ${peerIP}-${trackID} to ${volume}`);
        }
    }

    /**
     * 获取特定轨道的音频分析数据
     * @param peerIP peer IP 地址
     * @param trackID 轨道 ID
     * @returns 频谱数据数组或 null
     */
    public getTrackAnalyserData(peerIP: string, trackID: TrackIDType): Uint8Array | null {
        const key = this.generateDecoderKey(peerIP, trackID);
        const decoderInstance = this.decoders.get(key);
        if (decoderInstance) {
            const dataArray = new Uint8Array(decoderInstance.analyserNode.frequencyBinCount);
            decoderInstance.analyserNode.getByteFrequencyData(dataArray);
            return dataArray;
        }
        return null;
    }

    /**
     * 获取特定轨道的音量级别
     * @param peerIP peer IP 地址
     * @param trackID 轨道 ID
     * @returns 音量级别 (0-255) 或 null
     */
    public getTrackVolumeLevel(peerIP: string, trackID: TrackIDType): number | null {
        const key = this.generateDecoderKey(peerIP, trackID);
        const decoderInstance = this.decoders.get(key);
        if (decoderInstance) {
            const dataArray = new Uint8Array(decoderInstance.analyserNode.frequencyBinCount);
            decoderInstance.analyserNode.getByteFrequencyData(dataArray);
            
            // 计算平均音量级别
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            return Math.floor(sum / dataArray.length);
        }
        return null;
    }

    /**
     * 设置主音量
     * @param volume 音量值 (0.0 - 1.0)
     */
    public setMasterVolume(volume: number): void {
        this.mixerNode.gain.value = Math.max(0, Math.min(1, volume));
        console.log(`[OutputTrackManager] Set master volume to ${volume}`);
    }

    /**
     * 静音/取消静音特定轨道
     * @param peerIP peer IP 地址
     * @param trackID 轨道 ID
     * @param muted 是否静音
     */
    public muteTrack(peerIP: string, trackID: TrackIDType, muted: boolean): void {
        const key = this.generateDecoderKey(peerIP, trackID);
        const decoderInstance = this.decoders.get(key);
        if (decoderInstance) {
            decoderInstance.gainNode.gain.value = muted ? 0 : 1;
            console.log(`[OutputTrackManager] ${muted ? 'Muted' : 'Unmuted'} track ${peerIP}-${trackID}`);
        }
    }

    /**
     * 获取特定 peer 的所有音频轨道
     * @param peerIP peer IP 地址
     * @returns 轨道数组
     */
    public getPeerAudioTracks(peerIP: string): { trackID: TrackIDType; track: MediaStreamTrack }[] {
        const tracks: { trackID: TrackIDType; track: MediaStreamTrack }[] = [];

        for (const [key, instance] of this.decoders.entries()) {
            if (key.startsWith(peerIP + '-')) {
                const trackID = parseInt(key.split('-')[1]) as TrackIDType;
                tracks.push({ trackID, track: instance.track });
            }
        }

        return tracks;
    }

    /**
     * 移除特定的解码器
     */
    public removeDecoder(peerIP: string, trackID: TrackIDType): void {
        const key = this.generateDecoderKey(peerIP, trackID);
        const decoderInstance = this.decoders.get(key);

        if (decoderInstance) {
            try {
                // 关闭 writer
                decoderInstance.writer.close().catch(err => {
                    console.warn(`[OutputTrackManager] Error closing writer for ${peerIP}-${trackID}:`, err);
                });
                
                // 断开音频节点连接
                decoderInstance.mediaStreamSource.disconnect();
                decoderInstance.gainNode.disconnect();
                decoderInstance.analyserNode.disconnect();
                
                // 关闭解码器和生成器
                decoderInstance.decoder.close();
                decoderInstance.generator.stop();
            } catch (error) {
                console.error(`[OutputTrackManager] Error closing decoder for ${peerIP}-${trackID}:`, error);
            }

            this.decoders.delete(key);
            console.log(`[OutputTrackManager] Removed decoder for ${peerIP}-${trackID}`);
        }
    }

    /**
     * 移除特定 peer 的所有解码器
     */
    public removePeerDecoders(peerIP: string): void {
        const keysToRemove: string[] = [];

        for (const key of this.decoders.keys()) {
            if (key.startsWith(peerIP + '-')) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => {
            const parts = key.split('-');
            const trackID = parseInt(parts[1]) as TrackIDType;
            this.removeDecoder(peerIP, trackID);
        });
    }

    /**
     * 清理所有解码器
     */
    public cleanup(): void {
        for (const [key, instance] of this.decoders.entries()) {
            try {
                // 关闭 writer
                instance.writer.close().catch(err => {
                    console.warn(`[OutputTrackManager] Error closing writer for ${key}:`, err);
                });
                
                // 断开音频节点连接
                instance.mediaStreamSource.disconnect();
                instance.gainNode.disconnect();
                instance.analyserNode.disconnect();
                
                // 关闭解码器和生成器
                instance.decoder.close();
                instance.generator.stop();
            } catch (error) {
                console.error(`[OutputTrackManager] Error during cleanup for ${key}:`, error);
            }
        }
        this.decoders.clear();
        
        // 清理音频元素
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.srcObject = null;
            document.body.removeChild(this.audioElement);
        }
        
        // 关闭 AudioContext
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        console.log('[OutputTrackManager] All decoders and audio resources cleaned up');
    }

    /**
     * 获取当前活跃的解码器数量
     */
    public getActiveDecodersCount(): number {
        return this.decoders.size;
    }

    /**
     * 获取所有活跃的解码器信息
     */
    public getActiveDecodersInfo(): { peerIP: string; trackID: TrackIDType }[] {
        return Array.from(this.decoders.keys()).map(key => {
            const parts = key.split('-');
            return {
                peerIP: parts[0],
                trackID: parseInt(parts[1]) as TrackIDType
            };
        });
    }
}

const initOutputTrackManager = () => {
    OutputTrackManager.getInstance();
}

export { OutputTrackManager, initOutputTrackManager };