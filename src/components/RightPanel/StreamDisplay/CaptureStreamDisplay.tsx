import { useEffect, useRef, useState } from 'react';
import { SquareX, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import VideoWindow from './VideoWindow';
import { useDesktopCapture, useLocalUserStateStore } from "@/stores"
// import {
//     DndContext, useDraggable, useDroppable, type DragEndEvent,
//     DragOverlay, type DragStartEvent
// } from '@dnd-kit/core';

/** 
function Droppable(props: { id: string, isDropped: boolean, children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({
        id: props.id,
    });

    return (
        <div
            ref={setNodeRef}
            className={`w-28 h-24 border-2 border-dashed flex items-center justify-center 
            ${props.isDropped ? 'bg-green-500' : ''} 
            ${isOver ? 'bg-green-300' : ''}`}
        >
            {props.children}
        </div>
    );
}

function Draggable() {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: 'draggable',
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className='h-10 w-10 bg-blue-500 z-999 cursor-grab'>
        </div>
    );
}
*/


export default function CaptureStreamDisplay() {
    const { stream, setStream } = useDesktopCapture()
    const { updateSelfState } = useLocalUserStateStore()
    const containerRef = useRef<HTMLDivElement>(null);
    const [isControlVisible, setIsControlVisible] = useState(false);
    const [droppedZone, setDroppedZone] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false);

    // const handleDragStart = (event: DragStartEvent) => {
    //     setIsDragging(true);
    // }

    // const handleDragEnd = (event: DragEndEvent) => {
    //     setIsDragging(false);
    //     if (event.over) {
    //         setDroppedZone(event.over.id as string)
    //     }
    // }


    const stopCapture = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        setStream(null);
        updateSelfState({
            isSharingScreen: false,
        });
    };

    const replaceVideoTracks = () => {

    }


    return (
        <div
            className="relative flex flex-col w-full h-full min-h-0 items-center justify-center p-8"
            onMouseEnter={() => setIsControlVisible(true)}
            onMouseLeave={() => setIsControlVisible(false)}
            ref={containerRef}
        >
            {/* <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className='p-4 w-auto bg-red-500 z-990 flex flex-col items-center gap-y-4'>
                    <Droppable id="top" isDropped={droppedZone === 'top'}>
                        {droppedZone === 'top' ? <Draggable /> : 'Drop here'}
                    </Droppable>

                    {droppedZone === null ? <Draggable /> : null}

                    <div className='flex gap-x-4'>
                        <Droppable id="bottom-1" isDropped={droppedZone === 'bottom-1'}>
                            {droppedZone === 'bottom-1' ? <Draggable /> : 'Drop here'}
                        </Droppable>
                        <Droppable id="bottom-2" isDropped={droppedZone === 'bottom-2'}>
                            {droppedZone === 'bottom-2' ? <Draggable /> : 'Drop here'}
                        </Droppable>
                        <Droppable id="bottom-3" isDropped={droppedZone === 'bottom-3'}>
                            {droppedZone === 'bottom-3' ? <Draggable /> : 'Drop here'}
                        </Droppable>
                    </div>
                </div>
                <DragOverlay>
                    {isDragging ? <Draggable /> : null}
                </DragOverlay>
            </DndContext> */}


            <VideoWindow stream={stream} containerRef={containerRef} />

            <div className={`absolute flex items-center justify-center gap-4
                bottom-0 w-full h-[90px] bg-[#121212] bg-opacity-30 backdrop-blur-sm
                transition-transform duration-300 ease-in-out
                ${isControlVisible ? 'translate-y-0' : 'translate-y-full'}`}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => stopCapture()}>
                                <SquareX className="w-6 h-6" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Close Screen Share</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="destructive">
                                <Power className="w-6 h-6" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Close Voice Chat</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

            </div>
        </div>
    );
};
