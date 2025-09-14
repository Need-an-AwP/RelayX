import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { DirectMessage } from '@/types'

type peerIP = string

type MessageHistory = Record<string, DirectMessage>

type MessageTimeline = string[]

type MessagesByPeer = Record<peerIP, string[]>

interface MessageStore {
    inputMessage: string
    isTyping: boolean
    sentMessage: string
    
    messageHistory: MessageHistory        // messageId -> DirectMessage
    messageTimeline: MessageTimeline      // 按时间排序的 messageId 数组
    messagesByPeer: MessagesByPeer        // peerIP -> messageId 数组
    
    messageHistoryLength: number

    setInputMessage: (message: string) => void
    setIsTyping: (isTyping: boolean) => void
    handleSendMessage: (targetPeers: string[]) => void
    addMessage: (peerIP: peerIP, message: DirectMessage) => void
    
    getMessagesByPeer: (peerIP: peerIP) => DirectMessage[]
    getAllMessages: () => DirectMessage[]
    getLatestMessage: (peerIP: peerIP) => DirectMessage | undefined
}

const useMessageStore = create<MessageStore>()(
    immer((set, get) => ({
        inputMessage: '',
        isTyping: false,
        sentMessage: '',
        messageHistory: {},
        messageTimeline: [],
        messagesByPeer: {},
        messageHistoryLength: 0,

        setInputMessage: (message: string) => set((state) => {
            state.inputMessage = message
        }),
        
        setIsTyping: (isTyping: boolean) => set((state) => {
            state.isTyping = isTyping
        }),
        
        handleSendMessage: (targetPeers: string[]) => {
            const { inputMessage, addMessage } = get()
            const messageToSend = inputMessage.trim()
            if (!messageToSend) {
                console.warn('no message to send')
                return
            }

            console.log('send message to', targetPeers)
            // useRTCStore.getState().sendDMs(targetPeers, messageToSend);
            addMessage('self-message', {
                type: 'dm',
                messageId: Date.now().toString(),
                content: messageToSend,
                from: 'self',
                timestamp: Date.now()
            })
            
            set((state) => {
                state.inputMessage = ''
            });
        },
        
        addMessage: (peerIP: peerIP, message: DirectMessage) => {
            set((state) => {
                // 避免重复添加相同的消息
                if (state.messageHistory[message.messageId]) {
                    return;
                }

                state.messageHistory[message.messageId] = message;
                
                const insertIndex = state.messageTimeline.findIndex(id => {
                    const existingMessage = state.messageHistory[id];
                    return existingMessage.timestamp > message.timestamp;
                });
                
                if (insertIndex === -1) {
                    state.messageTimeline.push(message.messageId);
                } else {
                    state.messageTimeline.splice(insertIndex, 0, message.messageId);
                }
                
                if (!state.messagesByPeer[peerIP]) {
                    state.messagesByPeer[peerIP] = [];
                }
                state.messagesByPeer[peerIP].push(message.messageId);
                
                state.messageHistoryLength += 1;
            });
        },
        
        getMessagesByPeer: (peerIP: peerIP) => {
            const { messageHistory, messagesByPeer } = get();
            const messageIds = messagesByPeer[peerIP] || [];
            return messageIds.map(id => messageHistory[id]).filter(Boolean);
        },
        
        getAllMessages: () => {
            const { messageHistory, messageTimeline } = get();
            return messageTimeline.map(id => messageHistory[id]).filter(Boolean);
        },
        
        getLatestMessage: (peerIP: peerIP) => {
            const { messageHistory, messagesByPeer } = get();
            const messageIds = messagesByPeer[peerIP] || [];
            if (messageIds.length === 0) return undefined;
            
            const latestMessageId = messageIds[messageIds.length - 1];
            return messageHistory[latestMessageId];
        }
    }))
)

export { useMessageStore }