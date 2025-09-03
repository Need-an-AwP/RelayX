import { create } from 'zustand'
import type { ImperativePanelHandle } from 'react-resizable-panels'
import type { RefObject } from 'react'

interface PopoverState {
    isNetworkPopoverOpen: boolean
    isSettingPopoverOpen: boolean
    isAppSettingOpen: boolean
    isAudioCapturePopoverOpen: boolean
    isUserPopoverOpen: boolean

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



interface PanelState {
    sideBarRef: RefObject<ImperativePanelHandle | null> | null
    sideBarLastSize: number
    isSideBarCollapsed: boolean
    isWindowExtended: boolean

    setRef: (
        ref: RefObject<ImperativePanelHandle | null>,
        size: number
    ) => void
    setIsWindowExtended: (isWindowExtended: boolean) => void
    toggleSideBar: () => void
}

export const usePanelStore = create<PanelState>((set, get) => ({
    sideBarRef: null,
    isSideBarCollapsed: false,
    sideBarLastSize: 30,
    isWindowExtended: true,

    setRef: (ref: RefObject<ImperativePanelHandle | null>, size: number) => {
        set({ sideBarRef: ref, sideBarLastSize: size })
    },
    setIsWindowExtended: (isWindowExtended: boolean) => {
        set({ isWindowExtended })
        window.ipcBridge.extendWindow(isWindowExtended ? 'extend' : 'collapse')
    },
    toggleSideBar: () => {
        const { sideBarRef } = get()
        if (!sideBarRef || !sideBarRef.current) return

        // set({ isSideBarCollapsed: !get().isSideBarCollapsed })
        const panel = sideBarRef.current
        const currentSize = panel.getSize()
        const animate = (
            panel: ImperativePanelHandle,
            startSize: number,
            endSize: number,
            duration: number = 300
        ) => {
            const startTime = performance.now()

            const animation = (currentTime: number) => {
                const elapsed = currentTime - startTime
                const progress = Math.min(elapsed / duration, 1)

                const easeInOutCubic = (t: number): number => {
                    return t < 0.5
                        ? 4 * t * t * t
                        : 1 - Math.pow(-2 * t + 2, 3) / 2
                }

                const currentSize = startSize + (endSize - startSize) * easeInOutCubic(progress)
                panel.resize(currentSize)

                if (progress < 1) {
                    requestAnimationFrame(animation)
                } else {
                    // 动画结束后更新状态
                    set({
                        // 在动画前设定折叠状态
                        isSideBarCollapsed: endSize === 0,
                        // 如果是折叠操作，保存当前尺寸
                        sideBarLastSize: endSize === 0 ? startSize : get().sideBarLastSize
                    })

                }
            }

            requestAnimationFrame(animation)
        }

        if (get().isSideBarCollapsed) {
            // 展开到上次记录的尺寸
            const lastSize = get().sideBarLastSize
            animate(panel, currentSize, lastSize)
        } else {
            animate(panel, currentSize, 0)
        }
    }
}))