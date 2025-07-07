import { usePeerStateStore, useDesktopCapture } from '@/stores'
import StreamDisplay from './StreamDisplay'
import NyancatBackground from './NyancatBackground'
import MessageInput from './MessageInput'

export default function RightPanel() {
    const { selfState } = usePeerStateStore((state) => state)
    const { isSelectingSource } = useDesktopCapture((state) => state)


    return (
        <div className="h-full">
            {isSelectingSource || selfState.isSharingScreen ?
                <StreamDisplay />
                :
                <div className="relative h-full w-full flex justify-center items-center">
                    {selfState.isInChat && <MessageInput />}
                    {/* <NyancatBackground /> */}
                </div>
            }
        </div>
    )
}