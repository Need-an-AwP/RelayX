import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocalUserStateStore } from '@/stores'
import MessageInput from './MessageInput'
import CardDisplay from './CardDisplay'


export default function RightPanel() {
    const { userState: selfState } = useLocalUserStateStore()
    const [isHovering, setIsHovering] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [hasFocus, setHasFocus] = useState(false)
    const rightPanelRef = useRef<HTMLDivElement>(null)
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)


    // 监听全屏状态变化
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange)
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current)
            }
        }
    }, [])


    // 重置悬浮超时
    const resetHoverTimeout = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
        }

        if (isFullscreen) {
            setIsHovering(true)
            hoverTimeoutRef.current = setTimeout(() => {
                setIsHovering(false)
            }, 1000)
        }
    }

    const switchFullScreen = (type: 'expand' | 'shrink') => {
        if (rightPanelRef.current) {
            if (type === 'shrink') {
                document.exitFullscreen()
            } else if (type === 'expand') {
                rightPanelRef.current.requestFullscreen()
            }
        }
    }

    return (
        <div
            ref={rightPanelRef}
            id="right-panel"
            className="h-full"
            onMouseEnter={() => {
                if (!isFullscreen) {
                    setIsHovering(true)
                }
            }}
            onMouseLeave={() => {
                if (!isFullscreen && !hasFocus) {
                    setIsHovering(false)
                }
            }}
            onMouseMove={() => {
                if (isFullscreen) {
                    resetHoverTimeout()
                }
            }}
        >
            {selfState.isInChat &&
                <div className="relative h-full w-full flex flex-col">

                    <div className='flex-1 min-h-0'>
                        <CardDisplay isHovering={isHovering} switchFullScreen={switchFullScreen} />
                    </div>

                    <div className={`absolute bottom-0 left-0 w-full z-50
                ${isHovering ? 'opacity-100' : 'opacity-0 translate-y-full'}
                transition-all duration-300 ease-in-out`}>
                        <MessageInput onFocusChange={setHasFocus} />
                    </div>

                </div>
            }
        </div>
    )
}
