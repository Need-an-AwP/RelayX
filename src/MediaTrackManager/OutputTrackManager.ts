import type { TrackIDType } from '@/types';
import { AudioContextManager } from '@/AudioManager/AudioContextManager';

interface AudioDecoderInstance {
    decoder: AudioDecoder;
    generator: MediaStreamTrackGenerator<AudioData>;
    track: MediaStreamTrack;
    writer: WritableStreamDefaultWriter<AudioData>;
}

class OutputTrackManager {
    private static instance: OutputTrackManager | null = null;
    private decoders = new Map<string, AudioDecoderInstance>();
    private audioContextManager: AudioContextManager;

    private constructor() {
        // 获取 AudioContextManager 实例
        this.audioContextManager = AudioContextManager.getInstance();
        console.log('[OutputTrackManager] Initialized with AudioContextManager integration');
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

            // extend ws info header to include sample rate and channels if needed
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
                writer
            };

            this.decoders.set(key, decoderInstance);
            
            // 使用 AudioContextManager 创建音频节点
            const success = this.audioContextManager.createTrackAudioNodes(peerIP, trackID.toString(), track);
            
            if (success) {
                console.log(`[OutputTrackManager] Created decoder and audio nodes for ${peerIP}-${trackID}`);
            } else {
                console.warn(`[OutputTrackManager] Failed to create audio nodes for ${peerIP}-${trackID}`);
            }

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
                
                // 关闭解码器和生成器
                instance.decoder.close();
                instance.generator.stop();
            } catch (error) {
                console.error(`[OutputTrackManager] Error during cleanup for ${key}:`, error);
            }
        }
        this.decoders.clear();
        
        // 清理所有音频节点通过 AudioContextManager
        // AudioContextManager 管理自己的清理，我们不直接清理它
        
        console.log('[OutputTrackManager] All decoders cleaned up');
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