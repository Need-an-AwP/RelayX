import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RiDiceFill } from "react-icons/ri";
import { useWelcomeStore } from '@/stores';
import { Eye, EyeOff } from "lucide-react";
import validateTsAuthKey from "@/utils/validateTsAuthKey";

export default function TsPart() {
    const { nodeHostname, tailscaleAuthKey, setNodeHostname, setTailscaleAuthKey } = useWelcomeStore();
    const [isValidKey, setIsValidKey] = useState(true);
    const [authKeyVisible, setAuthKeyVisible] = useState(false);

    const generateRandomHostname = () => {
        const randomString = Math.random().toString(36).substring(2, 10);
        setNodeHostname(randomString);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="node-hostname" className="text-base font-medium">
                    identify device name (NODE_HOSTNAME)
                </Label>
                <div className="flex items-center space-x-2">
                    <Input
                        id="node-hostname"
                        value={nodeHostname}
                        onChange={(e) => setNodeHostname(e.target.value)}
                        placeholder="Example: my-powerful-desktop"
                    />
                    <Button
                        size="icon"
                        variant="outline"
                        title="generate random hostname"
                        className="cursor-pointer"
                        onClick={generateRandomHostname}
                    >
                        <RiDiceFill className='h-full' />
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                    This is the name your device will use on the Tailscale network.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="tailscale-auth-key" className="text-base font-medium">
                    Tailscale authentication key (TAILSCALE_AUTH_KEY)
                </Label>
                <div className="flex items-center space-x-2">
                    <Input
                        id="tailscale-auth-key"
                        className={`${!isValidKey && '!border-red-500'}`}
                        type={authKeyVisible ? "text" : "password"}
                        value={tailscaleAuthKey}
                        onChange={(e) => {
                            setIsValidKey(validateTsAuthKey(e.target.value));
                            setTailscaleAuthKey(e.target.value);
                        }}
                        placeholder="tskey-auth-..."
                    />
                    <Button
                        size="icon"
                        variant="outline"
                        title="generate random hostname"
                        className="cursor-pointer"
                        onClick={() => setAuthKeyVisible(!authKeyVisible)}
                    >
                        {authKeyVisible ? <EyeOff className='h-full' /> : <Eye className='h-full' />}
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                    authentication key for joining Tailscale network
                </p>
            </div>
        </div>
    )
}