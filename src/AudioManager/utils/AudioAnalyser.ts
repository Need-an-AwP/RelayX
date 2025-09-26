export class AudioAnalyser {
    static createAnalyserNode(audioContext: AudioContext, config?: {
        fftSize?: number;
        smoothingTimeConstant?: number;
    }): AnalyserNode {
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = config?.fftSize || 256;
        analyser.smoothingTimeConstant = config?.smoothingTimeConstant || 0.8;
        return analyser;
    }

    static getFrequencyData(analyserNode: AnalyserNode): Uint8Array {
        const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteFrequencyData(dataArray);
        return dataArray;
    }
    
    /**
     * Get a simple average volume level number from the analyser node
     * @param analyserNode 
     * @returns number between 0 - 255
     */
    static getVolumeLevel(analyserNode: AnalyserNode): number {
        const dataArray = this.getFrequencyData(analyserNode);
        const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length
        return average;
    }
    
    /**
     * Get the RMS (Root Mean Square) level from the analyser node
     * @param analyserNode 
     * @returns number between 0 - 1
     */
    static getRMSLevel(analyserNode: AnalyserNode): number {
        // RMS (Root Mean Square) 音量计算
        const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteTimeDomainData(dataArray);
        
        let rms = 0;
        for (let i = 0; i < dataArray.length; i++) {
            const normalized = (dataArray[i] - 128) / 128;
            rms += normalized * normalized;
        }
        rms = Math.sqrt(rms / dataArray.length);
        return rms;
    }
}