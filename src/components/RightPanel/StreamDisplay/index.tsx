import CaptureStreamDisplay from "./CaptureStreamDisplay"
import { useDesktopCapture } from "@/stores"


export default function StreamDisplay() {
    // const { isSelectingSource, stream } = useDesktopCapture(state => state)

    return (
        <div className="h-full">
            <CaptureStreamDisplay />

        </div>
    )
}