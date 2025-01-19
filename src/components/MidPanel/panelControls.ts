import { create } from 'zustand'
import { ImperativePanelHandle } from 'react-resizable-panels'
import { type RefObject } from 'react'

interface PanelState {
    leftPanelRef: RefObject<ImperativePanelHandle> | null
    rightPanelRef: RefObject<ImperativePanelHandle> | null
    isLeftCollapsed: boolean
    isRightCollapsed: boolean
    leftPanelLastSize: number
    rightPanelLastSize: number
    noAnimation: boolean
    setRefs: (
        left: RefObject<ImperativePanelHandle>,
        right: RefObject<ImperativePanelHandle>,
        LSize: number,
        RSize: number
    ) => void
    isLeftPanelCollapsed: () => boolean
    isRightPanelCollapsed: () => boolean
    togglePanel: (location: 'left' | 'right') => void
}

export const usePanelStore = create<PanelState>((set, get) => ({
    leftPanelRef: null,
    rightPanelRef: null,
    isLeftCollapsed: false,
    isRightCollapsed: false,
    leftPanelLastSize: 20,
    rightPanelLastSize: 25,
    noAnimation: false,

    setRefs: (left, right, LSize, RSize, noAnimation = false) => set({ leftPanelRef: left, rightPanelRef: right, leftPanelLastSize: LSize, rightPanelLastSize: RSize, noAnimation }),

    isLeftPanelCollapsed: () => get().isLeftCollapsed,

    isRightPanelCollapsed: () => get().isRightCollapsed,

    togglePanel: (location) => {
        const panel = location === 'left' ? get().leftPanelRef : get().rightPanelRef
        if (!panel?.current) return

        const isCollapsed = location === 'left' ? get().isLeftCollapsed : get().isRightCollapsed
        const currentSize = panel.current.getSize()

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
                    if (location === 'left') {
                        set({
                            isLeftCollapsed: endSize === 0,
                            // 如果是折叠操作，保存当前尺寸
                            leftPanelLastSize: endSize === 0 ? startSize : get().leftPanelLastSize
                        })
                    } else {
                        set({
                            isRightCollapsed: endSize === 0,
                            // 如果是折叠操作，保存当前尺寸
                            rightPanelLastSize: endSize === 0 ? startSize : get().rightPanelLastSize
                        })
                    }
                }
            }

            requestAnimationFrame(animation)
        }

        if (get().noAnimation) {
            if (isCollapsed) {
                panel.current.expand()
            } else {
                panel.current.collapse()
            }
        } else {
            if (isCollapsed) {
                // 展开到上次记录的尺寸
                const lastSize = location === 'left' ? get().leftPanelLastSize : get().rightPanelLastSize
                animate(panel.current, currentSize, lastSize)
            } else {
                animate(panel.current, currentSize, 0)
            }
        }
    }
}))