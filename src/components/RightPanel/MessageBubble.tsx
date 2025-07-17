import { useMessageStore } from '@/stores'
import { useTransitionStatus } from '@floating-ui/react';
import React, { useEffect, useState } from 'react'

type TransitionStatus = ReturnType<typeof useTransitionStatus>['status'];

const MessageBubble = React.forwardRef<
    HTMLDivElement,
    React.HTMLProps<HTMLDivElement> & { status: TransitionStatus }
>(({ className, status, ...props }, ref) => {
    const { sentMessage } = useMessageStore()
    const [displayText, setDisplayText] = useState(sentMessage)

    useEffect(() => {
        if (sentMessage) {
            setDisplayText(sentMessage)
        }
    }, [sentMessage])

    const animationClass = status === 'open'
        ? 'animate-in fade-in-0 zoom-in-95'
        : 'animate-out fade-out-0 zoom-out-95'

    return (
        <div
            ref={ref}
            {...props}
            className={className}
        >
            <div className={`bg-blue-400/80 text-primary-foreground px-3 py-2 rounded-full
             max-w-2xs break-words duration-200 ${animationClass}`}>
                {displayText}
            </div>
        </div>
    )
})

MessageBubble.displayName = "MessageBubble"

export default MessageBubble