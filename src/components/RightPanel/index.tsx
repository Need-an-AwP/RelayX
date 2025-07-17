import { usePeerStateStore, useDesktopCapture } from '@/stores'
import StreamDisplay from './StreamDisplay'
import MessageInput from './MessageInput'
import CardDisplay from './CardDisplay'


export default function RightPanel() {
    const { selfState } = usePeerStateStore((state) => state)
    const { isSelectingSource } = useDesktopCapture((state) => state)


    return (
        <div id="right-panel" className="h-full">
            {selfState.isInChat && <div className="h-full w-full flex flex-col">

                <div className='flex-1 min-h-0'>
                    <CardDisplay />
                </div>

                <MessageInput />
            </div>}
        </div>
    )
}

{/* <div className="h-full">
            {isSelectingSource || selfState.isSharingScreen ?
                <StreamDisplay />
                :
                
            }
        </div> */}