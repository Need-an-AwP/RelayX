export interface AudioDevice {
    label: string;
    value: string;
}

export interface AudioDeviceState {
    inputDevices: AudioDevice[]
    outputDevices: AudioDevice[]
    selectedInput: string
    selectedOutput: string

    setInputDevices: (devices: AudioDevice[]) => void
    setOutputDevices: (devices: AudioDevice[]) => void
    setSelectedInput: (deviceId: string) => void
    setSelectedOutput: (deviceId: string) => void
}

