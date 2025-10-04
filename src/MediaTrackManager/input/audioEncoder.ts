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
    private static bitrateList = [32_000, 64_000, 128_000];
    private encoders: Record<number, AudioEncoder> = {};
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

            for (const bitrate of InputAudioProcessor.bitrateList) {
                const encoder = new AudioEncoder({
                    output: (chunk: EncodedAudioChunk, metadata?: EncodedAudioChunkMetadata) => {
                        this.handleMultipleEncoders(chunk, bitrate, metadata);
                    },
                    error: (error) => {
                        console.error(`${bitrate} AudioEncoder error:`, error);
                        if (this.state !== ProcessorState.STOPPING) {
                            delete this.encoders[bitrate];
                        }
                    },
                });
                const cfg = { ...config, bitrate };
                encoder.configure(cfg);
                this.encoders[bitrate] = encoder;
            }

            // this.encoder = new AudioEncoder({
            //     output: this.handleEncodedChunk.bind(this),
            //     error: (error) => {
            //         console.error('AudioEncoder error:', error);
            //         // 只有在非停止状态时才重置编码器状态
            //         if (this.state !== ProcessorState.STOPPING) {
            //             this.state = ProcessorState.STOPPED;
            //             this.encoder = null;
            //         }
            //     },
            // });
            // this.encoder.configure(config);

            this.state = ProcessorState.RUNNING;
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

    private handleMultipleEncoders(chunk: EncodedAudioChunk, bitrate: number, metadata?: EncodedAudioChunkMetadata) {
        const buffer = new Uint8Array(chunk.byteLength);
        chunk.copyTo(buffer);

        const headerSize = 1 + 8 + 4; // trackID + duration + bitrate
        const totalSize = headerSize + buffer.length;
        const packet = new ArrayBuffer(totalSize);
        const view = new DataView(packet);

        let offset = 0;
        view.setUint8(offset, this.trackID); // 轨道ID
        offset += 1;

        const duration = chunk.duration || 0;
        view.setBigUint64(offset, BigInt(duration), true); // duration
        offset += 8;

        view.setUint32(offset, bitrate, true); // 比特率
        offset += 4;

        const dataView = new Uint8Array(packet, offset);
        dataView.set(buffer);

        // 发送多比特率编码数据
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(packet);
        } else {
            console.warn('mediaWs is not open. Unable to send multi-bitrate audio data.');
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

                    if (this.state === ProcessorState.RUNNING) {
                        try {
                            // this.encoder.encode(value);

                            this.encoders && Object.values(this.encoders).forEach(enc => {
                                enc.encode(value);
                            });
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

        // 停止主编码器
        if (this.encoder) {
            this.encoder.flush()
                .then(() => {
                    this.encoder?.close();
                    this.encoder = null;
                })
                .catch(error => {
                    console.error('Error flushing main encoder:', error);
                });
        }

        // 停止所有多比特率编码器
        const flushPromises = Object.entries(this.encoders).map(([bitrate, encoder]) => {
            return encoder.flush()
                .then(() => {
                    encoder.close();
                    console.log(`Closed encoder for ${bitrate}bps`);
                })
                .catch(error => {
                    console.error(`Error flushing encoder ${bitrate}bps:`, error);
                });
        });

        // 等待所有编码器完成
        Promise.all(flushPromises)
            .then(() => {
                this.encoders = {};
                this.state = ProcessorState.STOPPED;
                console.log('All audio encoders stopped');
            })
            .catch(error => {
                console.error('Error stopping audio encoders:', error);
                this.encoders = {};
                this.state = ProcessorState.STOPPED;
            });
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