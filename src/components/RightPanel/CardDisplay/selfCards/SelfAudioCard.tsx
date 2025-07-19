import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { LoaderCircle } from "lucide-react";
import { useAudioProcessing, useMessageStore, usePeerStateStore } from "@/stores"
import UserAudioSpectrum from "@/components/UserAudioSpectrum";
import MessageBubble from "@/components/RightPanel/MessageBubble";
import { FloatingPortal, autoUpdate, flip, offset, shift, useFloating, useTransitionStatus } from "@floating-ui/react";


export default function SelfAudioCard({ className, onClick }: { className?: string, onClick?: () => void }) {
    const { selfState } = usePeerStateStore()
    const { mergerAnalyser } = useAudioProcessing()
    const { sentMessage } = useMessageStore()

    const { refs, floatingStyles, context } = useFloating({
        open: !!sentMessage.trim(),
        whileElementsMounted: autoUpdate,
        placement: 'top',
        middleware: [offset({
            mainAxis: -15,
            crossAxis: 60,
            // alignmentAxis: 0,
        }), flip(), shift()],
    });

    const { isMounted, status } = useTransitionStatus(context, {
        duration: 200,
    });


    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <Card
                    className={`group relative p-4 aspect-video select-none
                    transition-all duration-300 flex justify-center items-center overflow-hidden
                    hover:border-primary hover:ring-2 hover:bg-muted
                    ${className}`}
                    onClick={onClick}
                >
                    <div ref={refs.setReference} className="flex h-full justify-center items-center gap-4 aspect-square p-5 z-10">
                        <Avatar className="flex-shrink-0 h-full w-full">
                            <AvatarImage src={selfState.userAvatar} />
                            <AvatarFallback>
                                <LoaderCircle className="w-4 h-4 animate-spin" />
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    {isMounted && (
                        <FloatingPortal>
                            <MessageBubble
                                ref={refs.setFloating}
                                style={floatingStyles}
                                status={status}
                            />
                        </FloatingPortal>
                    )}

                    {mergerAnalyser &&
                        <UserAudioSpectrum
                            analyser={mergerAnalyser}
                            className="absolute w-full h-full top-0 left-0 opacity-60
                            group-hover:opacity-100 transition-opacity duration-300"
                            verticalAlignment='center'
                            displayStyle='line'
                        />}
                </Card>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem>Check message history</ContextMenuItem>
                
            </ContextMenuContent>
        </ContextMenu>

    )
}