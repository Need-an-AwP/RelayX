import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Key, FileText, ExternalLink } from "lucide-react";

export default function Instructions() {
    return (
        <Accordion type="multiple" className="w-full">
            <AccordionItem value="auth-key">
                <AccordionTrigger className="text-base font-medium">
                    <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4" />
                        How to Get Authentication Key
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <Card>
                        <CardContent className="space-y-3">
                            <ol className="list-decimal list-inside space-y-2 text-sm">
                                <li>
                                    Go to{" "}
                                    <a
                                        href="https://login.tailscale.com/admin/settings/keys"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-blue-500 underline-offset-4 hover:underline inline-flex items-center gap-1"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            window.ipcBridge.openURL('https://login.tailscale.com/admin/settings/keys');
                                        }}
                                    >
                                        Tailscale Admin Console
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </li>
                                <li>Click <strong>Generate auth key...</strong> button</li>
                                <li>
                                    Configure key options:
                                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                        <li>Select <strong>Reusable</strong> for multiple device connections</li>
                                        <li>Select <strong>Ephemeral</strong> for temporary nodes</li>
                                        <li>Set expiration time as needed</li>
                                    </ul>
                                </li>
                                <li>Copy the generated key and paste it in the input field</li>
                            </ol>
                            
                            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md mt-4">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    <strong>Tip:</strong> Reusable keys can be used multiple times, while ephemeral nodes automatically disappear when disconnected.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="env-file">
                <AccordionTrigger className="text-base font-medium">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Alternative: Use .env File
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <Card>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm mb-3">
                                    When you save the configuration above, a <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">.env</code> file will be automatically created in the app directory. You can also manually create or edit this file with the following format:
                                </p>
                                <div className="bg-slate-900 text-slate-100 p-4 rounded-md font-mono text-sm">
                                    <div className="text-green-400"># Tailscale Configuration</div>
                                    <div><span className="text-blue-400">NODE_HOSTNAME</span>=<span className="text-yellow-300">your_hostname</span></div>
                                    <div><span className="text-blue-400">TAILSCALE_AUTH_KEY</span>=<span className="text-yellow-300">your_auth_key</span></div>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <h5 className="font-semibold text-sm">Manual Setup Steps:</h5>
                                <ol className="list-decimal list-inside space-y-1 text-sm">
                                    <li>Navigate to the app directory where RelayX is installed</li>
                                    <li>Look for the existing <code className="bg-muted px-1 py-0.5 rounded text-xs">.env</code> file or create a new one</li>
                                    <li>Edit the file with your hostname and authentication key</li>
                                    <li>Save the file and restart the application</li>
                                </ol>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    <strong>Tip:</strong> The app automatically creates this file when launched, so you usually don't need to create it manually.
                                </p>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    <strong>Note:</strong> Any manual changes to the .env file require a restart to take effect.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}