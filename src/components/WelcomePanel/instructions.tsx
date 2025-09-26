export default function Instructions() {
    return (
        <div className="grid grid-cols-2 gap-4 py-0">
            <div className="text-sm text-foreground p-4 bg-muted rounded-md h-full">
                    <h4 className="font-semibold mb-2 text-base">How to get an authentication key:</h4>
                    <ol className="list-decimal list-inside space-y-1">
                        <li>
                            Go to{" "}
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
                                Tailscale Admin Console
                            </a>.
                        </li>
                        <li>Click <strong>Generate auth key...</strong>.</li>
                        <li>
                            It is recommended to select <strong>Reusable</strong> and{" "}
                            <strong>Ephemeral</strong> key options.
                        </li>
                        <li>Copy the generated key and paste it in the input field above.</li>
                    </ol>
                </div>
                <div className="text-sm text-foreground p-4 bg-muted rounded-md h-full">
                    <h4 className="font-semibold mb-2 text-base">Or use a .env file directly</h4>
                    <p>
                        You can also create a file named <code>.env</code> in the application root directory with the following content:
                    </p>
                    <pre className="mt-2 p-2 bg-background rounded">
                        <code>
                            NODE_HOSTNAME=your_hostname
                            <br />
                            TAILSCALE_AUTH_KEY=your_auth_key
                        </code>
                    </pre>
                    <p className="mt-2 text-xs text-muted-foreground">
                        You'll need to restart the application for changes to take effect.
                    </p>
                </div>
        </div>
    )
}