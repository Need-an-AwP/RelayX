import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
    ContextMenu,
    ContextMenuCheckboxItem,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuLabel,
    ContextMenuRadioGroup,
    ContextMenuRadioItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Slider } from "@/components/ui/slider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import AudioStreamController from '@/services/AudioStreamController'
import { Mic, MicOff } from "lucide-react"
import { useDB } from '@/stores'
import type { User } from '@/types'

const User = ({ user, isSelf, channelId }: { user: User, isSelf: boolean, channelId: number }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: user.id,
        data: {
            user,
            fromChannelId: channelId
        }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    const userVolume = AudioStreamController.getInstance().getUserVolume(user.IPs.ipv4!);
    const onUserVolumeChange = (volume: number) => {
        AudioStreamController.getInstance().setUserVolume(user.IPs.ipv4!, volume);
    }
    const audioActive = false;


    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <div
                    ref={setNodeRef}
                    {...listeners}
                    {...attributes}
                    style={style}
                    className={`
                        flex items-center px-2 py-2 rounded-md cursor-grab active:cursor-grabbing
                        ${isSelf ? 'hover:bg-blue-300/60' : 'hover:bg-secondary/60'}
                        `}
                >
                    <div className="flex items-center gap-2">
                        <Avatar
                            className={`
                                flex-shrink-0 h-8 w-8
                                ${audioActive ? 'border-2 border-green-500' : null}
                            `}
                        >
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>

                        <span className="text-sm line-clamp-1 break-all">{user.name}</span>
                    </div>

                </div>
            </ContextMenuTrigger>
            {isSelf ? (
                <ContextMenuContent className="w-64">
                    <ContextMenuItem>
                        this is you
                    </ContextMenuItem>
                </ContextMenuContent>
            ) : (
                <ContextMenuContent className="w-64">
                    <ContextMenuCheckboxItem disabled>
                        <span>mute <strong> INPUT </strong> for this user</span>
                    </ContextMenuCheckboxItem>
                    <ContextMenuSeparator />

                    <ContextMenuItem>
                        {userVolume === 0 ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        <Slider
                            className='w-full mx-3'
                            min={0}
                            max={100}
                            value={[userVolume * 100]}
                            onValueChange={(value) => onUserVolumeChange(value[0] / 100)}
                        />
                    </ContextMenuItem>

                    <ContextMenuSeparator />
                    <ContextMenuCheckboxItem disabled>
                        <span>send message to this user</span>
                    </ContextMenuCheckboxItem>
                </ContextMenuContent>
            )}
        </ContextMenu>
    );
}

export default User