import { useState } from 'react';
import { Minus, X, Menu } from 'lucide-react';
import { TiArrowMaximise, TiArrowMinimise } from "react-icons/ti";
import { usePopover } from '@/stores/uiStore';


const TitleBar: React.FC = () => {
    const { toggle } = usePopover()
    const [isMaximized, setIsMaximized] = useState<boolean>(false);
    const buttonClassName = "h-[32px] w-10 hover:bg-muted flex items-center justify-center"

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
                    <Menu className="h-4 w-4 pointer-events-none" />
                </div>
            </div>

            <div
                className="flex w-full h-full"
                style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
            />

            <div className="flex">
                <div
                    className={buttonClassName}
                    onClick={() => window.ipcBridge.minimizeWindow()}
                >
                    <Minus className="h-4 w-4 pointer-events-none" />
                </div>
                <div
                    className={buttonClassName}
                    onClick={() => {
                        window.ipcBridge.maximizeWindow();
                        setIsMaximized(!isMaximized);
                    }}
                >
                    {isMaximized ? <TiArrowMinimise className="h-4 w-4 pointer-events-none" /> : <TiArrowMaximise className="h-4 w-4 pointer-events-none" />}
                </div>
                <div
                    className={`${buttonClassName} hover:bg-red-800`}
                    onClick={() => window.ipcBridge.closeWindow()}
                >
                    <X className="h-4 w-4 pointer-events-none" />
                </div>
            </div>
        </div>
    );
};

export default TitleBar; 