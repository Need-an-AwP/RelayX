import { useState } from "react";
import { TbSend, TbSendOff } from "react-icons/tb";
import { AiOutlineEnter } from "react-icons/ai";
import { ChevronUp, ChevronDown, Plus, TriangleAlert, SmilePlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { EmojiPicker, EmojiPickerSearch, EmojiPickerContent, EmojiPickerFooter } from "@/components/ui/emoji-picker";
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PeersSelector from "./peersSelector";


export default function MessageInput() {
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isEmojiOpen, setIsEmojiOpen] = useState(false);
    const [isSendToEveryone, setIsSendToEveryone] = useState(true);
    const [targetPeers, setTargetPeers] = useState<string[]>([]);
    const [message, setMessage] = useState('');

    const handlePeerChange = (peerIP: string) => {
        setTargetPeers(prev => {
            if (prev.includes(peerIP)) {
                return prev.filter(ip => ip !== peerIP);
            } else {
                return [...prev, peerIP];
            }
        });
    }

    const handleSendToEveryoneChange = (checked: boolean) => {
        setIsSendToEveryone(checked);
        if (checked) {
            setTargetPeers([]);
        }
    }

    return (
        <div className="flex flex-col justify-center items-center w-full p-4">
            <div className="flex justify-center items-center w-full h-12 px-2 gap-2 bg-primary-foreground rounded-full">
                <Popover open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
                    <PopoverTrigger>
                        <div className="rounded-full bg-transparent p-2 cursor-pointer hover:bg-foreground/20 transition-all duration-300">
                            {isSelectorOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </div>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start" className='p-2 space-y-2'>

                        <PeersSelector
                            targetPeers={targetPeers}
                            onPeerChange={handlePeerChange}
                            disabled={isSendToEveryone}
                        />

                        <Separator />
                        <div className="flex items-center gap-2 text-sm">
                            <Switch
                                checked={isSendToEveryone}
                                onCheckedChange={handleSendToEveryoneChange}
                            />
                            <span>send to everyone in chat</span>
                        </div>
                    </PopoverContent>
                </Popover>

                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full h-full bg-transparent outline-none border-0 border-amber-500"
                />

                <Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
                    <PopoverTrigger>
                        <div className="rounded-full bg-transparent p-2 cursor-pointer hover:bg-foreground/20 transition-all duration-300">
                            <SmilePlus className="w-4 h-4" />
                        </div>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="end" className='relative p-2 space-y-2 overflow-hidden'>
                        <EmojiPicker
                            className="h-[342px]"
                            onEmojiSelect={({ emoji }) => {
                                setIsEmojiOpen(false);
                                setMessage(prev => prev + emoji);
                            }}
                        >
                            <EmojiPickerSearch />
                            <EmojiPickerContent />
                            <EmojiPickerFooter />
                        </EmojiPicker>
                    </PopoverContent>
                </Popover>

                <Popover open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <PopoverTrigger>
                        <div className="rounded-full bg-transparent p-2 cursor-pointer hover:bg-foreground/20 transition-all duration-300">
                            <Plus className="w-4 h-4" />
                        </div>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="end" className='relative p-2 space-y-2 overflow-hidden'>
                        <div className="flex flex-col items-start gap-2 text-sm">
                            <Label>Transfer file</Label>
                            <Input id="file" type="file" />
                        </div>
                        <div className="absolute top-0 right-0 w-full h-full bg-white/10 backdrop-blur-[1px] flex items-center justify-center text-yellow-500 font-bold">
                            <TriangleAlert className="w-4 h-4" />this feature is not available yet
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="flex rounded-full bg-foreground/20 p-2 cursor-pointer items-center gap-2
                hover:bg-foreground/30">
                    <TbSend className="w-4 h-4" />
                    <span className="text-xs">Ctrl+Enter</span>
                </div>
            </div>

        </div>
    )
}