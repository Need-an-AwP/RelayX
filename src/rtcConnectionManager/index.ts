import rtcConnection from "./rtcConnection";

type StateUpdateCallback = (peerID: string, state: RTCPeerConnectionState) => void;

export default class rtcConnectionManager {
    private static instance: rtcConnectionManager;
    public RTCconnections: Map<string, rtcConnection> = new Map();
    public IPtoPeerID: Map<string, string> = new Map();
    private stateUpdateCallback?: StateUpdateCallback;

    constructor() { }

    public static getInstance(): rtcConnectionManager {
        if (!rtcConnectionManager.instance) {
            rtcConnectionManager.instance = new rtcConnectionManager()
        }
        return rtcConnectionManager.instance
    }

    // 设置状态更新回调
    public setStateUpdateCallback(callback: StateUpdateCallback) {
        this.stateUpdateCallback = callback;
    }

    // 创建新的RTC连接
    public createConnection(peerID: string, peerIP: string, isOffer: boolean) {
        // skip if connection already exists
        if (this.RTCconnections.has(peerID)) {
            // this.closeConnection(peerID);
            console.log(`Connection for peer ${peerID} already exists`)
        }

        // 创建新连接
        const connection = new rtcConnection(peerID, peerIP, isOffer);
        this.RTCconnections.set(peerID, connection);
        this.IPtoPeerID.set(peerIP, peerID);

        // 设置连接状态监听
        this.setupConnectionStateListener(connection, peerID);
    }

    // 关闭指定连接
    public closeConnection(peerID: string): void {
        const connection = this.RTCconnections.get(peerID);
        if (connection) {
            // 调用连接的cleanup方法
            connection.cleanup();
            this.RTCconnections.delete(peerID);
            console.log(`Connection ${peerID} removed from manager`);
        }
    }

    // 获取连接
    public async getConnection({ peerID, peerIP }: { peerID?: string, peerIP?: string }): Promise<rtcConnection | undefined> {

        if (peerID) {
            const connection = this.RTCconnections.get(peerID)
            if (connection) {
                return connection;
            }
        }
        if (peerIP) {
            const peerID = this.IPtoPeerID.get(peerIP)
            if (peerID) {
                return this.RTCconnections.get(peerID)
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (peerID) {
            const connection = this.RTCconnections.get(peerID)
            if (connection) {
                return connection;
            }
        }
        if (peerIP) {
            const peerID = this.IPtoPeerID.get(peerIP)
            if (peerID) {
                return this.RTCconnections.get(peerID)
            }
        }
        
        console.error(`Connection ${peerIP} not found in manager`)
        return undefined;
    }

    public getAllConnections(): Map<string, rtcConnection> {
        return this.RTCconnections;
    }

    // 设置连接状态监听器
    private setupConnectionStateListener(connection: rtcConnection, peerID: string) {
        // 设置状态变化回调
        connection.setStateChangeCallback((state: RTCPeerConnectionState) => {
            console.log(`Connection ${peerID} state changed to: ${state}`);

            // 如果有store的状态更新回调，则调用它
            if (this.stateUpdateCallback) {
                this.stateUpdateCallback(peerID, state);
            }
        });
    }

    // 关闭所有连接
    public closeAllConnections(): void {
        for (const [peerID] of this.RTCconnections) {
            this.closeConnection(peerID);
        }
    }
}

