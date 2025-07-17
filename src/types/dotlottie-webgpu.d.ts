declare module "https://esm.sh/@lottiefiles/dotlottie-web@0.41.0-pre.2/webgpu" {
  interface DotLottieConfig {
    canvas: HTMLCanvasElement;
    src: string;
    loop?: boolean;
    autoplay?: boolean;
    renderConfig?: {
      autoResize?: boolean;
    };
  }

  export class DotLottie {
    constructor(config: DotLottieConfig);
    destroy?(): void;
  }
} 

declare module "https://esm.sh/@lottiefiles/dotlottie-web@0.41.0-pre.2/webgl" {
  interface DotLottieConfig {
    canvas: HTMLCanvasElement;
    src: string;
    loop?: boolean;
    autoplay?: boolean;
    renderConfig?: {
      autoResize?: boolean;
    };
  }

  export class DotLottie {
    constructor(config: DotLottieConfig);
    destroy?(): void;
  }
} 