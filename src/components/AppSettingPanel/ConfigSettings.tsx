import { useState } from "react"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
    ListRestart, 
    MessageSquare, 
    Mic, 
    MicOff, 
    Volume2, 
    Bell, 
    Settings, 
    Shield,
    Headphones,
    Zap
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"


export default function ConfigSettings() {
    const [isAutoConnect, setIsAutoConnect] = useState(false)
    const [isMuteOnJoin, setIsMuteOnJoin] = useState(false)
    const [isOutputMuted, setIsOutputMuted] = useState(false)
    const [isNotificationEnabled, setIsNotificationEnabled] = useState(false)
    const [isAutoReconnect, setIsAutoReconnect] = useState(false)
    const [isPushToTalk, setIsPushToTalk] = useState(false)

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <Settings className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Application Settings</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                {/* Chat Settings */}
                <Card className="border rounded-md p-3">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-blue-500" />
                                <Label className="text-sm font-medium">Auto Join Chat</Label>
                            </div>
                            <Badge variant="outline" className="text-xs">Chat</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                            Automatically join voice chat when connecting
                        </div>
                        <div className="flex justify-end">
                            <Switch 
                                disabled={true} 
                                checked={isAutoConnect} 
                                onCheckedChange={setIsAutoConnect} 
                            />
                        </div>
                    </div>
                </Card>

                <Card className="border rounded-md p-3">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MicOff className="h-4 w-4 text-red-500" />
                                <Label className="text-sm font-medium">Mute on Join</Label>
                            </div>
                            <Badge variant="outline" className="text-xs">Chat</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                            Mute microphone when joining chat
                        </div>
                        <div className="flex justify-end">
                            <Switch 
                                disabled={true} 
                                checked={isMuteOnJoin} 
                                onCheckedChange={setIsMuteOnJoin} 
                            />
                        </div>
                    </div>
                </Card>

                

                <Card className="border rounded-md p-3">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bell className="h-4 w-4 text-yellow-500" />
                                <Label className="text-sm font-medium">Notifications</Label>
                            </div>
                            <Badge variant="outline" className="text-xs">Info</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                            Show system notifications for events
                        </div>
                        <div className="flex justify-end">
                            <Switch 
                                disabled={true} 
                                checked={isNotificationEnabled} 
                                onCheckedChange={setIsNotificationEnabled} 
                            />
                        </div>
                    </div>
                </Card>

                <Card className="border rounded-md p-3">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-purple-500" />
                                <Label className="text-sm font-medium">Auto Reconnect</Label>
                            </div>
                            <Badge variant="outline" className="text-xs">Connection</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                            Automatically reconnect on connection loss
                        </div>
                        <div className="flex justify-end">
                            <Switch 
                                disabled={true} 
                                checked={isAutoReconnect} 
                                onCheckedChange={setIsAutoReconnect} 
                            />
                        </div>
                    </div>
                </Card>

                <Card className="border rounded-md p-3">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Headphones className="h-4 w-4 text-indigo-500" />
                                <Label className="text-sm font-medium">Push to Talk</Label>
                            </div>
                            <Badge variant="outline" className="text-xs">Chat</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                            Hold key to transmit audio instead of voice activation
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Key:</span>
                                <Badge 
                                    variant="secondary" 
                                    className="font-mono text-xs px-2 py-1 cursor-pointer hover:bg-muted"
                                    onClick={() => {/* TODO: Implement key binding */}}
                                >
                                    Space
                                </Badge>
                            </div>
                            <Switch 
                                disabled={true} 
                                checked={isPushToTalk} 
                                onCheckedChange={setIsPushToTalk} 
                            />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}