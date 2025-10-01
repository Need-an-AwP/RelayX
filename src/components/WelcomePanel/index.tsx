import { use, useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTailscaleStore, useWelcomeStore } from "@/stores"
import { KeyRound, User, LoaderCircle, ArrowLeft } from "lucide-react";
import KeyLogin from "./keyLogin";
import AccountLogin from "./accountLogin";
import ConfigPart from "./configPart";
import Instructions from "./instructions";


// this panel will wait for twg to tell show or not
export default function WelcomePanel() {
    const { showWelcome } = useTailscaleStore();
    const {
        writeEnv, setIsAccountWaiting, setIsInvalidKey,
        isInvalidKey, setIsVarifyingKey, isVarifyingKey
    } = useWelcomeStore();
    // const showWelcome = true; // for testing
    const [loginMethod, setLoginMethod] = useState<'key' | 'account' | null>(null);
    const [isKeyValid, setIsKeyValid] = useState(false);

    const handleSaveAndContinue = async () => {
        setIsVarifyingKey(true);
        // write env and restart twg.
        writeEnv();
        window.ipcBridge.setUserConfig('loginMethod', 'key');
        // alert("environment variables saved (in console)!");
        // should wait for twg tells ready

        // restart twg
        setTimeout(() => {
            window.ipcBridge.restartTwg();
        }, 500);
    };

    const handleAccountLogin = () => {
        setIsAccountWaiting(true);
        window.ipcBridge.setUserConfig('loginMethod', 'account');
        setTimeout(() => {
            window.ipcBridge.restartTwg();
        }, 500);
    };

    const handleAccountCancel = () => {
        setIsAccountWaiting(false);
        window.ipcBridge.setUserConfig('loginMethod', null);
        window.ipcBridge.closeTwg();
    };

    return (<>
        <AlertDialog open={isInvalidKey}>
            <AlertDialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-bold">Invalid Auth Key</AlertDialogTitle>
                    <AlertDialogDescription>
                        The authentication key you provided seems to be invalid. Please check and enter a valid key.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="pt-4">
                    <Button className="cursor-pointer" onClick={() => setIsInvalidKey(false)}>Confirm</Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>


        <AlertDialog open={showWelcome}>
            <AlertDialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-bold">Welcome</AlertDialogTitle>
                    <AlertDialogDescription>
                        It's seems that this is your first time using RelayX.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {loginMethod === null &&
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Choose Login Method</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Card
                                className={`cursor-pointer hover:bg-muted/50 hover:ring-2 transition-all duration-300`}
                                onClick={() => setLoginMethod('account')}
                            >
                                <CardHeader className="text-center pb-2">
                                    <User className="w-8 h-8 mx-auto mb-2" />
                                    <CardTitle className="text-base">Account Login</CardTitle>
                                    <CardDescription className="text-sm">
                                        Sign in with your Tailscale account
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            <Card
                                className={`cursor-pointer hover:bg-muted/50 hover:ring-2 transition-all duration-300`}
                                onClick={() => setLoginMethod('key')}
                            >
                                <CardHeader className="text-center pb-2">
                                    <KeyRound className="w-8 h-8 mx-auto mb-2" />
                                    <CardTitle className="text-base">Auth Key Login</CardTitle>
                                    <CardDescription className="text-sm">
                                        Use authentication key directly
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </div>
                    </div>
                }

                {loginMethod &&
                    <div className="grid md:grid-cols-2 gap-8 py-4">
                        {loginMethod === 'key' && <KeyLogin onValidationChange={setIsKeyValid} />}
                        {loginMethod === 'account' && (
                            <AccountLogin onLoginClick={handleAccountLogin} />
                        )}
                        <ConfigPart />
                    </div>
                }
                {loginMethod === 'key' && <Instructions />}

                <AlertDialogFooter className="pt-4 w-1/2 mx-auto">
                    <div className="grid grid-cols-5 gap-4 w-full">

                        {loginMethod ?
                            <Button
                                onClick={() => {
                                    setLoginMethod(null);
                                    if (loginMethod === 'account') {
                                        handleAccountCancel();
                                    }
                                }}
                                className={`${loginMethod === 'key' ? 'col-span-2' : 'col-span-5'} cursor-pointer`}
                                size="lg"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back
                            </Button> :
                            <Button onClick={() => window.close()} className={`col-span-5 cursor-pointer hover:!bg-destructive`} size="lg">
                                Close and Quit
                            </Button>
                        }
                        {loginMethod === 'key' &&
                            <Button
                                onClick={handleSaveAndContinue}
                                disabled={!isKeyValid || isVarifyingKey}
                                className="col-span-3 cursor-pointer"
                                size="lg"
                            >
                                {isVarifyingKey ? <><LoaderCircle className="animate-spin h-4 w-4" />Verifying...</> : 'Save and Continue'}
                            </Button>
                        }
                    </div>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
    )
}