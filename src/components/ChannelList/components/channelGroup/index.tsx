import { useState } from 'react'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from 'lucide-react';
import CreateChannelDialog from './CreateChannelDialog';
import { DndContext } from '@dnd-kit/core'
import { useChannel } from '@/stores';
import TextChannel from '../textChannel';
import { useDnD } from '../../hooks/useDnD'
import VoiceChannel from '../voiceChannel';

const ChannelGroup = ({ type }: { type: 'text' | 'voice' }) => {
    const channels = useChannel((state) => state.channels);
    const [isOpen, setIsOpen] = useState(false);
    const {
        sensors,
        collisionDetectionStrategy,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        modifiers,
    } = useDnD({
        onUserMove: (fromChannelId, toChannelId, user) => {
            // TODO
            // there is no drag and drop action yet


            
        }
    });

    return (
        <Collapsible defaultOpen={true}>
            <div className="flex flex-row w-full">
                <CollapsibleTrigger asChild className="flex-1">
                    <div
                        className="flex items-center justify-between px-2 py-1 my-2 gap-2 hover:bg-secondary/60 rounded-md"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <div className="flex justify-start text-xs text-muted-foreground whitespace-nowrap">
                            {type === 'text' ? 'Text Channels' : 'Voice Channels'}
                        </div>
                        <div className="bg-neutral-800 h-[1px] w-full"></div>
                        <div>
                            {isOpen ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronUp className="w-4 h-4" />
                            )}
                        </div>
                    </div>
                </CollapsibleTrigger>
                <CreateChannelDialog type={type} />
            </div>
            <CollapsibleContent className="space-y-2 mb-2">
                {/* all text channels is disabled */}
                {type === 'text' ? (
                    <>
                        {channels
                            .filter(channel => channel.type === 'text')
                            .map((channel) => (
                                <TextChannel
                                    key={channel.id}
                                    channel={channel}
                                />
                            ))}
                    </>
                ) : (
                    <>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={collisionDetectionStrategy}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                            modifiers={modifiers}
                        >
                            {channels
                                .filter(channel => channel.type === 'voice')
                                .map((channel) => (
                                    <VoiceChannel
                                        key={channel.id}
                                        channel={channel}
                                    />
                                ))}
                        </DndContext>
                    </>
                )}
            </CollapsibleContent>
        </Collapsible>
    )
}

export default ChannelGroup