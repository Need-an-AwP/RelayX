import type { User, Channel } from '@/types'

export interface CurrentChannelStore {
    currentChannel: Channel | null
    allUsers: User[]
    remoteUsers: User[]
    localUser: User | null

    isUserInChannel: (userId: number) => boolean
    getRemoteUserByIP: (ipv4: string) => User | undefined
}