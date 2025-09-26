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
    private frameCount: number = 0;
    private keyFrameInterval: number = 30;

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
                codec: 'vp09.00.41.08',//'avc1.4d001f',//'hev1.1.6.L93.B0',//'av01.0.01M.08',//
                width: trackSettings.width || 1920,
                height: trackSettings.height || 1080,
                framerate: trackSettings.frameRate || 30,
                bitrate: 500_000, // 0.5 Mbps
                // hardwareAcceleration: 'prefer-hardware',
                // scalabilityMode: 'L1T3', // only L1 SVC mode is supported
            };

            this.videoConfig = config;

            // const codecsLevels = [
            //     10, 11, 20, 21, 30, 31, 40, 41, 50, 51, 52, 60, 61, 62
            // ]

            // const svcModes = [
            //     'S2T3',
            //     'L1T1', 'L1T2', 'L1T3',
            //     'L2T1', 'L2T2', 'L2T3',
            //     'L3T1', 'L3T2', 'L3T3',
            //     'L2T1h', 'L2T2h', 'L2T3h',
            //     'L3T1h', 'L3T2h', 'L3T3h',
            //     'L2T2_KEY', 'L2T2_KEY_SHIFT',
            //     'L2T3_KEY', 'L2T3_KEY_SHIFT',
            //     'L3T1_KEY', 'L3T2_KEY', 'L3T3_KEY',
            //     'L3T2_KEY_SHIFT', 'L3T3_KEY_SHIFT'
            // ];

            // for (const mode of svcModes) {
            //     const test_config = { ...config };
            //     // test_config.codec = `vp09.00.${level.toString().padStart(2, '0')}.08`;
            //     test_config.scalabilityMode = mode;
            //     console.log(test_config)
            //     const support = await VideoEncoder.isConfigSupported(test_config);
            //     console.log(`[video encoder] Checking support for scalabilityMode=${mode}:`, support.supported);
            // }

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
                            const needsKeyFrame = this.frameCount % this.keyFrameInterval === 0;
                            this.encoder.encode(value, { keyFrame: needsKeyFrame });
                            this.frameCount++;
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
        this.frameCount = 0;
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
    // Calculate duration in seconds based on framerate
    const frameDurationSeconds = videoConfig?.framerate ? 1 / videoConfig.framerate : 0;
    // Convert to microseconds for consistency with chunk.duration unit
    const calculatedDuration = frameDurationSeconds * 1000000;

    // Calculate bitrate based on the calculated duration
    const actualBitrate = frameDurationSeconds > 0 ? (chunk.byteLength * 8) / frameDurationSeconds : 0;
    const targetBitrate = videoConfig?.bitrate || 0;

    console.log(
        `Encoded chunk received:
            Type: ${chunk.type}
            Size: ${chunk.byteLength} bytes
            Timestamp: ${chunk.timestamp}
            Duration: ${calculatedDuration} microseconds
            actual_bitrate: ${actualBitrate / 1_000_000} mbps
            target_bitrate: ${targetBitrate / 1_000_000} mbps`
    );
}