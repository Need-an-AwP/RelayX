import { TrackID, type TrackIDType } from "@/types"

const ProcessorState = {
    IDLE: 'idle',
    INITIALIZING: 'initializing',
    RUNNING: 'running',
    STOPPING: 'stopping',
    STOPPED: 'stopped'
} as const;

type ProcessorStateType = typeof ProcessorState[keyof typeof ProcessorState];

export default class InputVideoProcessor {
    private trackID: TrackIDType;
    private ws: WebSocket;
    private encoder: VideoEncoder | null = null;
    private state: ProcessorStateType = ProcessorState.IDLE;
    private videoConfig: VideoEncoderConfig | null = null;
    private videoTrack: MediaStreamVideoTrack;

    constructor(trackID: TrackIDType, ws: WebSocket, videoTrack: MediaStreamVideoTrack) {
        this.trackID = trackID;
        this.ws = ws;
        this.videoTrack = videoTrack;
        this.encodeFromVideoTrack(videoTrack);
    }

    public isActive(): boolean {
        return this.state === ProcessorState.RUNNING;
    }

    private async init() {
        if (this.state !== ProcessorState.IDLE) {
            return; // 避免重复初始化
        }

        this.state = ProcessorState.INITIALIZING;

        try {
            if (!('VideoEncoder' in window)) {
                console.error('VideoEncoder is not supported in this browser');
                this.state = ProcessorState.STOPPED;
                return;
            }

            const trackSettings = this.videoTrack.getSettings();
            const config: VideoEncoderConfig = {
                codec: 'vp09.00.10.08', // VP9 with SVC
                width: trackSettings.width || 1920,
                height: trackSettings.height || 1080,
                framerate: trackSettings.frameRate || 30,
                bitrate: 2_000_000, // 2 Mbps
                scalabilityMode: 'L1T2', // SVC mode
            };

            this.videoConfig = config;

            const support = await VideoEncoder.isConfigSupported(config);
            if (!support.supported) {
                console.error('[video encoder] VideoEncoder configuration not supported:', support);
                this.state = ProcessorState.STOPPED;
                return;
            }

            console.log('[video encoder] VideoEncoder configuration:', config);

            this.encoder = new VideoEncoder({
                output: this.handleEncodedChunk.bind(this),
                error: (error) => {
                    console.error('VideoEncoder error:', error);
                    // 只有在非停止状态时才重置编码器状态
                    if (this.state !== ProcessorState.STOPPING) {
                        this.state = ProcessorState.STOPPED;
                        this.encoder = null;
                    }
                },
            });

            this.encoder.configure(config);
            this.state = ProcessorState.RUNNING;
        } catch (error) {
            console.error('[video encoder] Failed to initialize VideoEncoder:', error);
            this.state = ProcessorState.STOPPED;
        }
    }

    private handleEncodedChunk(chunk: EncodedVideoChunk, _metadata?: EncodedVideoChunkMetadata) {
        // printChunkInfo(chunk, this.videoConfig);

        const buffer = new Uint8Array(chunk.byteLength);
        chunk.copyTo(buffer);

        const headerSize = 1 + 8;
        const totalSize = headerSize + buffer.length;
        const packet = new ArrayBuffer(totalSize);
        const view = new DataView(packet);

        let offset = 0;
        view.setUint8(offset, this.trackID); // 轨道ID
        offset += 1;

        const duration = chunk.duration || 0;
        view.setBigUint64(offset, BigInt(duration), true);
        offset += 8;

        const dataView = new Uint8Array(packet, offset); // 从offset开始的视图
        dataView.set(buffer);

        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(packet);
        } else {
            console.warn('mediaWs is not open. Unable to send video data.');
        }
    }

    private async encodeFromVideoTrack(track: MediaStreamVideoTrack) {
        if (!('MediaStreamTrackProcessor' in window)) {
            console.error('MediaStreamTrackProcessor is not supported in this browser');
            return;
        }

        const processor = new MediaStreamTrackProcessor({ track });
        const reader = processor.readable.getReader();
        this.state = ProcessorState.IDLE; // 准备开始处理

        const processVideo = async () => {
            try {
                while (this.state !== ProcessorState.STOPPING && this.state !== ProcessorState.STOPPED) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    if (this.state === ProcessorState.IDLE) {
                        await this.init();
                    }

                    if (this.encoder && this.state === ProcessorState.RUNNING) {
                        try {
                            this.encoder.encode(value);
                        } catch (error) {
                            console.error('Error encoding frame:', error);
                        }
                    }

                    value.close();
                }
            } catch (error) {
                console.error('Error processing frames:', error);
            } finally {
                reader.releaseLock();
            }
        }

        processVideo();
    }

    public stop() {
        this.state = ProcessorState.STOPPING;

        if (this.encoder) {
            // Flush any pending frames and close the encoder
            this.encoder.flush()
                .then(() => {
                    this.encoder?.close();
                    this.encoder = null;
                    this.state = ProcessorState.STOPPED;
                })
                .catch(error => {
                    console.error('Error flushing encoder:', error);
                    this.state = ProcessorState.STOPPED;
                });
        } else {
            this.state = ProcessorState.STOPPED;
        }

        console.log('Video processing stopped');
    }
}

const printChunkInfo = (chunk: EncodedVideoChunk, videoConfig: VideoEncoderConfig | null) => {
    const durationSeconds = (chunk.duration || 0) / 1_000_000;
    const actualBitrate = durationSeconds > 0 ? (chunk.byteLength * 8) / durationSeconds : 0;
    const targetBitrate = videoConfig?.bitrate || 2_000_000;
    const compressionRatio = actualBitrate / targetBitrate;

    console.log(
        `Encoded chunk received:
            Type: ${chunk.type}
            Size: ${chunk.byteLength} bytes
            Timestamp: ${chunk.timestamp}
            Duration: ${chunk.duration} microseconds (${durationSeconds.toFixed(3)}s)
            actual_bitrate: ${Math.round(actualBitrate)} bps
            target_bitrate: ${targetBitrate} bps
            compression_ratio: ${compressionRatio.toFixed(2)}x`
    );
}