import { create } from 'zustand'
import initNoiseReduceProcessorNode from '@/utils/noiseProcessorNode'

type AudioProcess = {
    processId: number;
    processName: string;
}

interface AudioProcessingState {
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
    isWorkletModuleRegistered: boolean;
    audioProcesses: AudioProcess[];
    captureProcess: number | null;
    isCapturing: boolean;
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
    setGainValue: (value: number) => void;
    setAddonGainValue: (value: number) => void;
}

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

    // audio capture
    isAddonInitialized: false,
    isWorkletModuleRegistered: false,
    audioProcesses: [],
    captureProcess: null,
    isCapturing: false,
    intervalMs: 500,
    captureControl: null,
    bufferLength: null,
    processorInterval: null,

    // values
    addonGainValue: 100,


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
            processorNode.connect(destinationNode)
            processorNode.connect(analyser)
        } else {
            gainNode.connect(destinationNode)
            gainNode.connect(analyser)
        }
        console.log('noise reduction:', isEnabled);

        set({ isNoiseReductionEnabled: isEnabled });
    },
    setIntervalMs: (ms: number) => set({ intervalMs: ms }),
    updateAudioProcessList: async () => {
        try {
            const electronPid = await window.winAudioCapture.getElectronProcessId();
            const processesList = window.winAudioCapture.getAudioProcessInfo();
            const newProcessList = processesList.filter((item: any) => {
                return !electronPid.includes(item.processId) &&
                    item.processId !== 0 &&
                    item.processName !== 'audiodg.exe' &&
                    item.processName !== 'electron.exe';
            });
            // console.log('newProcessList:', newProcessList,'\n', 'electronPid:', electronPid);
            set({ audioProcesses: newProcessList });
        } catch (error) {
            console.error("error updating audio process list:", error);
        }
    },
    startCapture: () => {
        const { captureProcess, intervalMs, handleAddonDataNode, ctx_main } = get();
        if (captureProcess !== null) {
            set({ isCapturing: true });
            console.log(window.winAudioCapture.initializeCLoopbackCapture(captureProcess));

            const res = window.winAudioCapture.getActivateStatus();
            if (res.interfaceActivateResult === 0) {
                try {
                    const control = window.winAudioCapture.capture_async(intervalMs, (err: any, result: any) => {
                        if (err) {
                            console.error("Capture error:", err);
                            return;
                        }

                        if (result !== null && handleAddonDataNode !== null) {
                            ctx_main.decodeAudioData(result.wavData.buffer)
                                .then((audioBuffer: AudioBuffer) => {
                                    const wavChannelData = audioBuffer.getChannelData(0)
                                    handleAddonDataNode.port.postMessage(wavChannelData)
                                })
                                .catch((err) => {
                                    console.log("decode error:", err);
                                })
                        }
                    });
                    set({ captureControl: control });
                } catch (error) {
                    console.error("Capture error:", error);
                }
            } else {
                console.log('initialize capture failed');
            }
        }
    },
    stopCapture: () => {
        const { captureControl } = get();
        if (captureControl && captureControl.stop) {
            captureControl.stop();
            set({ captureControl: null, isCapturing: false });
        }
    },
    updateCaptureProcess: (newProcessId: number | null) => {
        const { captureControl, stopCapture, startCapture } = get();
        set({ captureProcess: newProcessId });
        if (newProcessId === null) {
            stopCapture();
            return;
        }
        if (captureControl !== null) {
            console.log("new capture process:", newProcessId);
            stopCapture();
        }
        startCapture();
    },
    setGainValue: (value: number) => {
        const { gainNode } = get();
        if (gainNode) {
            gainNode.gain.value = value;
        }
    },
    setAddonGainValue: (value: number) => {
        const { addonGainNode } = get();
        set({ addonGainValue: value });
        // 使用 requestAnimationFrame 平滑更新 gainNode 的值
        if (addonGainNode) {
            requestAnimationFrame(() => {
                addonGainNode.gain.value = value / 100;
            });
        }
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
    const processorNode = await initNoiseReduceProcessorNode(ctx_main);
    const addonGainNode = ctx_main.createGain();
    const addonDestinationNode = ctx_main.createMediaStreamDestination();
    const mergerNode = ctx_main.createChannelMerger();
    const analyser = ctx_main.createAnalyser();
    const destinationNode = ctx_main.createMediaStreamDestination();
    // connect nodes
    /*merge connection
    await setupAddonHandleAudioWorklet(ctx_main);
    sourceNode.connect(gainNode)
    gainNode.connect(processorNode)
    processorNode.connect(mergerNode)
    mergerNode.connect(destinationNode)
    mergerNode.connect(analyser)
    const { handleAddonDataNode } = useAudioProcessing.getState()
    if (handleAddonDataNode) {
        handleAddonDataNode.connect(addonGainNode)
    }
    addonGainNode.connect(mergerNode)
    addonGainNode.connect(addonDestinationNode)
    */

    /*separate micphone stream and addon stream*/
    await setupAddonHandleAudioWorklet(ctx_main);
    sourceNode.connect(gainNode)
    gainNode.connect(processorNode)
    processorNode.connect(destinationNode)
    processorNode.connect(analyser)

    const { handleAddonDataNode } = useAudioProcessing.getState()
    if (handleAddonDataNode) {
        handleAddonDataNode.connect(addonGainNode)
    }
    addonGainNode.connect(addonDestinationNode)


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

    // initialize capture addon before capture
    if (!store.isAddonInitialized) {
        const res = window.winAudioCapture.initializeCapture()
        console.log('initialize capture addon status:', res)
        store.setState({ isAddonInitialized: true })
    }
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

const setupAddonHandleAudioWorklet = async (ctx: AudioContext) => {
    if (useAudioProcessing.getState().isWorkletModuleRegistered) return;

    try {
        // import handle-addon-data.js is not working in package, so use blob to load it
        const workletCode = `
            function concatenateByteArrays(array1, array2) {
                const result = new Float32Array(array1.length + array2.length);
                result.set(array1, 0);
                result.set(array2, array1.length);
                return result;
            }


            class HandleAddonData extends AudioWorkletProcessor {
                constructor() {
                    super();
                    this.audioBuffer = new Float32Array(0); // 用于缓存外部音频数据
                    this.lastReceivedTime = 0;
                    this.originData = new Float32Array(0);
                    this.offset = 0;
                    this.port.onmessage = (event) => {// 拼接外部数据
                        // console.log('received data, '+(Date.now()-this.lastReceivedTime))
                        // console.log(event.data)
                        this.port.postMessage(Date.now()-this.lastReceivedTime)
                        this.lastReceivedTime = Date.now()
                        this.audioBuffer = concatenateByteArrays(this.audioBuffer, event.data)
                        this.originData = event.data
                    };

                }

                process(inputs, outputs, parameters) {
                    const output = outputs[0]
                    output.forEach((channel) => {
                        if (!this.audioBuffer.length) {
                            channel.fill(0); // 如果dataBuffer为空,输出静默
                        } else {
                            const blockData = this.audioBuffer.subarray(0, 128)
                            channel.set(blockData)
                            this.audioBuffer = this.audioBuffer.subarray(128)
                        }
                    });
                    this.port.postMessage({type: 'bufferLength', data: this.audioBuffer.length})
                    return true;
                }
            }

            registerProcessor('handle-addon-data', HandleAddonData);
        `
        const blob = new Blob([workletCode], { type: 'application/javascript' });
        const workletUrl = URL.createObjectURL(blob);
        await ctx.audioWorklet.addModule(workletUrl);
        const handleAddonDataNode = new AudioWorkletNode(ctx, 'handle-addon-data')
        useAudioProcessing.getState().setState({ handleAddonDataNode })
        const { addonGainNode } = useAudioProcessing.getState();
        if (addonGainNode) {
            handleAddonDataNode.connect(addonGainNode)
        }

        handleAddonDataNode.port.onmessage = (event) => {
            if (event.data.type === 'bufferLength') {
                useAudioProcessing.getState().setState({ bufferLength: event.data.data });
            } else {
                useAudioProcessing.getState().setState({ processorInterval: event.data });
            }
        }

        useAudioProcessing.getState().setState({ isWorkletModuleRegistered: true })
    } catch (error) {
        console.error("Failed to set up AudioWorklet:", error);
    }
}

export { useAudioProcessing, initializeAudioProcessing }