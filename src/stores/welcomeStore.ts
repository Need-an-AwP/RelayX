import { create } from "zustand";

interface WelcomeState {
    nodeHostname: string;
    tailscaleAuthKey: string;
    isAccountWaiting: boolean;
    isInvalidKey: boolean;
    isVarifyingKey: boolean;

    setIsVarifyingKey: (isVarifying: boolean) => void;
    setIsInvalidKey: (isInvalid: boolean) => void;
    setIsAccountWaiting: (isWaiting: boolean) => void;
    setNodeHostname: (hostname: string) => void;
    setTailscaleAuthKey: (key: string) => void;

    writeEnv: () => void;
}

const useWelcomeStore = create<WelcomeState>((set, get) => ({
    isVarifyingKey: false,
    isInvalidKey: false,
    isAccountWaiting: false,
    nodeHostname: '',
    tailscaleAuthKey: '',

    setIsVarifyingKey: (isVarifying: boolean) => set({ isVarifyingKey: isVarifying }),
    setIsInvalidKey: (isInvalid: boolean) => set({ isInvalidKey: isInvalid }),
    setIsAccountWaiting: (isWaiting: boolean) => set({ isAccountWaiting: isWaiting }),
    setTailscaleAuthKey: (key: string) => set({ tailscaleAuthKey: key }),
    setNodeHostname: (hostname: string) => set({ nodeHostname: hostname }),

    writeEnv: () => {
        const { nodeHostname, tailscaleAuthKey } = get();
        console.log('Writing env:', { nodeHostname, tailscaleAuthKey });
        window.ipcBridge.setEnvConfig({
            NODE_HOSTNAME: nodeHostname,
            TAILSCALE_AUTH_KEY: tailscaleAuthKey
        });
    }
}));

export { useWelcomeStore };