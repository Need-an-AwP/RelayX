import { TrackID } from "@/types"

const ProcessorState = {
    IDLE: 'idle',
    INITIALIZING: 'initializing',
    RUNNING: 'running',
    STOPPING: 'stopping',
    STOPPED: 'stopped'
} as const;

type ProcessorStateType = typeof ProcessorState[keyof typeof ProcessorState];

export default class MicrophoneAudioProcessor {
    private ws: WebSocket;
    private encoder: AudioEncoder | null = null;
    private state: ProcessorStateType = ProcessorState.IDLE;

    constructor(ws: WebSocket, audioTrack: MediaStreamAudioTrack) {
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
            };


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
            console.log('[audio encoder] AudioEncoder initialized with config:', config);
        } catch (error) {
            console.error('[audio encoder] Failed to initialize AudioEncoder:', error);
            this.state = ProcessorState.STOPPED;
        }
    }

    private handleEncodedChunk(chunk: EncodedAudioChunk, _metadata?: EncodedAudioChunkMetadata) {
        // console.log(`Encoded chunk received:
        //     Type: ${chunk.type} 
        //     Size: ${chunk.byteLength} bytes
        //     Timestamp: ${chunk.timestamp}
        //     Duration: ${chunk.duration} microseconds
        // `);

        const buffer = new Uint8Array(chunk.byteLength);
        chunk.copyTo(buffer);

        const headerSize = 1 + 8;
        const totalSize = headerSize + buffer.length;
        const packet = new ArrayBuffer(totalSize);
        const view = new DataView(packet);

        let offset = 0;
        view.setUint8(offset, TrackID.MICROPHONE_AUDIO); // 轨道ID
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