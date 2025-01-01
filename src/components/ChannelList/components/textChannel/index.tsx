import { LucideMessageCircle, LucideSettings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Channel } from '@/types'

const TextChannel = ({ channel }: { channel: Channel }) => {
    const inTextChannel = -1;

    return (
        <Button
            variant="ghost"
            className={`
            flex items-center justify-between bg-secondary/20 w-full
            ${inTextChannel === channel.id ? 'bg-accent text-accent-foreground' : ''}
            `}
            // onClick={() => setInTextChannel(channel.id)}
            disabled={true}
        >

            <div className='flex items-center gap-4'>
                <LucideMessageCircle className="w-4 h-4" />
                {channel.name}
            </div>
            <div>
                <Popover>
                    <PopoverTrigger asChild>
                        <div className='cursor-pointer hover:'>
                            <LucideSettings className="w-4 h-4" />
                        </div>
                    </PopoverTrigger>
                    <PopoverContent side="right" className="w-80 m-8 ml-0 z-50 overflow-hidden" >
                        <div className="space-y-2">
                            <p>Channel Settings</p>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

        </Button>
    )
}

export default TextChannel