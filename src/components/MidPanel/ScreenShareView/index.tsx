import SourceSelector from "./SourceSelector";
import StreamDisplay from "./StreamDisplay";
import { useScreenShare } from '@/stores'


const ScreenShareView = () => {
    const { stream } = useScreenShare((state) => state)

    return (
        <>
            {stream ?
                <StreamDisplay />
                :
                <div className="w-4/5 h-5/6 p-4 rounded-xl bg-[#121212] bg-opacity-50 backdrop-blur-sm">
                    <SourceSelector />
                </div>
            }
        </>

    )

}

export default ScreenShareView;