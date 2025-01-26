import { useState } from 'react';
import { Minus, Square, X, SquareSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TitleBar: React.FC = () => {
    const [isMaximized, setIsMaximized] = useState<boolean>(false);

    return (
        <div
            className={`flex justify-between items-center px-2 z-50
                bg-white/5 backdrop-blur-[2px]`}
        >
            <div
                className="flex w-full h-full"
                style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
            ></div>
            <div className="flex gap-2 my-0.5">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => window.ipcBridge.minimizeWindow()}
                >
                    <Minus className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                        window.ipcBridge.maximizeWindow();
                        setIsMaximized(!isMaximized);
                    }}
                >
                    {isMaximized ? <SquareSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-red-500 hover:text-white"
                    onClick={() => window.ipcBridge.closeWindow()}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export default TitleBar; 