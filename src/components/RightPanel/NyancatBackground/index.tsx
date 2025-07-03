import { useRef, useEffect } from 'react';
import { createAnimatable } from 'animejs';
import CatSvg from './nyancat_onlycat.svg';

const NyancatBackground = ({ className }: { className?: string }) => {
    const catRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (!catRef.current) return;

        let bounds = catRef.current.getBoundingClientRect();
        const refreshBounds = () => {
            if (catRef.current) {
                bounds = catRef.current.getBoundingClientRect();
            }
        };

        const catAnimatable = createAnimatable(catRef.current, {
            rotate: { unit: 'rad' },
            duration: 200,
            ease: 'linear',
        });

        const { PI } = Math;
        let lastAngle = 0;
        let angle = PI / 2;

        const onMouseMove = (e: MouseEvent) => {
            const { width, height, left, top } = bounds;
            const x = e.clientX - left - width / 2;
            const y = e.clientY - top - height / 2;
            const currentAngle = Math.atan2(y, x) - PI / 2;
            const diff = currentAngle - lastAngle;
            angle += diff > PI ? diff - 2 * PI : diff < -PI ? diff + 2 * PI : diff;
            lastAngle = currentAngle;
            catAnimatable.rotate(angle);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('scroll', refreshBounds, true); // Use capture to get scroll events on window

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('scroll', refreshBounds, true);
        };
    }, []);

    return (
        <div className={`absolute bottom-0 left-0 w-full translate-y-1/3 ${className}`}>
            <img src={CatSvg} alt="nyancat" className='w-1/4 h-1/4 grayscale-0' />
        </div>
    );
};

export default NyancatBackground;