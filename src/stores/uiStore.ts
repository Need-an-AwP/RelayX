import { create } from 'zustand'


interface PopoverState {
    isNetworkPopoverOpen: boolean
    isSettingPopoverOpen: boolean
    isAppSettingOpen: boolean
    isAudioCapturePopoverOpen: boolean
    isUserPopoverOpen: boolean
    isExtended: boolean

    setIsExtended: (isExtended: boolean) => void
    closeAll: () => void
    toggle: (popover: keyof Omit<PopoverState, 'closeAll' | 'toggle'>) => void
    // onClick={() => toggle('isNetworkPopoverOpen')}
}

export const usePopover = create<PopoverState>((set) => ({
    isNetworkPopoverOpen: false,
    isSettingPopoverOpen: false,
    isAppSettingOpen: false,
    isAudioCapturePopoverOpen: false,
    isUserPopoverOpen: false,
    isExtended: false,

    setIsExtended: (isExtended: boolean) => {
        set({ isExtended })
        window.ipcBridge.extendWindow(isExtended ? 'extend' : 'collapse')
    },
    closeAll: () => set({
        isNetworkPopoverOpen: false,
        isSettingPopoverOpen: false,
        isAppSettingOpen: false,
        isAudioCapturePopoverOpen: false,
        isUserPopoverOpen: false,
    }),
    toggle: (popover) => set((state) => ({
        [popover]: !state[popover]
    }))
}))

