import { useEffect, useRef, CSSProperties } from 'react'
import AudioVisualizer from '@/utils/AudioLevelVisualizer'
import { cn } from '@/lib/utils'


interface AudioSpectrumProps {
    stream: MediaStream | null;
    isEnabled: boolean;
    className?: string;
    style?: CSSProperties;
}

const AudioSpectrum = ({ 
    stream, 
    isEnabled, 
    className,
    style 
}: AudioSpectrumProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const visualizerRef = useRef<AudioVisualizer | null>(null);

    useEffect(() => {
        const cleanup = () => {
            if (visualizerRef.current) {
                visualizerRef.current.cleanup();
                visualizerRef.current = null;
            }
        };

        // 如果有流且组件启用，则初始化可视化器
        if (stream && isEnabled && canvasRef.current && !visualizerRef.current) {
            visualizerRef.current = new AudioVisualizer(stream, canvasRef.current, 128);
            visualizerRef.current.start();
        }

        // 组件卸载或依赖变化时清理
        return cleanup;
    }, [stream, isEnabled]);

    return (
        <canvas
            ref={canvasRef}
            className={cn('w-full bg-neutral-900 rounded-md', className)}
            style={{ ...style }}
        />
    );
};

export default AudioSpectrum;