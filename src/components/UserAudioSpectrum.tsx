// this component need to be used with animationLoopManager


import { useId, useEffect, useRef } from "react";
import { animationLoopManager } from "@/utils/animationLoopManager";
import { spectrumWorkerManager } from "@/utils/spectrumWorkerManager";

interface UserAudioSpectrumProps {
    analyser: AnalyserNode;
    renderId: string;
    className?: string;
    displayStyle?: 'bar' | 'line';
    verticalAlignment?: 'center' | 'bottom';
}

export default function UserAudioSpectrum({ 
    analyser, 
    renderId,
    className, 
    displayStyle = 'line', 
    verticalAlignment = 'bottom' 
}: UserAudioSpectrumProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const id = renderId;
    // const id = useId();
    const isTransferred = useRef(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) { return; }

        if (!isTransferred.current) {
            spectrumWorkerManager.initialize();
            // @ts-ignore
            const offscreen = canvas.transferControlToOffscreen();
            isTransferred.current = true;
            spectrumWorkerManager.addCanvas(id, offscreen, { displayStyle, verticalAlignment });
        } else {
            // updateconfig method still not working yet
            // spectrumWorkerManager.updateConfig(id, { displayStyle, verticalAlignment });
        }

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;

        const draw = () => {
            const dataArray = new Uint8Array(bufferLength);
            analyser.getByteFrequencyData(dataArray);
            spectrumWorkerManager.render(id, dataArray);
        };
        animationLoopManager.add(id, draw);

        return () => {
            animationLoopManager.remove(id);
        };
    }, [analyser, id, displayStyle, verticalAlignment]);

    // no clean up method
    // useEffect(() => {
    //     return () => {
    //         if (isTransferred.current) {
    //             spectrumWorkerManager.removeCanvas(id);
    //             isTransferred.current = false;
    //         }
    //     }
    // }, [id]);

    return (
        <canvas ref={canvasRef} className={className} />
    )
}