import { useState, useRef, useLayoutEffect } from 'react'
import { Settings, Info } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { usePopover } from "@/stores/popoverStore"


const SettingPopover = () => {
    const isSettingPopoverOpen = usePopover(state => state.isSettingPopoverOpen);
    const toggle = usePopover(state => state.toggle);
    const [testVolume, setTestVolume] = useState(false);

    return (
        <Popover
            open={isSettingPopoverOpen}
            onOpenChange={(res) => {
                toggle('isSettingPopoverOpen')
                setTestVolume(false)
            }}
        >
            <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" className={isSettingPopoverOpen ? 'z-50' : ''}>
                    <Settings className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
        </Popover>
    );
}

export default SettingPopover