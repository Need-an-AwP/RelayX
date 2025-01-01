import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { RotateCcw } from 'lucide-react';
import fetchChannels from "@/utils/requestChannels"
import { useTailscale, useChannel } from '@/stores'


const UsingPresetChannels = () => {
    const loginName = useTailscale((state) => state.loginName);
    const setFetchLoding = useChannel((state) => state.setFetchLoding);
    const setChannels = useChannel((state) => state.setChannels);
    const setIsPresetChannels = useChannel((state) => state.setIsPresetChannels); 

    const RerequestChannels = () => {
        if (!loginName) return;

        setFetchLoding(true);
        fetchChannels(loginName)
        .then((res) => {
            const { channels, isPreset } = res;
            setChannels(channels);
            setIsPresetChannels(isPreset);
        })
        .finally(() => {
            setFetchLoding(false);
        })
    }

    return (
        <div className="bg-red-500 bg-opacity-30 w-full p-1 px-4 flex flex-row items-center justify-between">
            <span className="text-xs text-muted-foreground text-left">
                can't get channels from server<br />
                using preset channels now
            </span>
            <TooltipProvider delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="bg-red-500 bg-opacity-0"
                            onClick={() => {
                                RerequestChannels();
                            }}
                        >
                            <RotateCcw className="w-4 h-4 text-xs text-muted-foreground" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-xs">re-request channels from server</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

        </div>
    );
};

export default UsingPresetChannels;