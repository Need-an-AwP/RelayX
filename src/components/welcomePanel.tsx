import { useState } from "react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTailscaleStore } from "@/stores/tailscaleStore";
import { Dices } from "lucide-react";
import { RiDiceFill } from "react-icons/ri";


export default function WelcomePanel() {
    const showWelcome = useTailscaleStore((state) => state.showWelcome);
    const [nodeHostname, setNodeHostname] = useState("");
    const [tailscaleAuthKey, setTailscaleAuthKey] = useState("");

    const handleSave = () => {
        // This will later be implemented to save the configuration
        // and restart the application.
        console.log("Saving config:", { nodeHostname, tailscaleAuthKey });
        alert("Configuration saved (in console)!");
    };

    const generateRandomHostname = () => {
        const randomString = Math.random().toString(36).substring(2, 10);
        setNodeHostname(randomString);
    };

    // if (showWelcome === null) {
    //     return null;
    // }

    return (
        <AlertDialog open={true}>
            <AlertDialogContent className="sm:max-w-4xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-bold">欢迎使用</AlertDialogTitle>
                    <AlertDialogDescription>
                        我们检测到这是您第一次运行，需要进行一些初始设置才能开始。
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="grid md:grid-cols-2 gap-8 py-4">
                    {/* Left Column: Inputs */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="node-hostname" className="text-base font-medium">
                                节点主机名 (NODE_HOSTNAME)
                            </Label>
                            <div className="flex items-center space-x-2">
                                <Input
                                    id="node-hostname"
                                    value={nodeHostname}
                                    onChange={(e) => setNodeHostname(e.target.value)}
                                    placeholder="例如: my-powerful-desktop"
                                />
                                <Button
                                    size="icon"
                                    variant="outline"
                                    title="随机生成一个主机名"
                                    className="cursor-pointer"
                                    onClick={generateRandomHostname}
                                >
                                    <RiDiceFill className='h-full'/>
                                </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                这是一个用于在网络中识别您设备的唯一名称。
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tailscale-auth-key" className="text-base font-medium">
                                Tailscale 授权密钥 (TAILSCALE_AUTH_KEY)
                            </Label>
                            <Input
                                id="tailscale-auth-key"
                                type="password"
                                value={tailscaleAuthKey}
                                onChange={(e) => setTailscaleAuthKey(e.target.value)}
                                placeholder="tskey-auth-..."
                            />
                            <p className="text-sm text-muted-foreground">
                                用于将您的设备连接到Tailscale网络的身份验证密钥。
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Instructions */}
                    <div className="space-y-4">
                        <div className="text-sm text-foreground p-4 bg-muted rounded-md h-fit">
                            <h4 className="font-semibold mb-2 text-base">如何获取授权密钥:</h4>
                            <ol className="list-decimal list-inside space-y-1">
                                <li>
                                    前往{" "}
                                    <a
                                        href="https://login.tailscale.com/admin/settings/keys"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-blue-300 underline-offset-4 hover:underline"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            window.ipcBridge.openURL('https://login.tailscale.com/admin/settings/keys');
                                        }}
                                    >
                                        Tailscale 后台
                                    </a>.
                                </li>
                                <li>点击 <strong>Generate auth key...</strong>.</li>
                                <li>
                                    建议选择 <strong>Reusable</strong> (可重用) 和{" "}
                                    <strong>Ephemeral</strong> (临时的) 密钥。
                                </li>
                                <li>复制生成的密钥并粘贴到左侧输入框。</li>
                            </ol>
                        </div>
                        <div className="text-sm text-foreground p-4 bg-muted rounded-md h-fit">
                            <h4 className="font-semibold mb-2 text-base">或者直接使用 .env 文件</h4>
                            <p>
                                您也可以在应用的根目录下创建一个名为 <code>.env</code> 的文件，并填入以下内容：
                            </p>
                            <pre className="mt-2 p-2 bg-background rounded">
                                <code>
                                    NODE_HOSTNAME=your_hostname
                                    <br />
                                    TAILSCALE_AUTH_KEY=your_auth_key
                                </code>
                            </pre>
                            <p className="mt-2 text-xs text-muted-foreground">
                                保存后需要重启应用才能生效。
                            </p>
                        </div>
                    </div>
                </div>

                <AlertDialogFooter className="pt-4">
                    <Button disabled={true} onClick={handleSave} className="w-full" size="lg">
                        保存并继续
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}