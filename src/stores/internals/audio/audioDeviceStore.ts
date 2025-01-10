import { create } from 'zustand'
import type { AudioDeviceState, AudioDevice } from '@/types'
import { useAudioProcessing } from './audioProcessingStore'

const useAudioDeviceStore = create<AudioDeviceState>((set) => ({
    inputDevices: [],
    outputDevices: [],
    selectedInput: '',
    selectedOutput: '',

    setInputDevices: (devices: AudioDevice[]) => set({ inputDevices: devices }),
    setOutputDevices: (devices: AudioDevice[]) => set({ outputDevices: devices }),
    // setSelectedInput: (deviceId: string) => set({ selectedInput: deviceId }),
    setSelectedInput: (deviceId: string) => {
        set({ selectedInput: deviceId })

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
    // setSelectedOutput: (deviceId: string) => set({ selectedOutput: deviceId }),
    setSelectedOutput: (deviceId: string) => {
        set({ selectedOutput: deviceId });

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
}))

const initialAudioDevices = () => {
    const store = useAudioDeviceStore.getState();
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

            if (inputList.find(i => i.value === 'default')) {
                store.setSelectedInput('default');
            }
            else if (inputList.length > 0) {
                store.setSelectedInput(inputList[0].value);
            }

            if (outputList.find(i => i.value === 'default')) {
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