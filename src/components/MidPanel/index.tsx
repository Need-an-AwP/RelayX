import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePanelStore } from "./panelControls"

export default function MidPanel() {
    const { isLeftPanelCollapsed, isRightPanelCollapsed, togglePanel } = usePanelStore()

    return (
        <div className="h-full w-full bg-[#121212] bg-opacity-50 backdrop-blur-sm">
            <div className="absolute left-0 top-0">
                <Button
                    size='icon'
                    variant="ghost"
                    onClick={() => togglePanel('left')}
                    className="hover:bg-white/10"
                    title={isLeftPanelCollapsed() ? "展开频道列表" : "收起频道列表"}
                >
                    {isLeftPanelCollapsed() ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>
            </div>
            <div className="absolute right-0 top-0">
                <Button
                    size='icon'
                    variant="ghost"
                    onClick={() => togglePanel('right')}
                    className="hover:bg-white/10"
                    title={isRightPanelCollapsed() ? "展开用户列表" : "收起用户列表"}
                >
                    {isRightPanelCollapsed() ? (
                        <ChevronLeft className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                </Button>
            </div>
            
        </div>
    )
}
