import { create } from 'zustand'

interface MessageStore {
    inputMessage: string
    isTyping: boolean
    sentMessage: string
    messageTimeoutId: number | null

    setInputMessage: (message: string) => void
    setIsTyping: (isTyping: boolean) => void
    handleSendMessage: () => void
}

const useMessageStore = create<MessageStore>((set, get) => ({
    inputMessage: '',
    isTyping: false,
    sentMessage: '',
    messageTimeoutId: null,

    setInputMessage: (message: string) => set({ inputMessage: message }),
    setIsTyping: (isTyping: boolean) => set({ isTyping }),
    handleSendMessage: () => {
        const { inputMessage, messageTimeoutId } = get()
        const messageToSend = inputMessage.trim()
        if (!messageToSend) return

        if (messageTimeoutId) {
            clearTimeout(messageTimeoutId)
        }
        console.log('send message', messageToSend)
        set({ inputMessage: '', sentMessage: messageToSend })

        const newTimeoutId = setTimeout(() => {
            set({ sentMessage: '', messageTimeoutId: null })
        }, 5000)
        set({ messageTimeoutId: newTimeoutId as unknown as number })
    }
}))

export { useMessageStore }