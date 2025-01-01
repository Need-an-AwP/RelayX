import type { Channel } from "@/types";
import User from "./User";
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { LucideAudioLines, LucideSettings } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { Button } from "@/components/ui/button"
import { useChannel, useTailscale, useCurrentUser } from "@/stores";


const VoiceChannel = ({ channel, disabled = false }: { channel: Channel, disabled?: boolean }) => {
    const selfIPs = useTailscale((state) => state.selfIPs);
    const users = useChannel((state) => state.users[channel.id]);
    const addUser = useChannel((state) => state.addUser);
    const setInVoiceChannel = useCurrentUser((state) => state.setInVoiceChannel);
    const inVoiceChannel = useCurrentUser((state) => state.inVoiceChannel);
    const user = useCurrentUser((state) => state.user);

    const { setNodeRef, isOver: dropIsOver } = useDroppable({
        id: channel.id
    });

    const joinVoiceChannel = (channel: Channel) => {
        if (!user) return;
        setInVoiceChannel(channel);
        addUser(channel.id, user);
    }

    const deleteThisChannel = () => {

    }

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "space-y-1 w-full rounded-md bg-secondary/30 cursor-pointer hover:bg-secondary/10",
                dropIsOver && "bg-secondary/80",
                disabled && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
            onDoubleClick={() => {
                if (disabled) return;
                if (inVoiceChannel?.id === channel.id) return;
                joinVoiceChannel(channel)
            }}
        >
            <div className="flex items-center justify-between p-2 px-4 w-full">
                <div className="flex items-center gap-4 w-full">
                    <LucideAudioLines className="w-4 h-4" />
                    <p className="truncate max-w-[150px] text-sm">{channel.name}</p>
                </div>
                <div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <div className="cursor-pointer">
                                <LucideSettings className="w-4 h-4" />
                            </div>
                        </PopoverTrigger>
                        <PopoverContent side="right" className="w-80 m-8 ml-0 z-50 overflow-hidden" >
                            <div className="space-y-2">
                                <p>Channel Settings</p>
                                <Button variant="destructive" onClick={() => deleteThisChannel()}>
                                    delete this channel
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
            <div className="pl-4 rounded-md transition-colors duration-200">
                {Object.entries(users).map(([_, user]) => {
                    const isSelf = user.IPs.ipv4 === selfIPs.ipv4;
                    return (
                        <User
                            key={user.id}
                            user={user}
                            isSelf={isSelf}
                            channelId={channel.id}
                        />
                    )
                })}
            </div>
        </div>
    );
}

export default VoiceChannel