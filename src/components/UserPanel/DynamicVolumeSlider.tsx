import { useState, useEffect, useCallback } from 'react'
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface DynamicVolumeSliderProps {
    dynamicTopMin: number;
    dynamicTopMax: number;
    topGap: number;
    value: number;
    onValueChange: (value: number) => void;
    className?: string;
}

const DynamicVolumeSlider = ({ dynamicTopMax, dynamicTopMin, topGap, value, onValueChange, className, ...props }: DynamicVolumeSliderProps) => {
    // const [maxY, setMaxY] = useState(dynamicTopMin + topGap)
    const getInitialMaxY = useCallback(() => {
        if (value > dynamicTopMin) {
            return Math.min(value + topGap, dynamicTopMax)
        }
        return dynamicTopMin + topGap
    }, [value, dynamicTopMin, dynamicTopMax, topGap])

    const [maxY, setMaxY] = useState(getInitialMaxY())

    const handleValueChange = useCallback((newValue: number[]) => {
        const currentValue = newValue[0]

        // 更新父组件的值
        onValueChange(currentValue)

        // 动态调整 maxY
        if (currentValue > dynamicTopMin) {
            const newMaxY = Math.min(
                currentValue + topGap, // 保持与当前值的间距
                dynamicTopMax // 不超过最大限制
            )
            setMaxY(newMaxY)
        } else {
            // 重置为初始状态
            setMaxY(dynamicTopMin + topGap)
        }
    }, [dynamicTopMin, dynamicTopMax, topGap, onValueChange])

    return (
        <>
            <Slider
                className={cn('w-[15px] h-full bg-secondary rounded-full flex justify-center', className)}
                orientation='vertical'
                min={0}
                max={maxY}
                step={1}
                value={[value]}
                onValueChange={handleValueChange}
                {...props}
            />
        </>
    )
};


export default DynamicVolumeSlider;