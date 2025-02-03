export interface AudioProcessingState {
    ctx_main: AudioContext
    sourceNode: MediaStreamAudioSourceNode | null
    gainNode: GainNode | null
    processorNode: AudioNode | null //ScriptProcessorNode
    mergerNode: ChannelMergerNode | null
    analyser: AnalyserNode | null
    handleAddonDataNode: AudioWorkletNode | null
    addonGainNode: GainNode | null
    addonDestinationNode: MediaStreamAudioDestinationNode | null
    destinationNode: MediaStreamAudioDestinationNode | null

    localOriginalStream: MediaStream | null,
    localFinalStream: MediaStream | null,
    localAddonStream: MediaStream | null

    isNoiseReductionEnabled: boolean;

    isAddonInitialized: boolean;
    audioProcesses: AudioProcess[];
    captureProcess: number | null;
    intervalMs: number;
    captureControl: any;
    bufferLength: any;
    processorInterval: any;

    addonGainValue: number;


    setState: (state: Partial<AudioProcessingState>) => void
    toggleNoiseReduction: (isEnabled: boolean) => void
    setIntervalMs: (ms: number) => void
    updateAudioProcessList: () => void
    startCapture: () => void;
    stopCapture: () => void;
    updateCaptureProcess: (newProcessId: number | null) => void;
    setAddonGainValue: (value: number) => void;
}

export type AudioProcess = {
    processId: number;
    processName: string;
}
