import type { TrackIDType } from '@/types';
import { useVideoStreamStore } from '@/stores/videoStreamStore';

interface VideoDecoderInstance {
    decoder: VideoDecoder;
    generator: MediaStreamTrackGenerator<VideoFrame>;
    track: MediaStreamTrack;
    writer: WritableStreamDefaultWriter<VideoFrame>;
    waitingForKeyFrame: boolean; // 添加标志位跟踪是否等待key帧
}

/**
 * VideoOutputManager 负责管理来自远端的视频数据流的解码。
 * 它为每个视频轨道（由 peerIP 和 trackID 唯一标识）创建一个 VideoDecoder，
 * 将编码的视频块解码为 VideoFrame，然后通过 MediaStreamTrackGenerator 生成 MediaStreamTrack。
 * 生成的轨道可以通过 getVideoTrack 方法被外部模块获取。
 */
class VideoDecoderManager {
    private static instance: VideoDecoderManager | null = null;
    private decoders: Record<string, VideoDecoderInstance> = {};

    private constructor() {
        console.log('[VideoOutputManager] Initialized');
    }

    public static getInstance(): VideoDecoderManager {
        if (!VideoDecoderManager.instance) {
            VideoDecoderManager.instance = new VideoDecoderManager();
        }
        return VideoDecoderManager.instance;
    }

    private generateDecoderKey(peerIP: string, trackID: TrackIDType): string {
        return `${peerIP}-${trackID}`;
    }

    /**
     * 初始化视频解码器和MediaStreamTrackGenerator
     * @param peerIP peer IP 地址
     * @param trackID 轨道 ID
     * @returns VideoDecoderInstance 或 null
     */
    private initializeDecoderInstance(peerIP: string, trackID: TrackIDType): VideoDecoderInstance | null {
        const key = this.generateDecoderKey(peerIP, trackID);

        try {
            const generator = new MediaStreamTrackGenerator({ kind: 'video' });
            const track = generator;
            const writer = generator.writable.getWriter();

            const decoder = new VideoDecoder({
                output: (videoFrame: VideoFrame) => {
                    writer.write(videoFrame).catch(err => {
                        console.error(`[VideoOutputManager] Failed to write video frame for ${key}:`, err);
                    });
                },
                error: (error: Error) => {
                    console.error(`[VideoOutputManager] Decoder error for ${key}:`, error);
                    // 自动重启解码器
                    setTimeout(() => {
                        this.restartDecoder(peerIP, trackID);
                    }, 100);
                }
            });

            // 配置解码器 (VP09)
            const config: VideoDecoderConfig = {
                codec: 'vp09.00.41.08', // same as encoder
            };
            decoder.configure(config);

            const decoderInstance: VideoDecoderInstance = {
                decoder,
                generator,
                track,
                writer,
                waitingForKeyFrame: true // 新创建的解码器需要等待key帧
            };

            console.log(`[VideoOutputManager] Initialized decoder and video track for ${key}`);
            return decoderInstance;
        } catch (error) {
            console.error(`[VideoOutputManager] Failed to initialize decoder for ${key}:`, error);
            return null;
        }
    }

    private getOrCreateDecoder(peerIP: string, trackID: TrackIDType): VideoDecoderInstance | null {
        const key = this.generateDecoderKey(peerIP, trackID);

        if (this.decoders[key]) {
            return this.decoders[key];
        }

        const decoderInstance = this.initializeDecoderInstance(peerIP, trackID);
        if (!decoderInstance) {
            console.error(`[VideoOutputManager] Failed to create decoder for ${key}`);
            return null;
        }

        this.decoders[key] = decoderInstance;

        // 将生成的track添加到videoStreamStore中
        const { addVideoStream } = useVideoStreamStore.getState();
        addVideoStream(peerIP, trackID, decoderInstance.track);

        return decoderInstance;
    }

    /**
     * 重启特定解码器实例
     * @param peerIP peer IP 地址
     * @param trackID 轨道 ID
     * @returns 重启是否成功
     */
    public restartDecoder(peerIP: string, trackID: TrackIDType): boolean {
        const key = this.generateDecoderKey(peerIP, trackID);
        console.log(`[VideoOutputManager] Restarting decoder for ${key}`);

        // 先移除现有的解码器
        this.removeDecoder(peerIP, trackID);

        // 重新创建解码器
        const newDecoderInstance = this.getOrCreateDecoder(peerIP, trackID);
        
        if (newDecoderInstance) {
            return true;
        }
        
        return false;
    }

    /**
     * 处理来自 WebSocket 的视频数据
     * @param peerIP 来源 peer 的 IP 地址
     * @param trackID 视频轨道 ID
     * @param videoChunk 编码的视频数据块
     */
    public processVideoChunk(peerIP: string, trackID: TrackIDType, videoChunk: EncodedVideoChunk): void {
        const decoderInstance = this.getOrCreateDecoder(peerIP, trackID);
        if (!decoderInstance) {
            console.error(`[VideoOutputManager] Failed to get decoder for ${peerIP}-${trackID}`);
            return;
        }

        // 如果解码器正在等待key帧，检查当前chunk是否为key帧
        if (decoderInstance.waitingForKeyFrame) {
            if (videoChunk.type !== 'key') {
                console.log(`[VideoOutputManager] Decoder ${peerIP}-${trackID} waiting for key frame, skipping delta frame`);
                return;
            } else {
                decoderInstance.waitingForKeyFrame = false;
            }
        }

        try {
            if (decoderInstance.decoder.state === 'configured') {
                decoderInstance.decoder.decode(videoChunk);
            } else {
                console.warn(`[VideoOutputManager] Decoder ${peerIP}-${trackID} not in configured state: ${decoderInstance.decoder.state}`);
            }
        } catch (error) {
            console.error(`[VideoOutputManager] Failed to decode video chunk for ${peerIP}-${trackID}:`, error);
            decoderInstance.waitingForKeyFrame = true;
        }
    }

    /**
     * 获取特定 peer 和 track 的视频轨道
     * @param peerIP peer IP 地址
     * @param trackID 轨道 ID
     * @returns MediaStreamTrack 或 null
     */
    public getVideoTrack(peerIP: string, trackID: TrackIDType): MediaStreamTrack | null {
        const key = this.generateDecoderKey(peerIP, trackID);
        const decoderInstance = this.decoders[key];
        return decoderInstance?.track || null;
    }

    /**
     * 移除特定的解码器和关联的视频流
     */
    public removeDecoder(peerIP: string, trackID: TrackIDType): void {
        const key = this.generateDecoderKey(peerIP, trackID);
        const decoderInstance = this.decoders[key];

        if (decoderInstance) {
            try {
                // 在关闭前先flush解码器队列
                if (decoderInstance.decoder.state === 'configured') {
                    decoderInstance.decoder.flush().catch(err => {
                        console.warn(`[VideoOutputManager] Failed to flush decoder for ${key}:`, err);
                    });
                }
                
                decoderInstance.writer.close().catch(() => { });
                if (decoderInstance.decoder.state !== 'closed') {
                    decoderInstance.decoder.close();
                }
                decoderInstance.generator.stop();
            } catch (error) {
                console.error(`[VideoOutputManager] Error closing decoder for ${key}:`, error);
            }

            // 从videoStreamStore中移除对应的stream
            const { removeVideoStream } = useVideoStreamStore.getState();
            removeVideoStream(peerIP, trackID);
            console.log(`[VideoOutputManager] Removed stream from videoStreamStore for ${key}`);

            delete this.decoders[key];
            console.log(`[VideoOutputManager] Removed decoder for ${key}`);
        }
    }

    /**
     * 移除特定 peer 的所有解码器
     */
    public removePeerDecoders(peerIP: string): void {
        const keysToRemove = Object.keys(this.decoders).filter(key => key.startsWith(`${peerIP}-`));

        keysToRemove.forEach(key => {
            const parts = key.split('-');
            const trackID = parseInt(parts[1]) as TrackIDType;
            this.removeDecoder(peerIP, trackID);
        });

        // 也从videoStreamStore中移除该peer的所有stream
        const { removePeerStreams } = useVideoStreamStore.getState();
        removePeerStreams(peerIP);

        console.log(`[VideoOutputManager] Removed all decoders for peer ${peerIP}`);
    }

    /**
     * 清理所有解码器
     */
    public cleanup(): void {
        for (const key of Object.keys(this.decoders)) {
            const parts = key.split('-');
            const peerIP = parts[0];
            const trackID = parseInt(parts[1]) as TrackIDType;
            this.removeDecoder(peerIP, trackID);
        }
        this.decoders = {};
        console.log('[VideoOutputManager] All decoders cleaned up');
    }
}


export { VideoDecoderManager };
