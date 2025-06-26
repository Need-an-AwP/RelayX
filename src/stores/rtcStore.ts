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
        const connection = await get().getConnection({ peerIP: message.From })
        console.log('transceivers:', message.transceivers)
        
        if (connection) {
            connection.handleOffer(message.Offer, message.Ice, message.transceivers)
        }
    })

    window.ipcBridge.receive('http/answer_ice', async (message: RTCAnswerMessage) => {
        console.log("Received http/answer_ice message:", message);
        const connection = await get().getConnection({ peerIP: message.From })

        if (connection) {
            connection.handleAnswer(message.Answer, message.Ice)
        }
    })

    return {
        connections: new Map(),
        manager,

        createConnection: (peerID: string, peerIP: string, isOffer: boolean) => {
            const { manager } = get()

            // 检查是否已存在连接
            if (manager.RTCconnections.has(peerID)) {
                console.log(`Connection for peer ${peerID} already exists`)
                return
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

