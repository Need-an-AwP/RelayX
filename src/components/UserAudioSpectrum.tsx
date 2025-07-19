// this component need to be used with animationLoopManager


import { useId, useEffect, useRef } from "react";
import { animationLoopManager } from "@/utils/animationLoopManager";

const DISPLAY_BINS_PERCENTAGE = 0.8; // percentage of bins to display
const SMOOTHING_CONSTANT = 0.6; // Higher value = more smoothing (slower response). 0 means no smoothing.

interface UserAudioSpectrumProps {
    analyser: AnalyserNode;
    className?: string;
    displayStyle?: 'bar' | 'line';
    verticalAlignment?: 'center' | 'bottom';
}

export default function UserAudioSpectrum({ 
    analyser, 
    className, 
    displayStyle = 'line', 
    verticalAlignment = 'bottom' 
}: UserAudioSpectrumProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const smoothedDataRef = useRef<Float32Array | null>(null);
    const id = useId();

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

        const draw = () => {
            analyser.getByteFrequencyData(dataArray);

            if (displayStyle === 'line') {
                for (let i = 0; i < binsToDisplay; i++) {
                    smoothedDataArray[i] = (dataArray[i] * (1 - SMOOTHING_CONSTANT)) + (smoothedDataArray[i] * SMOOTHING_CONSTANT);
                }
            }

            const { width, height } = canvas;
            canvasCtx.clearRect(0, 0, width, height);

            const barWidth = displayStyle === 'line' && binsToDisplay > 1 
                ? width / (binsToDisplay - 1)  // line 模式：确保从 0 到 width
                : width / binsToDisplay;       // bar 模式：保持原有逻辑
            let barHeight;
            let x = 0;

            const gradient = canvasCtx.createLinearGradient(0, 0, width, 0);
            gradient.addColorStop(0, '#60a5fa'); // light blue
            gradient.addColorStop(1, '#a855f7'); // violet
            
            canvasCtx.fillStyle = gradient;

            if (displayStyle === 'line') {
                canvasCtx.beginPath();
                let x = 0;

                if (verticalAlignment === 'center') {
                    // 垂直居中模式 - 原有逻辑
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
                } else {
                    // 底部对齐模式 - 从底部开始绘制
                    // Move to the first point at the bottom
                    canvasCtx.moveTo(0, height);

                    // Draw the curve from left to right
                    for (let i = 0; i < binsToDisplay; i++) {
                        x = i * barWidth;
                        barHeight = smoothedDataArray[i] / 255 * height;
                        let y = height - barHeight;
                        canvasCtx.lineTo(x, y);
                    }

                    // Complete the path by drawing to the bottom right corner and back to start
                    canvasCtx.lineTo(width, height);
                    canvasCtx.lineTo(0, height);
                }

                canvasCtx.closePath();
                canvasCtx.fill();
            } else { // 'bar' style
                let x = 0;
                for (let i = 0; i < binsToDisplay; i++) {
                    const barHeight = dataArray[i] / 255 * height;

                    if (verticalAlignment === 'center') {
                        // 垂直居中模式
                        canvasCtx.fillRect(x, (height - barHeight) / 2, barWidth, barHeight);
                    } else {
                        // 底部对齐模式
                        canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
                    }

                    x += barWidth;
                }
            }
        };

        animationLoopManager.add(id, draw);

        return () => {
            animationLoopManager.remove(id);
        };
    }, [analyser, displayStyle, verticalAlignment, id]);

    return (
        <canvas ref={canvasRef} className={className} />
    )
}