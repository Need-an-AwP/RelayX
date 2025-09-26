import { create } from 'zustand'
import initNoiseReduceProcessorNode from '@/utils/noiseProcessorNode'

type AduioSessionInfo = {
    device: string;
    pid: number;
    processName: string;
}

interface AudioProcessingState {
    ctx_main: AudioContext
    sourceNode: MediaStreamAudioSourceNode | null
    gainNode: GainNode | null
    processorNode: AudioNode | null //ScriptProcessorNode
    mergerNode: ChannelMergerNode | null
    mergerAnalyser: AnalyserNode | null
    analyser: AnalyserNode | null
    cpaSourceNode: AudioWorkletNode | null
    cpaGainNode: GainNode | null
    cpaAnalyser: AnalyserNode | null
    cpaDestinationNode: MediaStreamAudioDestinationNode | null
    destinationNode: MediaStreamAudioDestinationNode | null

    localOriginalStream: MediaStream | null,
    localFinalStream: MediaStream | null,
    localAddonStream: MediaStream | null

    isNoiseReductionEnabled: boolean;

    isCapturing: string;
    intervalMs: number;
    captureControl: any;
    bufferLength: any;

    cpaGainValue: number;
    audioSessions: AduioSessionInfo[];


    setState: (state: Partial<AudioProcessingState>) => void
    toggleNoiseReduction: (isEnabled: boolean) => void

    startCapture: (pid: string) => void;
    stopCapture: () => void;

    getAudioSessions: () => void;
    setAudioSessions: (data: AduioSessionInfo[]) => void;
    setCpaGainValue: (value: number) => void;
    handlePcmData: (data: any) => void;

    setGainValue: (value: number) => void;
}

const useAudioProcessing = create<AudioProcessingState>((set, get) => ({
    ctx_main: new AudioContext(),

    // audio nodes
    sourceNode: null,
    gainNode: null,
    processorNode: null,
    mergerNode: null,
    mergerAnalyser: null,
    analyser: null,
    cpaSourceNode: null,
    cpaGainNode: null,
    cpaAnalyser: null,
    cpaDestinationNode: null,
    destinationNode: null,

    // streams
    localOriginalStream: null,
    localFinalStream: null,
    localAddonStream: null,

    // flags
    isNoiseReductionEnabled: true,

    // audio capture
    isCapturing: '',
    intervalMs: 500,
    captureControl: null,
    bufferLength: null,

    // values
    cpaGainValue: 100,
    audioSessions: [],

    setState: (state: Partial<AudioProcessingState>) => set(state),
    toggleNoiseReduction: (isEnabled: boolean) => {
        const {
            sourceNode,
            gainNode,
            processorNode,
            mergerNode,
            destinationNode,
            analyser,
            isNoiseReductionEnabled,
        } = get();

        if (!sourceNode || !gainNode || !processorNode || !destinationNode || !analyser) {
            console.error("Audio nodes are not initialized");
            return;
        }

        if (isNoiseReductionEnabled === isEnabled) return;

        // disconnect related nodes
        gainNode.disconnect();
        processorNode.disconnect();

        // if (isEnabled) {
        //     gainNode.connect(processorNode);
        //     processorNode.connect(mergerNode);
        // } else {
        //     gainNode.connect(mergerNode);
        // }
        /*separate micphone stream and addon stream*/
        if (isEnabled) {
            gainNode.connect(processorNode)
            processorNode.connect(analyser)
            analyser.connect(destinationNode)
        } else {
            gainNode.connect(analyser)
            analyser.connect(destinationNode)
        }
        console.log('noise reduction:', isEnabled);

        set({ isNoiseReductionEnabled: isEnabled });
    },
    startCapture: (pid) => {
        window.ipcBridge.send('start-capture', pid)
        set({ isCapturing: pid })
    },
    stopCapture: () => {
        window.ipcBridge.send('stop-capture')
        set({ isCapturing: '' })
    },
    setGainValue: (value: number) => {
        const { gainNode } = get();
        if (gainNode) {
            gainNode.gain.value = value;
        }
    },
    setCpaGainValue: (value: number) => {
        const { cpaGainNode } = get();
        if (cpaGainNode) {
            cpaGainNode.gain.value = value;
        }
    },
    getAudioSessions: () => {
        window.cpa.getAudioSessions();
    },
    setAudioSessions: (data: any) => {
        set({ audioSessions: data })
    },
    handlePcmData: (data: any) => {
        const { cpaSourceNode } = get();
        if (cpaSourceNode) {
            // using default array buffer
            const pcm16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
            const pcm32 = new Float32Array(pcm16.length);
            for (let i = 0; i < pcm32.length; i++) {
                pcm32[i] = pcm16[i] / 32768.0; // Convert from 16-bit int to float
            }

            cpaSourceNode.port.postMessage({ type: 'pcm-data', pcm: pcm32 });
        }
    },
}))

const initializeAudioProcessing = async () => {
    window.ipcBridge.receive('audio-sessions', (data: AduioSessionInfo[]) => {
        console.log('audio-sessions', data)
        data = data.filter(session => session.processName !== "process-audio-capture.exe");
        const { setAudioSessions } = useAudioProcessing.getState();
        setAudioSessions(data)
    })

    window.ipcBridge.receive('capture-format', (data) => {
        console.log('Received capture format:', data);
    })

    window.ipcBridge.receive('pcm-data', (data) => {
        const { handlePcmData } = useAudioProcessing.getState();
        handlePcmData(data)
    })

    const store = useAudioProcessing.getState();

    //start with default input and output devices
    const localStream = await getDefaultLocalAudioStream();
    store.setState({ localOriginalStream: localStream });

    // define nodes
    /*micphone */
    const ctx_main = store.ctx_main;
    const sourceNode = ctx_main.createMediaStreamSource(localStream);
    const gainNode = ctx_main.createGain();
    const processorNode = await initNoiseReduceProcessorNode(ctx_main);
    /*cpa*/
    try {
        await ctx_main.audioWorklet.addModule('audio-processor.js');
    } catch (error) {
        console.error('Error loading audio worklet:', error);
    }
    const cpaSourceNode = new AudioWorkletNode(ctx_main, 'pcm-player', {
        outputChannelCount: [2],
    });
    const cpaGainNode = ctx_main.createGain();
    const cpaAnalyser = ctx_main.createAnalyser();
    const cpaDestinationNode = ctx_main.createMediaStreamDestination();
    /*combine*/
    const mergerNode = ctx_main.createGain();
    const mergerAnalyser = ctx_main.createAnalyser();
    const analyser = ctx_main.createAnalyser();
    const destinationNode = ctx_main.createMediaStreamDestination();
    // connect nodes
    /*separate micphone stream and cpa stream*/
    sourceNode.connect(gainNode)
    gainNode.connect(processorNode)
    processorNode.connect(analyser)
    analyser.connect(destinationNode)

    cpaSourceNode.connect(cpaGainNode)
    cpaGainNode.connect(cpaAnalyser)
    cpaAnalyser.connect(cpaDestinationNode)

    /*merger node combine micphone stream and addon stream*/
    analyser.connect(mergerNode)
    cpaAnalyser.connect(mergerNode)
    mergerNode.connect(mergerAnalyser)

    store.setState({
        sourceNode,
        gainNode,
        processorNode,
        cpaSourceNode,
        cpaGainNode,
        cpaAnalyser,
        cpaDestinationNode,
        mergerNode,
        mergerAnalyser,
        analyser,
        destinationNode,
    })

    const finalStream = destinationNode.stream
    store.setState({ localFinalStream: finalStream })

    const cpaStream = cpaDestinationNode.stream
    store.setState({ localAddonStream: cpaStream })
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