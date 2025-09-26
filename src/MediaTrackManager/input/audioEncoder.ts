import { TrackID, type TrackIDType } from "@/types"

const ProcessorState = {
    IDLE: 'idle',
    INITIALIZING: 'initializing',
    RUNNING: 'running',
    STOPPING: 'stopping',
    STOPPED: 'stopped'
} as const;

type ProcessorStateType = typeof ProcessorState[keyof typeof ProcessorState];

export default class InputAudioProcessor {
    private trackID: TrackIDType;
    private ws: WebSocket;
    private encoder: AudioEncoder | null = null;
    private state: ProcessorStateType = ProcessorState.IDLE;
    private audioConfig: AudioEncoderConfig | null = null;

    constructor(trackID: TrackIDType, ws: WebSocket, audioTrack: MediaStreamAudioTrack) {
        this.trackID = trackID;
        this.ws = ws;
        this.encodeFromAudioTrack(audioTrack);
    }

    public isActive(): boolean {
        return this.state === ProcessorState.RUNNING;
    }

    private async init(firstFrame: AudioData) {
        if (this.state !== ProcessorState.IDLE) {
            return; // 避免重复初始化
        }

        this.state = ProcessorState.INITIALIZING;

        try {
            if (!('AudioEncoder' in window)) {
                console.error('AudioEncoder is not supported in this browser');
                this.state = ProcessorState.STOPPED;
                return;
            }

            const config: AudioEncoderConfig = {
                codec: 'opus',
                sampleRate: firstFrame.sampleRate || 48000,
                numberOfChannels: firstFrame.numberOfChannels || 1,
                bitrate: 128_000,
                // bitrateMode: 'constant',// CBR mode makes every chunk in one size
            };

            this.audioConfig = config;

            const support = await AudioEncoder.isConfigSupported(config);
            if (!support.supported) {
                console.error('[audio encoder] AudioEncoder configuration not supported:', support);
                this.state = ProcessorState.STOPPED;
                return;
            }


            this.encoder = new AudioEncoder({
                output: this.handleEncodedChunk.bind(this),
                error: (error) => {
                    console.error('AudioEncoder error:', error);
                    // 只有在非停止状态时才重置编码器状态
                    if (this.state !== ProcessorState.STOPPING) {
                        this.state = ProcessorState.STOPPED;
                        this.encoder = null;
                    }
                },
            });

            this.encoder.configure(config);
            this.state = ProcessorState.RUNNING;

            // 配置多个不同目标码率的opus，尝试同步
            // let n = 0;
            // setInterval(() => {
            //     this.encoder!.configure({
            //         ...config,
            //         bitrate: n % 2 === 0 ? 32_000 : 128_000,
            //     })
            //     console.log(`[audio encoder] Reconfigured encoder, bitrate: ${n % 2 === 0 ? 32_000 : 128_000}`);
            //     n++;
            // }, 10 * 1000);
        } catch (error) {
            console.error('[audio encoder] Failed to initialize AudioEncoder:', error);
            this.state = ProcessorState.STOPPED;
        }
    }

    private handleEncodedChunk(chunk: EncodedAudioChunk, _metadata?: EncodedAudioChunkMetadata) {

        // printChunkInfo(chunk, this.audioConfig);

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
            console.warn('mediaWs is not open. Unable to send audio data.');
        }
    }


    private async encodeFromAudioTrack(track: MediaStreamAudioTrack) {
        if (!('MediaStreamTrackProcessor' in window)) {
            console.error('MediaStreamTrackProcessor is not supported in this browser');
            return;
        }

        const processor = new MediaStreamTrackProcessor({ track });
        const reader = processor.readable.getReader();
        this.state = ProcessorState.IDLE; // 准备开始处理

        const processAudio = async () => {
            try {
                while (this.state !== ProcessorState.STOPPING && this.state !== ProcessorState.STOPPED) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    if (this.state === ProcessorState.IDLE) {
                        // 使用第一帧初始化编码器
                        await this.init(value);
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

        processAudio();
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

        console.log('Audio processing stopped');
    }
}

const printChunkInfo = (chunk: EncodedAudioChunk, audioConfig: AudioEncoderConfig | null) => {
    // 计算音频采样帧数量 (不是编码帧数量)
    // 音频采样帧数 = duration(微秒) * sampleRate / 1,000,000
    const d = chunk.duration || 0;
    const sampleRate = audioConfig?.sampleRate || 48000;
    const audioSampleFrames = Math.round((d * sampleRate) / 1_000_000);

    // 计算实际比特率和理论比特率的比较
    const durationSeconds = d / 1_000_000;
    const actualBitrate = durationSeconds > 0 ? (chunk.byteLength * 8) / durationSeconds : 0;
    const targetBitrate = audioConfig?.bitrate || 128_000;
    const compressionRatio = actualBitrate / targetBitrate;

    console.log(
        `Encoded chunk received:
            Type: ${chunk.type} 
            Size: ${chunk.byteLength} bytes
            Timestamp: ${chunk.timestamp}
            Duration: ${chunk.duration} microseconds (${durationSeconds.toFixed(3)}s)
            audio_sample_frames: ${audioSampleFrames} (采样点数量)
            actual_bitrate: ${Math.round(actualBitrate)} bps
            target_bitrate: ${targetBitrate} bps
            compression_ratio: ${compressionRatio.toFixed(2)}x`
    );
}