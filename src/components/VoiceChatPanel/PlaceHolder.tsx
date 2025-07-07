import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function PlaceHolder() {
    return (
        <div className='scale-100'>
            {/* <DotLottieReact
                src="ghost-spin-no-background.lottie"
                loop
                autoplay
                speed={0.66}
            /> */}
            <img
                src="ghost-spin-no-background.gif"
                alt="ghost-spin-no-background"
                className="scale-80"
            />
        </div>
    )
}