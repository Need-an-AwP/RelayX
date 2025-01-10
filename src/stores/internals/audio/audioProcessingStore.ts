import { create } from 'zustand'
import type { AudioProcessingState } from '@/types'
import initNoiseReduceProcessorNode from '@/utils/noiseProcessorNode'

const useAudioProcessing = create<AudioProcessingState>((set, get) => ({
    ctx_main: new AudioContext(),

    // audio nodes
    sourceNode: null,
    gainNode: null,
    processorNode: null,
    mergerNode: null,
    analyser: null,
    handleAddonDataNode: null,
    addonGainNode: null,
    addonDestinationNode: null,
    destinationNode: null,

    // streams
    localOriginalStream: null,
    localFinalStream: null,
    localAddonStream: null,

    // flags
    isNoiseReductionEnabled: true,

    setState: (state: Partial<AudioProcessingState>) => set(state),
    toggleNoiseReduction: (isEnabled: boolean) => {
        const {
            sourceNode,
            gainNode,
            processorNode,
            mergerNode,
            isNoiseReductionEnabled
        } = get();

        if (!sourceNode || !gainNode || !processorNode || !mergerNode) {
            console.error("Audio nodes are not initialized");
            return;
        }

        if (isNoiseReductionEnabled === isEnabled) return;

        // disconnect related nodes
        gainNode.disconnect();
        processorNode.disconnect();

        if (isEnabled) {
            gainNode.connect(processorNode);
            processorNode.connect(mergerNode);
        } else {
            gainNode.connect(mergerNode);
        }
        console.log('noise reduction:', isEnabled);

        set({ isNoiseReductionEnabled: isEnabled });
    }
}))

const initializeAudioProcessing = async () => {
    const store = useAudioProcessing.getState();

    //start with default input and output devices
    const localStream = await getDefaultLocalAudioStream();
    store.setState({ localOriginalStream: localStream });

    // define nodes
    const ctx_main = store.ctx_main;
    const sourceNode = ctx_main.createMediaStreamSource(localStream);
    const gainNode = ctx_main.createGain();
    const processorNode = initNoiseReduceProcessorNode(ctx_main);
    const addonGainNode = ctx_main.createGain();
    const addonDestinationNode = ctx_main.createMediaStreamDestination();
    const mergerNode = ctx_main.createChannelMerger();
    const analyser = ctx_main.createAnalyser();
    const destinationNode = ctx_main.createMediaStreamDestination();
    // connect nodes
    sourceNode.connect(gainNode)
    gainNode.connect(processorNode)
    processorNode.connect(mergerNode)
    addonGainNode.connect(mergerNode)
    addonGainNode.connect(addonDestinationNode)
    mergerNode.connect(destinationNode)
    mergerNode.connect(analyser)

    store.setState({
        sourceNode,
        gainNode,
        processorNode,
        addonGainNode,
        addonDestinationNode,
        mergerNode,
        analyser,
        destinationNode,
    })

    const finalStream = destinationNode.stream
    store.setState({ localFinalStream: finalStream })

    const addonStream = addonDestinationNode.stream
    store.setState({ localAddonStream: addonStream })


}

const getDefaultLocalAudioStream = async (): Promise<MediaStream> => {
    // stopAllTracks(localStream);
    let stream;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        //console.log(stream);
    } catch (err: any) {
        console.error("Error accessing microphone:", err.message);
        const emptyAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        const emptyAudioSource = emptyAudioContext.createMediaStreamDestination();
        stream = new MediaStream([emptyAudioSource.stream.getAudioTracks()[0]]);
    }
    return stream;
}

export { useAudioProcessing, initializeAudioProcessing }