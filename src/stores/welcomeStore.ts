import { create } from "zustand";

interface WelcomeState {
    nodeHostname: string;
    tailscaleAuthKey: string;
    setNodeHostname: (hostname: string) => void;
    setTailscaleAuthKey: (key: string) => void;

    writeEnv: () => Promise<void>;
}

const useWelcomeStore = create<WelcomeState>((set, get) => ({
    nodeHostname: '',
    tailscaleAuthKey: '',
    setTailscaleAuthKey: (key: string) => set({ tailscaleAuthKey: key }),
    setNodeHostname: (hostname: string) => set({ nodeHostname: hostname }),

    writeEnv: async () => {
        const { nodeHostname, tailscaleAuthKey } = get();
        window.ipcBridge.setEnvConfig({
            NODE_HOSTNAME: nodeHostname,
            TAILSCALE_AUTH_KEY: tailscaleAuthKey
        });
    }
}));

export { useWelcomeStore };