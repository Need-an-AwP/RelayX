import User from "./User";
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { LucideAudioLines, LucideSettings, ClockAlert } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { Button } from "@/components/ui/button"
import { useChannel, useTailscale, useCurrentUser } from "@/stores";
import type { VoiceChannel } from "@/types";


const VoiceChannel = ({ channel, disabled = false }: { channel: VoiceChannel, disabled?: boolean }) => {
    const selfIPs = useTailscale((state) => state.selfIPs);
    const users = useChannel((state) => state.users[channel.id]);
    const addUser = useChannel((state) => state.addUser);
    const isPresetChannels = useChannel((state) => state.isPresetChannels);
    const setInVoiceChannel = useCurrentUser((state) => state.setInVoiceChannel);
    const inVoiceChannel = useCurrentUser((state) => state.inVoiceChannel);
    const user = useCurrentUser((state) => state.user);

    const { setNodeRef, isOver: dropIsOver } = useDroppable({
        id: channel.id
    });

    const joinVoiceChannel = (channel: VoiceChannel) => {
        if (!user) return;
        setInVoiceChannel(channel); // current user state
        addUser(channel.id, user);  // channel state
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
                console.log('double click');
                if (disabled || inVoiceChannel) return;
                joinVoiceChannel(channel)
            }}
        >
            <div className="flex items-center justify-between p-2 px-4 w-full">
                <div className="flex items-center gap-4 w-full">
                    <LucideAudioLines className="w-4 h-4" />
                    <p className="truncate max-w-[150px] text-sm">{channel.name}</p>
                </div>
                <div className="flex flex-row gap-2">
                    {channel.temporary && <ClockAlert className="w-4 h-4 opacity-50" />}
                    <Popover>
                        <PopoverTrigger asChild>
                            <div className="cursor-pointer">
                                <LucideSettings className="w-4 h-4" />
                            </div>
                        </PopoverTrigger>
                        <PopoverContent side="right" className="w-80 m-8 ml-0 z-50 overflow-hidden" >
                            <div className="space-y-2">
                                <p>Channel Settings</p>
                                {isPresetChannels ?
                                    <div>
                                        <p className="text-sm">
                                            This is a preset channel
                                            <br />
                                            cannot be modified
                                        </p>
                                    </div>
                                    :
                                    <div>
                                        <Button variant="destructive" onClick={() => deleteThisChannel()}>
                                            delete this channel
                                        </Button>
                                    </div>
                                }
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