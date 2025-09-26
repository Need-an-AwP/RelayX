import { useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTailscaleStore, useWelcomeStore } from "@/stores"
import TsPart from "./tsPart";
import ConfigPart from "./configPart";
import Instructions from "./instructions";


export default function WelcomePanel() {
    const { showWelcome, setShowWelcome } = useTailscaleStore();
    // const showWelcome = true; // for testing

    const handleSave = () => {
        // write env and restart twg.
        useWelcomeStore.getState().writeEnv();
        // alert("environment variables saved (in console)!");
        setShowWelcome(false);

        // restart twg
        window.ipcBridge.restartTwg();
        // Refresh the current window
        // window.location.reload();
    };

    return (
        <AlertDialog open={showWelcome}>
            <AlertDialogContent className="sm:max-w-4xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-bold">Welcome</AlertDialogTitle>
                    <AlertDialogDescription>
                        It's seems that this is your first time using RelayX.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="grid md:grid-cols-2 gap-8 py-4">
                    <TsPart />
                    <ConfigPart />
                </div>

                <Instructions />

                <AlertDialogFooter className="pt-4">
                    <div className="grid grid-cols-5 gap-4 w-full">
                        <Button onClick={() => window.close()} className="col-span-2 cursor-pointer hover:!bg-destructive" size="lg">
                            Close and Quit
                        </Button>
                        <Button onClick={handleSave} className="col-span-3 cursor-pointer" size="lg">
                            Save and Continue
                        </Button>
                    </div>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}