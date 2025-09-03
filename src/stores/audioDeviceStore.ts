import { create } from 'zustand'
import { useAudioProcessing } from './audioProcessingStore'

type AudioDevice = {
    label: string;
    value: string;
}

interface AudioDeviceState {
    inputDevices: AudioDevice[]
    outputDevices: AudioDevice[]
    selectedInput: string
    selectedOutput: string

    setInputDevices: (devices: AudioDevice[]) => void
    setOutputDevices: (devices: AudioDevice[]) => void
    setSelectedInput: (deviceId: string) => void
    setSelectedOutput: (deviceId: string) => void
}

const useAudioDeviceStore = create<AudioDeviceState>((set) => ({
    inputDevices: [],
    outputDevices: [],
    selectedInput: '',
    selectedOutput: '',

    setInputDevices: (devices: AudioDevice[]) => set({ inputDevices: devices }),
    setOutputDevices: (devices: AudioDevice[]) => set({ outputDevices: devices }),
    setSelectedInput: (deviceId: string) => {
        set({ selectedInput: deviceId })
        window.ipcBridge.setUserConfig('initAudioDevices.input', deviceId);
        const { sourceNode, localOriginalStream, ctx_main, gainNode, setState } = useAudioProcessing.getState();
        if (sourceNode && localOriginalStream && gainNode) {
            stopAllTracks(localOriginalStream);
            navigator.mediaDevices.getUserMedia({
                audio: { deviceId: deviceId },
                video: false
            })
                .then((newlocalStream) => {
                    sourceNode.disconnect()
                    const new_sourceNode = ctx_main.createMediaStreamSource(newlocalStream)
                    new_sourceNode.connect(gainNode)
                    setState({
                        sourceNode: new_sourceNode,
                        localOriginalStream: newlocalStream
                    })
                    console.log('new input device:', deviceId);
                })
                .catch(error => {
                    console.error('Error switching audio input device:', error);
                });
        }
    },
    setSelectedOutput: (deviceId: string) => {
        set({ selectedOutput: deviceId });
        window.ipcBridge.setUserConfig('initAudioDevices.output', deviceId );
        const { destinationNode } = useAudioProcessing.getState();
        if (destinationNode) {
            // 如果 destinationNode 是 AudioNode，我们需要获取它的输出元素
            const audioElement = destinationNode as unknown as HTMLAudioElement;
            if (audioElement.setSinkId) {
                audioElement.setSinkId(deviceId)
                    .then(() => {
                        console.log('Output device set to:', deviceId);
                    })
                    .catch(error => {
                        console.error('Error switching audio output device:', error);
                    });
            }
        }

        // 同时设置所有现有的 audio 元素
        document.querySelectorAll('audio').forEach(audio => {
            if (audio.setSinkId) {
                audio.setSinkId(deviceId)
                    .catch(error => {
                        console.error('Error setting sink id for audio element:', error);
                    });
            }
        });
    },
}));

const initialAudioDevices = async () => {
    const store = useAudioDeviceStore.getState();
    const userConfig = await window.ipcBridge.getUserConfig();
    const initAudioDevices = userConfig.initAudioDevices;
    //enumerate input and output devices
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            const inputList: AudioDevice[] = [];
            const outputList: AudioDevice[] = [];

            devices.forEach(device => {
                if (device.kind === 'audioinput') {
                    inputList.push({ label: device.label, value: device.deviceId });
                } else if (device.kind === 'audiooutput') {
                    outputList.push({ label: device.label, value: device.deviceId });
                }
            });

            store.setInputDevices(inputList);
            store.setOutputDevices(outputList);

            const savedInputId = initAudioDevices?.input;
            if (savedInputId && inputList.find(i => i.value === savedInputId)) {
                store.setSelectedInput(savedInputId);
            }
            else if (inputList.find(i => i.value === 'default')) {
                store.setSelectedInput('default');
            }
            else if (inputList.length > 0) {
                store.setSelectedInput(inputList[0].value);
            }

            const savedOutputId = initAudioDevices?.output;
            if (savedOutputId && outputList.find(i => i.value === savedOutputId)) {
                store.setSelectedOutput(savedOutputId);
            }
            else if (outputList.find(i => i.value === 'default')) {
                store.setSelectedOutput('default');
            }
            else if (outputList.length > 0) {
                store.setSelectedOutput(outputList[0].value);
            }

        })
        .catch(error => {
            console.error("Error enumerating devices:", error);
        });
}

const stopAllTracks = (stream: MediaStream) => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
};

export { useAudioDeviceStore, initialAudioDevices }