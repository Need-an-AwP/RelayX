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
import { ListRestart } from "lucide-react";
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


export default function ConfigSettings() {
    const [isAutoConnect, setIsAutoConnect] = useState(false)

    return (
        <Card>
            <CardContent>
                <div className="flex flex-col gap-4">
                    <div className="flex gap-2 justify-between">
                        <Label className="whitespace-nowrap">Automatically join voice chat when App is launched</Label>
                        <Switch disabled={true} checked={isAutoConnect} onCheckedChange={setIsAutoConnect} />
                    </div>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="destructive" className="w-full cursor-pointer select-none">
                                <ListRestart className="h-3 w-3" />
                                <span>Reset Config</span>
                            </Button>
                        </DialogTrigger>

                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Are you absolutely sure?</DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone. This will reset your config file to default.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <DialogClose>Cancel</DialogClose>
                                <Button disabled={true}>Continue</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

            </CardContent>
        </Card>
    )
}