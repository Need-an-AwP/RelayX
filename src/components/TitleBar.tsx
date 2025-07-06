import { useState } from 'react';
import { Minus, X, Menu } from 'lucide-react';
import { VscLayoutSidebarLeft, VscLayoutSidebarLeftOff } from "react-icons/vsc";
import { TbWindowMaximize, TbWindowMinimize } from "react-icons/tb";
import { usePopover, usePanelStore } from '@/stores';
import TailscaleStatusDisplay from './TailscaleStatusDisplay';

const TitleBar = () => {
    const { toggle } = usePopover()
    const { isSideBarCollapsed, toggleSideBar } = usePanelStore((state) => state)
    const [isMaximized, setIsMaximized] = useState<boolean>(false);

    const buttonClassName = "h-[32px] w-10 hover:bg-muted flex items-center justify-center"
    const buttonIconClassName = "h-4 w-4 pointer-events-none text-white/50"

    return (
        <div
            className={`flex justify-between items-center z-55 h-[32px]
                bg-white/5 backdrop-blur-[2px]`}
        >
            <div className="flex items-center gap-2">
                <div
                    onClick={() => toggle('isAppSettingOpen')}
                    className={buttonClassName}
                >
                    <Menu className={buttonIconClassName} />
                </div>
            </div>

            {/* draggable area */}
            <div
                className="flex w-full h-full select-none justify-center items-baseline"
                style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
            >
                <TailscaleStatusDisplay autoCollapse={true} />
            </div>

            <div className="flex">
                <div
                    className={buttonClassName}
                    onClick={toggleSideBar}
                >
                    {isSideBarCollapsed ?
                        <VscLayoutSidebarLeftOff className={buttonIconClassName} />
                        :
                        <VscLayoutSidebarLeft className={buttonIconClassName} />
                    }
                </div>
                <div
                    className={buttonClassName}
                    onClick={() => window.ipcBridge.minimizeWindow()}
                >
                    <Minus className={buttonIconClassName} />
                </div>
                <div
                    className={buttonClassName}
                    onClick={() => {
                        window.ipcBridge.maximizeWindow();
                        setIsMaximized(!isMaximized);
                    }}
                >
                    {isMaximized ?
                        <TbWindowMinimize className={buttonIconClassName} />
                        :
                        <TbWindowMaximize className={buttonIconClassName} />
                    }
                </div>
                <div
                    className={`${buttonClassName} hover:bg-red-800`}
                    onClick={() => window.ipcBridge.closeWindow()}
                >
                    <X className={buttonIconClassName} />
                </div>
            </div>
        </div>
    );
};

export default TitleBar; 