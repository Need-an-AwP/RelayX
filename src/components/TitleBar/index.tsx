import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Minus, X, Menu } from 'lucide-react';
import { VscLayoutSidebarLeft, VscLayoutSidebarLeftOff } from "react-icons/vsc";
import { TbWindowMaximize, TbWindowMinimize } from "react-icons/tb";
import { usePopover, usePanelStore } from '@/stores';
import TailscaleStatusDisplay from '../TailscaleStatusDisplay';
import TsDisplayMain from './tsDisplayMain'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import AppSettingPanel from '@/components/AppSettingPanel';

const TitleBar = () => {
    const { toggle } = usePopover()
    const { isSideBarCollapsed, toggleSideBar } = usePanelStore((state) => state)
    const [isMaximized, setIsMaximized] = useState<boolean>(false);

    const buttonClassName = "h-[32px] w-10 hover:bg-muted flex items-center justify-center"
    const buttonIconClassName = "h-4 w-4 pointer-events-none text-white/50"

    const titleBarContent = (
        <div
            className={`fixed top-0 left-0 right-0 flex justify-between items-center z-999 h-[32px]
                bg-white/5 backdrop-blur-[2px]`}
        >
            <TsDisplayMain />
            
            <div className="flex items-center gap-2">
                <Sheet>
                    <SheetTrigger>
                        <div
                            // onClick={() => toggle('isAppSettingOpen')}
                            className={buttonClassName}
                        >
                            <Menu className={buttonIconClassName} />
                        </div>
                    </SheetTrigger>
                    <SheetContent side='left' className='mt-[32px] h-[calc(100vh-32px)] @container !max-w-none w-[60vw]'>

                        <SheetHeader>
                            <SheetTitle>App Settings</SheetTitle>
                            <SheetDescription></SheetDescription>
                        </SheetHeader>

                        <AppSettingPanel className='h-[calc(100vh-110px)]' />
                    </SheetContent>
                </Sheet>

            </div>

            {/* draggable area */}
            <div
                className="flex w-full h-full select-none justify-center items-baseline"
                style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
            >
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

    return createPortal(titleBarContent, document.body);
};

export default TitleBar; 