// A simple Ring Buffer implementation for audio processing.
class RingBuffer {
    constructor(length) {
        this.readIdx = 0;
        this.writeIdx = 0;
        this.buffer = new Float32Array(length);
        this.length = length;
    }

    // Writes data to the buffer.
    push(data) {
        for (let i = 0; i < data.length; i++) {
            this.buffer[this.writeIdx] = data[i];
            this.writeIdx = (this.writeIdx + 1) % this.length;
        }
    }

    // Reads data from the buffer.
    pull(data) {
        for (let i = 0; i < data.length; i++) {
            data[i] = this.buffer[this.readIdx];
            this.readIdx = (this.readIdx + 1) % this.length;
        }
    }

    // Returns the number of available samples to read.
    available_read() {
        return (this.writeIdx - this.readIdx + this.length) % this.length;
    }

    // Returns the number of available slots to write.
    available_write() {
        return this.length - this.available_read();
    }
}

class PcmPlayer extends AudioWorkletProcessor {
    constructor(options) {
        super();
        const { sampleRate = 48000, channels = 2 } = options.processorOptions || {};
        // Create a ring buffer with a size that can hold ~5 seconds of audio data.
        this.ringBuffer = new RingBuffer(sampleRate * channels * 5);
        this.port.onmessage = (e) => {
            if (e.data.type === 'pcm-data') {
                // console.log(`[AudioWorklet] Received pcm-data, pushing ${e.data.pcm.length} samples to ring buffer.`);
                this.ringBuffer.push(e.data.pcm);
            }
        };
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const channelCount = output.length;

        const available = this.ringBuffer.available_read();

        // The process block size is typically 128 frames.
        const requiredSamples = output[0].length * channelCount;

        if (available < requiredSamples) {
            // Not enough data, output silence.
            for (let channel = 0; channel < channelCount; channel++) {
                output[channel].fill(0);
            }
            return true;
        }

        const buffer = new Float32Array(requiredSamples);
        this.ringBuffer.pull(buffer);


        // console.log(`[AudioWorklet] Processing audio. Channels: ${channelCount}, Required Samples: ${requiredSamples}, Available: ${available}`);
        // const sampleSlice = Array.from(buffer.slice(0, 5));
        // console.log(`[AudioWorklet] Pulled from buffer. First 5 samples:`, sampleSlice);


        if (channelCount === 1) {
            // Mono: mix down or just take left channel
            for (let i = 0; i < output[0].length; i++) {
                output[0][i] = buffer[i * 2]; // Or mix: (buffer[i*2] + buffer[i*2+1]) / 2
            }
        } else {
            // Stereo or more
            for (let i = 0; i < output[0].length; i++) {
                for (let channel = 0; channel < channelCount; channel++) {
                    output[channel][i] = buffer[i * channelCount + channel];
                }
            }
        }

        return true;
    }
}

registerProcessor('pcm-player', PcmPlayer); 