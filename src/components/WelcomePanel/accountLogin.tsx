import { Button } from "@/components/ui/button";
import { Info, ExternalLink, LoaderCircle } from 'lucide-react'
import { useTailscaleStore, useWelcomeStore } from "@/stores";

export default function AccountLogin({ onLoginClick, }: { onLoginClick: () => void; }) {
    const { tsBackendState } = useTailscaleStore();
    const { isAccountWaiting } = useWelcomeStore();

    return (
        <div className="relative flex flex-col justify-center items-center h-full gap-2">
            {isAccountWaiting && <div className="absolute inset-0 backdrop-blur-sm bg-muted/30 rounded-md z-10" />}

            <div className="relative z-0 flex flex-col items-center gap-2">
                <Button className="cursor-pointer" onClick={onLoginClick}>
                    Click to login with Tailscale Account<ExternalLink className="w-4 h-4 inline-block" />
                </Button>
                <span className="text-xs text-muted-foreground">
                    This will open a browser window for Tailscale login.
                </span>
            </div>

            {isAccountWaiting &&
                <div className="absolute flex flex-col items-center space-y-2 z-20">
                    <LoaderCircle className={`w-12 h-12 animate-spin ${tsBackendState !== 'NeedsLogin' && 'text-yellow-500'}`} />

                    <span className="text-white text-sm">
                        Waiting for {tsBackendState === 'NeedsLogin' ? 'Login' : 'Tailscale'}...
                    </span>

                </div>
            }
        </div>
    )
}