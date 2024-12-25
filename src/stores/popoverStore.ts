import { create } from 'zustand'


interface PopoverState {
    isNetworkPopoverOpen: boolean
    isSettingPopoverOpen: boolean
    isChannelPopoverOpen: boolean
    isAudioCapturePopoverOpen: boolean
    isUserPopoverOpen: boolean

    closeAll: () => void
    toggle: (popover: keyof Omit<PopoverState, 'closeAll' | 'toggle'>) => void
    // onClick={() => toggle('isNetworkPopoverOpen')}
}

export const usePopover = create<PopoverState>((set) => ({
    isNetworkPopoverOpen: false,
    isSettingPopoverOpen: false,
    isChannelPopoverOpen: false,
    isAudioCapturePopoverOpen: false,
    isUserPopoverOpen: false,

    closeAll: () => set({
        isNetworkPopoverOpen: false,
        isSettingPopoverOpen: false,
        isChannelPopoverOpen: false,
        isAudioCapturePopoverOpen: false,
        isUserPopoverOpen: false,
    }),
    toggle: (popover) => set((state) => ({
        [popover]: !state[popover]
    }))
}))