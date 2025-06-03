import { create } from 'zustand';

interface TURNInfo {
    ip: string
    port: number
    realm: string
    username: string
    password: string
}

interface TURNIPCMessage extends TURNInfo {
    type: string
}

interface TURNStore {
    config: RTCConfiguration
    setConfig: (config: RTCConfiguration) => void
    getConfig: () => Promise<RTCConfiguration>
}

const generateConfig = (turnInfo: TURNIPCMessage): RTCConfiguration => {
    const newConfig: RTCConfiguration = {
        iceServers: [
            {
                urls: `turn:${turnInfo.ip}:${turnInfo.port}`,
                username: turnInfo.username,
                credential: turnInfo.password,
            },
        ],
        // 强制只使用TURN服务器，跳过host和srflx候选者
        iceTransportPolicy: 'relay',
        // 设置ICE候选者池大小为0，减少候选者生成
        // iceCandidatePoolSize: 0,
        // 设置bundle策略为max-bundle以减少ICE检查
        // bundlePolicy: 'max-bundle',
    };
    return newConfig;
}

const useTURNStore = create<TURNStore>((set, get) => ({
    config: {} as RTCConfiguration,
    setConfig: (config) => set({ config }),
    getConfig: async () => {
        const currentConfig = get().config;
        if (!currentConfig.iceServers || currentConfig.iceServers.length === 0) {
            try {
                // 通过 IPC 重新请求 TURN 信息
                const turnInfo: TURNIPCMessage = await window.ipcBridge.invoke('request-TURN-info');

                if (turnInfo && turnInfo.type === 'TURNinfo') {

                    const newConfig = generateConfig(turnInfo);

                    // 更新配置
                    set({ config: newConfig });
                    return newConfig;
                } else {
                    console.error('Invalid TURN info received from IPC');
                    return currentConfig;
                }
            } catch (error) {
                console.error('Failed to request TURN info via IPC:', error);
                return currentConfig;
            }
        }

        return currentConfig;
    }
}))

const initializeTURNListeners = () => {
    const { setConfig } = useTURNStore.getState();

    window.ipcBridge.receive('TURNinfo', (message: TURNIPCMessage) => {
        if (message.type === 'TURNinfo') {
            const newConfig = generateConfig(message);
            setConfig(newConfig);
        }
    })
}

export { useTURNStore, initializeTURNListeners }