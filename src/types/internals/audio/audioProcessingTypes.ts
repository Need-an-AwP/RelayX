export interface AudioProcessingState {
    ctx_main: AudioContext
    sourceNode: MediaStreamAudioSourceNode | null
    gainNode: GainNode | null
    processorNode: AudioNode | null //ScriptProcessorNode
    mergerNode: ChannelMergerNode | null
    analyser: AnalyserNode | null
    handleAddonDataNode: AudioNode | null
    addonGainNode: GainNode | null
    addonDestinationNode: MediaStreamAudioDestinationNode | null
    destinationNode: MediaStreamAudioDestinationNode | null

    localOriginalStream: MediaStream | null,
    localFinalStream: MediaStream | null,
    localAddonStream: MediaStream | null

    isNoiseReductionEnabled: boolean;

    setState: (state: Partial<AudioProcessingState>) => void
    toggleNoiseReduction: (isEnabled: boolean) => void
}