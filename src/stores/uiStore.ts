import { create } from 'zustand'
import type { ImperativePanelHandle } from 'react-resizable-panels'
import type { RefObject } from 'react'

type PopoverId =
    | 'network'
    | 'setting'
    | 'appSetting'
    | 'audioCapture'
    | 'user'
    | 'tsLoading'
    | null;

interface PopoverState {
    activePopover: PopoverId;

    closeAll: () => void
    togglePopover: (popoverId: NonNullable<PopoverId>) => void;
    setActivatePopover: (popoverId: PopoverId) => void;
}

export const usePopover = create<PopoverState>((set, get) => ({
    activePopover: null,

    closeAll: () => set({ activePopover: null }),
    togglePopover: (popoverId) => set((state) =>
        state.activePopover === popoverId
            ? { activePopover: null }
            : { activePopover: popoverId }
    ),
    setActivatePopover: (popoverId) => set({ activePopover: popoverId }),
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