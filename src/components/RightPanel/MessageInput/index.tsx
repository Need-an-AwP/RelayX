import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { TbSend, TbSendOff } from "react-icons/tb";
import { ChevronUp, ChevronDown, Plus, TriangleAlert, SmilePlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// import EmojiPicker from 'emoji-picker-react';
import { EmojiPicker, EmojiPickerSearch, EmojiPickerContent, EmojiPickerFooter } from "@/components/ui/emoji-picker";
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDMStore, useRemoteUsersStore } from "@/stores";
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LoaderCircle } from "lucide-react";
import { useFloating, offset, autoUpdate, useDismiss, useInteractions, FloatingPortal } from '@floating-ui/react';
import { Toaster, toast } from 'sonner'

type peerIP = string;

interface MessageInputProps {
    onFocusChange?: (hasFocus: boolean) => void;
}

export default function MessageInput({ onFocusChange }: MessageInputProps) {
    const { peers } = useRemoteUsersStore();
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isEmojiOpen, setIsEmojiOpen] = useState(false);
    const [isSendToEveryone, setIsSendToEveryone] = useState(true);
    const [targetPeers, setTargetPeers] = useState<string[]>([]);
    const [finalTargetPeers, setFinalTargetPeers] = useState<string[]>([]);
    const messageInputRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const {
        inputMessage,
        setInputMessage,
        handleSendMessage,
        messagesByPeer,
        getLatestMessage
    } = useDMStore()

    // 记录每个 peer 的最后一条消息 ID，用于检测新消息
    const lastMessageIdRef = useRef<Record<string, string>>({});

    // 处理焦点变化
    const handleFocusChange = (focused: boolean) => {
        onFocusChange?.(focused);
    };

    useEffect(() => {
        Object.entries(messagesByPeer).forEach(([peerIP, messageIds]) => {
            if (messageIds.length === 0) return;

            const latestMessageId = messageIds[messageIds.length - 1];
            const previousMessageId = lastMessageIdRef.current[peerIP];

            if (latestMessageId !== previousMessageId) {
                const latestMessage = getLatestMessage(peerIP);

                if (latestMessage) {
                    const peerName = peers[peerIP]?.userName || peerIP;

                    toast(<div className="flex flex-row items-center gap-2">
                        <Avatar className={`flex-shrink-0 transition-all`}>
                            <AvatarImage src={peers[peerIP]?.userAvatar} draggable={false} />
                            <AvatarFallback>
                                <LoaderCircle className="w-4 h-4 animate-spin" />
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-left truncate">
                            {latestMessage.content}
                        </span>
                    </div>, {
                        duration: 3000,
                        // action: {}
                    });
                }
                lastMessageIdRef.current[peerIP] = latestMessageId;
            }
        });
    }, [messagesByPeer, getLatestMessage, peers]);

    // 初始化和同步 finalTargetPeers
    useEffect(() => {
        if (isSendToEveryone) {
            setFinalTargetPeers(Object.keys(peers) as peerIP[]);
        } else {
            setFinalTargetPeers(targetPeers);
        }
    }, [peers, isSendToEveryone, targetPeers]);

    const handlePeerChange = (peerIP: peerIP) => {
        setTargetPeers(prev => {
            if (prev.includes(peerIP)) {
                return prev.filter(ip => ip !== peerIP);
            } else {
                return [...prev, peerIP];
            }
        });
    }

    const sendMessage = () => {
        if (inputMessage.trim()) {
            handleSendMessage(finalTargetPeers)
        }
    }

    const { refs, floatingStyles, context } = useFloating({
        placement: 'left',
        middleware: [offset({ mainAxis: 0, crossAxis: -35 })],
        whileElementsMounted: (reference, floating, update) => {
            return autoUpdate(reference, floating, update, {
                // ancestorScroll: true,
                // ancestorResize: true,
                // elementResize: true,
                layoutShift: true,
                animationFrame: true,
            });
        },
    });

    useEffect(() => {
        if (messageInputRef.current) {
            refs.setReference(messageInputRef.current);
        }
    }, [refs]);

    return (
        <div
            className="flex flex-col justify-center items-center w-full p-3 pt-1"
            onMouseLeave={() => {
                setIsSelectorOpen(false)
            }}
            ref={messageInputRef}
        >

            <FloatingPortal>
                <div
                    ref={refs.setFloating}
                    style={floatingStyles}
                    className="w-1 h-10 border-0 border-red-500 opacity-100 z-50 rounded"
                >
                    <Toaster
                        position='bottom-left'
                        toastOptions={{
                            unstyled: true,
                            className: 'bg-blue-400/90 p-2 pr-4 rounded-full'
                        }}
                    />
                </div>
            </FloatingPortal>

            <div className="flex justify-center items-center w-full h-12 px-2 gap-2 bg-primary-foreground rounded-full">
                {/* target peers selector */}
                <Popover open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
                    <PopoverTrigger>
                        <div className="rounded-full bg-transparent p-2 cursor-pointer hover:bg-foreground/20 transition-all duration-300">
                            {isSelectorOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </div>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start" className='p-2 space-y-2'>

                        <div className={`space-y-2 ${isSendToEveryone ? 'opacity-50 pointer-events-none' : ''}`}>
                            {Object.entries(peers).map(([peerIP, peerState]) => (
                                <div key={peerIP} className="flex items-center gap-2">
                                    <Checkbox
                                        checked={targetPeers.includes(peerIP)}
                                        onCheckedChange={() => handlePeerChange(peerIP)}
                                        disabled={isSendToEveryone}
                                    />
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Avatar className={`flex-shrink-0 transition-all`}>
                                            <AvatarImage src={peerState.userAvatar} draggable={false} />
                                            <AvatarFallback>
                                                <LoaderCircle className="w-4 h-4 animate-spin" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm text-left truncate">
                                            {peerState.userName}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Separator />
                        <div className="flex items-center gap-2 text-sm">
                            <Switch
                                checked={isSendToEveryone}
                                onCheckedChange={(checked) => { setIsSendToEveryone(checked) }}
                            />
                            <span>send to everyone in chat</span>
                        </div>
                    </PopoverContent>
                </Popover>

                <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onFocus={() => handleFocusChange(true)}
                    onBlur={() => handleFocusChange(false)}
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                            e.preventDefault()
                            sendMessage()
                        }
                    }}
                    className="w-full h-full bg-transparent outline-none border-0 border-amber-500"
                />

                {/* emoji selector */}
                <Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
                    <PopoverTrigger>
                        <div className="rounded-full bg-transparent p-2 cursor-pointer hover:bg-foreground/20 transition-all duration-300">
                            <SmilePlus className="w-4 h-4" />
                        </div>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="end" className='relative p-2 space-y-2 overflow-hidden'>
                        {/* <EmojiPicker
                            className="h-[342px]"
                            onEmojiClick={({ emoji }) => {
                                setIsEmojiOpen(false);
                                const newInput = inputMessage + emoji;
                                setInputMessage(newInput);
                            }}
                        /> */}
                        <EmojiPicker
                            className="h-[342px]"
                            onEmojiSelect={({ emoji }) => {
                                setIsEmojiOpen(false);
                                const newInput = inputMessage + emoji;
                                setInputMessage(newInput);
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

                {/* send button */}
                <div
                    className={`flex rounded-full bg-foreground/20 p-2 cursor-pointer items-center gap-2
                        hover:bg-foreground/30 select-none
                        ${inputMessage.trim().length > 0 ? '' : 'hidden'}`}
                    onClick={sendMessage}
                >
                    <TbSend className="w-4 h-4" />
                    <span className="text-xs">Ctrl+Enter</span>
                </div>
            </div>

        </div>
    )
}