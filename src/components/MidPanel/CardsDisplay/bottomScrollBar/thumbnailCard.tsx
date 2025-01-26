import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User } from "@/types"
import { Video, AudioLines } from 'lucide-react';

interface ThumbnailCardProps {
    member: User;
    type: 'video' | 'audio';
    onClick?: () => void;
}

const ThumbnailCard = ({ member, type, onClick }: ThumbnailCardProps) => {

    const iconClass = `aspect-square h-full w-full mr-1 scale-[0.6]`

    return (
        <Card
            key={member.id}
            className="flex flex-col gap-2 items-center justify-center bg-[#242526] h-full aspect-video
            hover:bg-zinc-600 transition-all duration-300 ease-in-out cursor-pointer"
            onClick={onClick}
        >
            <div className="rounded-full flex flex-row bg-[#181818]">
                <Avatar className="m-1.5">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name?.slice(0, 2)}</AvatarFallback>
                </Avatar>
                {type === 'video' && <Video className={iconClass} />}
                {type === 'audio' && <AudioLines className={iconClass} />}
            </div>
            <div>
                <span className="text-sm text-muted-foreground">{member.name}</span>
            </div>
        </Card>
    )
}

export default ThumbnailCard;
