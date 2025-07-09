import { useEffect, useRef } from "react";

const DISPLAY_BINS_PERCENTAGE = 0.5; // percentage of bins to display
const SMOOTHING_CONSTANT = 0.6; // Higher value = more smoothing (slower response). 0 means no smoothing.

interface UserAudioSpectrumProps {
    analyser: AnalyserNode;
    className?: string;
    displayStyle?: 'bar' | 'line';
}

export default function UserAudioSpectrum({ analyser, className, displayStyle = 'line' }: UserAudioSpectrumProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const smoothedDataRef = useRef<Float32Array | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) return;

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const binsToDisplay = Math.ceil(bufferLength * DISPLAY_BINS_PERCENTAGE);
        if (!smoothedDataRef.current || smoothedDataRef.current.length !== binsToDisplay) {
            smoothedDataRef.current = new Float32Array(binsToDisplay);
        }
        const smoothedDataArray = smoothedDataRef.current;

        let animationFrameId: number;

        const draw = () => {
            animationFrameId = requestAnimationFrame(draw);

            analyser.getByteFrequencyData(dataArray);

            if (displayStyle === 'line') {
                for (let i = 0; i < binsToDisplay; i++) {
                    smoothedDataArray[i] = (dataArray[i] * (1 - SMOOTHING_CONSTANT)) + (smoothedDataArray[i] * SMOOTHING_CONSTANT);
                }
            }

            const { width, height } = canvas;
            canvasCtx.clearRect(0, 0, width, height);

            const barWidth = (width / binsToDisplay);
            let barHeight;
            let x = 0;

            const gradient = canvasCtx.createLinearGradient(0, 0, width, 0);
            gradient.addColorStop(0, '#60a5fa'); // light blue
            gradient.addColorStop(1, '#a855f7'); // violet
            
            canvasCtx.fillStyle = gradient;

            if (displayStyle === 'line') {
                canvasCtx.beginPath();
                let x = 0;

                // Move to the first point on the top curve
                let barHeight = smoothedDataArray[0] / 255 * height;
                let y = (height - barHeight) / 2;
                canvasCtx.moveTo(x, y);

                // Draw the rest of the top curve
                for (let i = 1; i < binsToDisplay; i++) {
                    x += barWidth;
                    barHeight = smoothedDataArray[i] / 255 * height;
                    y = (height - barHeight) / 2;
                    canvasCtx.lineTo(x, y);
                }

                // Now draw the bottom curve, from right to left
                for (let i = binsToDisplay - 1; i >= 0; i--) {
                    barHeight = smoothedDataArray[i] / 255 * height;
                    y = (height + barHeight) / 2;
                    canvasCtx.lineTo(x, y);
                    x -= barWidth;
                }

                canvasCtx.closePath();
                canvasCtx.fill();
            } else { // 'bar' style
                let x = 0;
                for (let i = 0; i < binsToDisplay; i++) {
                    const barHeight = dataArray[i] / 255 * height;

                    canvasCtx.fillRect(x, (height - barHeight) / 2, barWidth, barHeight);

                    x += barWidth;
                }
            }
        };

        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [analyser, displayStyle]);

    return (
        <canvas ref={canvasRef} className={className} />
    )
}