import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"

import type { RTCStates } from '@/types'
import { useRTC } from "@/stores"

interface DetailsRefs {
    [key: string]: HTMLDivElement | null;
}

export default function OnlineUsers(): JSX.Element {
    const rtcStates = useRTC.getState().states;
    const detailsRefs = useRef<DetailsRefs>({});

    useEffect(() => {
        Object.entries(rtcStates).forEach(([address, _]) => {
            if (!detailsRefs.current[address]) return;

            const resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    // const height = Math.max(220, entry.contentRect.height + 60);
                    const height = entry.contentRect.height + 70;
                    const element = detailsRefs.current[address]?.parentElement?.parentElement;
                    if (element) {
                        element.style.setProperty('--expanded-height', `${height}px`);
                    }
                }
            });

            if (detailsRefs.current[address]) {
                resizeObserver.observe(detailsRefs.current[address]!);
            }
            return () => resizeObserver.disconnect();
        });
    }, [rtcStates]);

    const cardClassName = "flex flex-col bg-white bg-opacity-5 gap-2 @container/online-users"

    return (
        <>
            {Object.keys(rtcStates).length > 0 ?
                (
                    <Card className={cardClassName}>
                        <div className="grid grid-cols-1 @[400px]:grid-cols-2 gap-2 p-2">
                            {Object.entries(rtcStates).map(([address, state]) => (
                                <div key={address} className={`
                                    group
                                    flex flex-row gap-2 justify-start items-center rounded-md p-2 m-2 bg-neutral-600 
                                    h-[52px] duration-300 transition-all hover:bg-neutral-500
                                    hover:h-[var(--expanded-height,220px)]
                                    delay-150
                                    `}>
                                    <div className="flex mb-1 h-full">
                                        <Avatar className="flex-shrink-0">
                                            <AvatarImage src={state.userConfig?.user_avatar} />
                                            <AvatarFallback>{state.userConfig?.user_name}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className={`
                                    relative flex flex-col justify-start items-start w-full h-full overflow-hidden
                                    group-hover:h-full
                                    delay-150
                                    `}>
                                        <span className="text-sm text-left w-full truncate">{state.userConfig?.user_name}</span>
                                        <div className="flex flex-row gap-2">
                                            <span className={`text-xs ${state.state === 'connected' ? 'text-green-500' : 'text-red-500'}`}>
                                                {state.state}
                                            </span>
                                            <span className="text-xs">{state.latency}ms</span>
                                        </div>
                                        <div
                                            ref={el => detailsRefs.current[address] = el}
                                            className={`
                                        absolute left-0 top-[40px] w-full my-2 opacity-0 overflow-y-hidden text-xs text-left 
                                        group-hover:opacity-100 transition-all duration-300
                                        delay-150
                                        `}>
                                            <p className="line-clamp-3"><strong>HostName: </strong>{state.peer?.HostName}</p>
                                            <p><strong>OS: </strong>{state.peer?.OS}</p>
                                            <p><strong>UserID: </strong>{state.peer?.UserID}</p>
                                            <p className="line-clamp-3"><strong>tailscaleIPs: </strong>{state.peer?.TailscaleIPs.join(', ')}</p>
                                            <p><strong>Relay: </strong>{state.peer?.Relay}</p>
                                            <p><strong>RxBytes: </strong>{state.peer?.RxBytes}</p>
                                            <p><strong>TxBytes: </strong>{state.peer?.TxBytes}</p>
                                        </div>
                                    </div>
                                </div>

                            ))}
                        </div>
                    </Card>
                ) : (
                    <Card className={cardClassName}>
                        <div className='my-4 text-muted-foreground'>
                            no webRTC connection exist
                        </div>
                    </Card>
                )
            }
        </>
    )
}