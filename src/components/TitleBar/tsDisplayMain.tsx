import { useState, useEffect, useRef } from 'react';
import { useTailscaleStore, type backendState } from '@/stores';
import { LoaderCircle, CircleCheckBig } from "lucide-react";

export default function TsDisplayMain() {
    const { tailscaleStatus, tsBackendState } = useTailscaleStore();
    const [isVisible, setIsVisible] = useState(true);
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);


    useEffect(() => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }

        if (tsBackendState) {
            if (tsBackendState !== 'Running') {
                setIsVisible(true);
            } else {
                hideTimerRef.current = setTimeout(() => {
                    setIsVisible(false);
                }, 3000);
            }
        } else {
            setIsVisible(true);
        }

        return () => {
            if (hideTimerRef.current) {
                clearTimeout(hideTimerRef.current);
            }
        };
    }, [tsBackendState]);


    const getStatusColor = (state: string | undefined) => {
        if (!state) return 'text-sky-500 dark:text-sky-400'; // Loading or unknown
        switch (state) {
            case 'Running':
                return 'text-green-500 dark:text-green-400';
            case 'NeedsLogin':
            case 'NeedsMachineAuth':
            case 'Stopped':
            case 'Starting':
            case 'WaitingForFirewall':
            case 'WaitingForUserspaceRestart':
                return 'text-yellow-500 dark:text-yellow-400';
            case 'Offline':
            case 'NoState': // Assuming NoState is also a problematic state
                return 'text-red-500 dark:text-red-400';
            default:
                return 'text-foreground'; // Default color
        }
    };

    return (
        <div className={`absolute left-0 top-0 translate-x-full
        w-1/3 rounded-xl bg-neutral-800 border-0 border-muted-foreground
        transition-all duration-300 text-xs select-none
        ${isVisible ? 'translate-y-1/2' : '-translate-y-full'}`}>
            <div className="flex items-center justify-center gap-4 px-2 py-8">
                {tsBackendState === 'Running' ?
                    <CircleCheckBig className={`${getStatusColor(tsBackendState)} w-8 h-8`} /> :
                    <LoaderCircle className={`w-8 h-8 animate-spin ${tsBackendState && getStatusColor(tsBackendState)}`} />
                }


                {tsBackendState ?
                    <span className="font-semibold">Tailscale backend is {tsBackendState}</span> :
                    <span className="font-semibold">Waiting for Tailscale backend</span>}
            </div>
        </div>
    )
}