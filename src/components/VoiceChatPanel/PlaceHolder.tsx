// import { useEffect, useRef } from 'react';
// import { DotLottie } from "https://esm.sh/@lottiefiles/dotlottie-web@0.41.0-pre.2/webgpu";
// import { DotLottie } from "https://esm.sh/@lottiefiles/dotlottie-web@0.41.0-pre.2/webgl";


export default function PlaceHolder() {
    // const canvasRef = useRef<HTMLCanvasElement>(null);
    // const dotLottieRef = useRef<DotLottie | null>(null);

    // useEffect(() => {

    //     if (canvasRef.current) {
    //         dotLottieRef.current = new DotLottie({
    //             canvas: canvasRef.current,
    //             src: "ghost-spin-no-background.lottie",
    //             loop: true,
    //             autoplay: true,
    //             renderConfig: {
    //                 autoResize: true
    //             }
    //         });
    //     }

    //     // 清理函数
    //     return () => {
    //         if (dotLottieRef.current) {
    //             dotLottieRef.current.destroy?.();
    //         }
    //     };
    // }, []);

    return (
        <div className='scale-100 select-none'>
            {/* <canvas
                ref={canvasRef}
                id="dotLottie-canvas"
            /> */}
            {/* <img
                src="ghost-spin-no-background.gif"
                alt="ghost-spin-no-background"
                className="scale-80"
                draggable="false"
            /> */}
            <span className="text-muted-foreground">😴 There is no one in chat</span>
        </div>
    )
}