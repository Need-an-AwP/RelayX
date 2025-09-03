import { useState, useEffect, useRef } from 'react';
import { useTailscaleStore } from '@/stores/twgStore';
import { cn } from "@/lib/utils";

const TailscaleStatusDisplay = ({ autoCollapse = false }: { autoCollapse?: boolean }) => {
    const tailscaleStatus = useTailscaleStore((state) => state.tailscaleStatus);
    const [isVisible, setIsVisible] = useState(true);
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }

        if (tailscaleStatus) {
            if (tailscaleStatus.BackendState !== 'Running') {
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
    }, [tailscaleStatus]);

    const backendStateToDisplay = tailscaleStatus?.BackendState || '正在获取状态...';
    const tailscaleIPsToDisplay = tailscaleStatus?.Self?.TailscaleIPs?.join(', ') || 'N/A';

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

    const statusColorClass = getStatusColor(tailscaleStatus?.BackendState);

    return (
        <div className={cn(autoCollapse && ('w-1/2  rounded-b-md bg-white/5 border-0 border-muted-foreground'),
            'transition-all duration-300 text-xs py-1',
            autoCollapse && (isVisible ? 'translate-y-0' : '-translate-y-full')
        )}>
            <div className="container mx-auto flex items-center justify-between gap-4 px-2">
                <div className="flex items-center gap-1 min-w-0">
                    <span className="font-semibold">Tailscale:</span>
                    <span className={cn("truncate", statusColorClass)}>{backendStateToDisplay}</span>
                </div>

                {tailscaleStatus?.BackendState === 'Running' && tailscaleIPsToDisplay !== 'N/A' && (
                    <div className="flex items-center gap-1 min-w-0">
                        <span className="font-semibold">IPs:</span>
                        <span className="truncate">{tailscaleIPsToDisplay}</span>
                    </div>
                )}

                {tailscaleStatus && tailscaleStatus.BackendState !== 'Running' && backendStateToDisplay !== '正在获取状态...' && (
                    <div className={cn("flex-shrink-0", statusColorClass)}>
                        服务未完全就绪。
                    </div>
                )}

                {!tailscaleStatus && (
                    <div className={cn("flex-shrink-0", statusColorClass)}>
                        正在连接 Tailscale...
                    </div>
                )}
            </div>
        </div>
    );
};

export default TailscaleStatusDisplay;
