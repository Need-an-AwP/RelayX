import { create } from 'zustand'
import rtcConnectionManager from '@/rtcConnectionManager'
import type rtcConnection from '@/rtcConnectionManager/rtcConnection'
import type { ConnectionState, RTCOfferMessage, RTCAnswerMessage } from '@/types'


interface RTCStore {
    connections: Map<string, ConnectionState>
    manager: rtcConnectionManager
    // 操作方法
    createConnection: (peerID: string, peerIP: string, isOffer: boolean) => void
    closeConnection: (peerID: string) => void
    updateConnectionState: (peerID: string, state: RTCPeerConnectionState) => void
    getConnection: ({ peerID, peerIP }: { peerID?: string, peerIP?: string }) => Promise<rtcConnection | null>
    sendDMs: (peerIPs: string[], message: string) => void
    getAllConnections: () => Map<string, rtcConnection>
    // 状态查询方法
    isConnected: (peerID: string) => boolean
    getConnectionState: (peerID: string) => RTCPeerConnectionState | null
}


const useRTCStore = create<RTCStore>((set, get) => {
    // 创建manager实例
    const manager = rtcConnectionManager.getInstance();

    // 设置状态更新回调
    manager.setStateUpdateCallback((peerID: string, state: RTCPeerConnectionState) => {
        set((prevState) => ({
            connections: new Map(prevState.connections).set(peerID, {
                peerID,
                state
            })
        }));
    });

    window.ipcBridge.receive('http/offer_ice', async (message: RTCOfferMessage) => {
        console.log("Received http/offer_ice message:", message);
        
        // 动态导入以避免循环依赖
        import('./tailscaleStore').then(async ({ useOnlinePeersStore }) => {
            const { peers } = useOnlinePeersStore.getState();
            
            // 通过peerIP找到对应的peerID
            let targetPeerID: string | undefined;
            for (const [peerID, peerInfo] of Object.entries(peers)) {
                // peerInfo.TailscaleIPs 是一个 any[] 数组，需要转换为字符串比较
                if (peerInfo.TailscaleIPs && peerInfo.TailscaleIPs.length > 0) {
                    const peerIPStr = String(peerInfo.TailscaleIPs[0]);
                    if (peerIPStr === message.From) {
                        targetPeerID = peerID;
                        break;
                    }
                }
            }
            
            if (!targetPeerID) {
                console.error(`Cannot find peerID for IP: ${message.From},peers:`, peers);
                return;
            }
            
            // 检查连接是否已存在，如果不存在则创建（answer端）
            let connection = await get().getConnection({ peerIP: message.From });
            if (!connection) {
                console.log(`Creating answer connection for peer ${targetPeerID} (${message.From})`);
                get().createConnection(targetPeerID, message.From, false); // isOffer = false
                
                // 重新获取刚创建的连接
                connection = await get().getConnection({ peerIP: message.From });
            }
            
            console.log('transceivers:', message.transceivers);
            
            if (connection) {
                connection.handleOffer(message.Offer, message.Ice, message.transceivers);
            } else {
                console.error(`Failed to create or find connection for peer ${message.From}`);
            }
        });
    })

    window.ipcBridge.receive('http/answer_ice', async (message: RTCAnswerMessage) => {
        console.log("Received http/answer_ice message:", message);
        const connection = await get().getConnection({ peerIP: message.From })

        if (connection) {
            connection.handleAnswer(message.Answer, message.Ice)
        } else {
            console.error(`Connection not found for peer ${message.From} when handling answer`);
        }
    })

    return {
        connections: new Map(),
        manager,

        createConnection: (peerID: string, peerIP: string, isOffer: boolean) => {
            const { manager } = get()

            // 检查是否已存在连接
            if (manager.RTCconnections.has(peerID)) {
                // console.log(`Connection for peer ${peerID} already exists`)
                return
            } else{
                console.log(`Creating ${isOffer ? 'OFFER' : 'ANSWER'} connection for peer: ${peerID}`)
            }

            // 创建新连接
            manager.createConnection(peerID, peerIP, isOffer)

            // 更新store状态
            set((state) => ({
                connections: new Map(state.connections).set(peerID, {
                    peerID,
                    state: 'new' as RTCPeerConnectionState
                })
            }))

            console.log(`Created ${isOffer ? 'OFFER' : 'ANSWER'} connection for peer: ${peerID}`)
        },

        closeConnection: (peerID: string) => {
            const { manager } = get()

            // 关闭manager中的连接
            manager.closeConnection(peerID)

            // 从store中移除连接状态
            set((state) => {
                const newConnections = new Map(state.connections)
                newConnections.delete(peerID)
                return { connections: newConnections }
            })

            console.log(`Closed connection for peer: ${peerID}`)
        },

        updateConnectionState: (peerID: string, state: RTCPeerConnectionState) => {
            set((prevState) => ({
                connections: new Map(prevState.connections).set(peerID, {
                    peerID,
                    state
                })
            }))
        },

        getConnection: async ({ peerID, peerIP }: { peerID?: string, peerIP?: string }) => {
            const { manager } = get()
            return await manager.getConnection({ peerID, peerIP }) || null
        },

        sendDMs:(peerIPs: string[], message: string)=>{
            const { manager } = get()
            // 我们将批量发送的逻辑委托给manager
            // manager将负责遍历IP列表，找到对应的connection并发送消息
            // 注意：sendDirectMessageToPeers 是我们接下来需要在 rtcConnectionManager 中实现的方法
            manager.sendDirectMessageToPeers(peerIPs, message)
        },

        getAllConnections: () => {
            const { manager } = get()
            return manager.getAllConnections()
        },

        isConnected: (peerID: string) => {
            const { connections } = get()
            const connectionState = connections.get(peerID)
            return connectionState?.state === 'connected'
        },

        getConnectionState: (peerID: string) => {
            const { connections } = get()
            return connections.get(peerID)?.state || null
        }
    }
})

export { useRTCStore }

