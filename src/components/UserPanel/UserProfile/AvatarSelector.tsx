import { useState, useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Info, LoaderCircle, RefreshCcw } from "lucide-react";
import {
    FaGlobe,
    FaDeviantart,
    FaDribbble,
    FaGithub,
    FaGoogle,
    FaSoundcloud,
    FaTelegram,
    FaTwitch,
    FaYoutube,
} from "react-icons/fa";
import { SiDuckduckgo, SiGravatar, SiOnlyfans } from "react-icons/si"
import { FaXTwitter } from "react-icons/fa6";
import { PiReadCvLogo } from "react-icons/pi";



interface AvatarSelectorProps {
    currentAvatar: string;
    setCurrentAvatar: Dispatch<SetStateAction<string>>;
}

const PlatformIcon = ({ platform }: { platform: { name: string, domain: string } }) => {
    switch (platform.name) {
        case "DeviantArt":
            return <FaDeviantart className="w-4 h-4" />;
        case "Dribbble":
            return <FaDribbble className="w-4 h-4" />;
        case "DuckDuckGo":
            return <SiDuckduckgo className="w-4 h-4" />;
        case "GitHub":
            return <FaGithub className="w-4 h-4" />;
        case "Google":
            return <FaGoogle className="w-4 h-4" />;
        case "Gravatar":
            return <SiGravatar className="w-4 h-4" />;
        // case "Microlink":
        //     return <SiMicrolink className="w-4 h-4" />;
        case "OnlyFans":
            return <SiOnlyfans className="w-4 h-4" />;
        case "Read.cv":
            return <PiReadCvLogo className="w-4 h-4" />;
        case "SoundCloud":
            return <FaSoundcloud className="w-4 h-4" />;
        case "Telegram":
            return <FaTelegram className="w-4 h-4" />;
        case "Twitch":
            return <FaTwitch className="w-4 h-4" />;
        case "X/Twitter":
            return <FaXTwitter className="w-4 h-4" />;
        case "YouTube":
            return <FaYoutube className="w-4 h-4" />;
        default:
            return <FaGlobe className="w-4 h-4" />;
    }
};

export default function AvatarSelector({ currentAvatar, setCurrentAvatar }: AvatarSelectorProps) {
    const [unavatarPlatform, setUnavatarPlatform] = useState("");
    const [unavatarUserName, setUnavatarUserName] = useState("");
    const [isMouseHoverAvatar, setIsMouseHoverAvatar] = useState(false);
    const [exampleURL, setExampleURL] = useState("https://avatars.fastly.steamstatic.com/eb65fc3c5a55471e3dcc3d81d748fac4838912a5_full.jpg");

    const generateRandomAvatarFromDiceBear = () => {
        const seedList = [
            "Jameson", "Easton", "Katherine",
            "Ethan", "John", "Michael",
            "David", "Eliza", "Olivia",
            "Emma", "Ava", "Isabella",
            "Oliver", "Charlotte", "Elijah",
            "Aria", "Liam", "Mia",
        ]
        const randomSeed = seedList[Math.floor(Math.random() * seedList.length)] + Math.random().toString(36).substring(2, 15)
        const diceBearUrl = `https://api.dicebear.com/9.x/thumbs/svg?seed=${randomSeed}`
        console.log(diceBearUrl)
        setCurrentAvatar(diceBearUrl)
    }

    const unavatarPlatforms = [
        { name: "DuckDuckGo", value: "duckduckgo", domain: "duckduckgo.com" },
        { name: "GitHub", value: "github", domain: "github.com" },
        { name: "Google", value: "google", domain: "google.com" },
        { name: "Gravatar", value: "gravatar", domain: "gravatar.com" },
        { name: "OnlyFans", value: "onlyfans", domain: "onlyfans.com" },
        { name: "Read.cv", value: "read.cv", domain: "read.cv" },
        { name: "SoundCloud", value: "soundcloud", domain: "soundcloud.com" },
        { name: "Telegram", value: "telegram", domain: "telegram.org" },
        { name: "Twitch", value: "twitch", domain: "twitch.tv" },
        { name: "X/Twitter", value: "x", domain: "x.com" },
        { name: "YouTube", value: "youtube", domain: "youtube.com" },
    ];

    useEffect(() => {
        if (unavatarPlatform && unavatarUserName) {
            setCurrentAvatar(`https://unavatar.io/${unavatarPlatform}/${unavatarUserName}`)
        }
    }, [unavatarUserName, unavatarPlatform, setCurrentAvatar])

    return (
        <div className="flex flex-col gap-4 text-sm">
            <div className="flex flex-col items-center gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Avatar
                            className="flex-shrink-0 size-16 cursor-pointer"
                            onClick={generateRandomAvatarFromDiceBear}
                            onMouseEnter={() => setIsMouseHoverAvatar(true)}
                            onMouseLeave={() => setIsMouseHoverAvatar(false)}
                        >
                            <AvatarImage src={currentAvatar} draggable={false} />
                            <AvatarFallback>
                                <LoaderCircle className="w-4 h-4 animate-spin" />
                            </AvatarFallback>
                            {isMouseHoverAvatar && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <RefreshCcw className="w-6 h-6" />
                                </div>
                            )}
                        </Avatar>
                    </TooltipTrigger>
                    <TooltipContent className="text-center">
                        <p className="text-md font-bold">Click to generate a random avatar</p>
                        <p>Random avatar is powered by <a href="https://dicebear.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500" onClick={(event) => { event.preventDefault(); window.ipcBridge.openURL("https://dicebear.com/") }}>dicebear.com</a></p>
                    </TooltipContent>
                </Tooltip>
            </div>

            <Separator />

            <div className="flex flex-col justify-between gap-2">
                <div className="flex items-center gap-2">
                    <p>or use an avatar from </p>
                    <Select
                        value={unavatarPlatform}
                        onValueChange={setUnavatarPlatform}
                    >
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <SelectTrigger autoFocus={false}>
                                    <SelectValue placeholder="Select a platform" />
                                </SelectTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Powered by <a href="https://unavatar.io/" target="_blank" rel="noopener noreferrer" className="text-blue-500" onClick={(event) => { event.preventDefault(); window.ipcBridge.openURL("https://unavatar.io/") }}>unavatar.io</a></p>
                            </TooltipContent>
                        </Tooltip>
                        <SelectContent className="z-999">
                            {unavatarPlatforms.map((platform) => (
                                <SelectItem value={platform.value} key={platform.value}>
                                    <div className="flex items-center gap-2">
                                        <PlatformIcon platform={platform} />
                                        <span>{platform.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {unavatarPlatform && (
                    <Input
                        type="text"
                        placeholder={`Enter your ${unavatarPlatform} user name`}
                        value={unavatarUserName}
                        onChange={(e) => setUnavatarUserName(e.target.value)}
                    />
                )}
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <p>or use a link of any picture</p>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="w-4 h-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Accept any image links that can be accessed publicly.
                                <br />Like <a
                                    href={exampleURL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        setCurrentAvatar(exampleURL)
                                    }}
                                >{exampleURL}</a>
                                <br />if any peer can't access your avatar image, they will see a default avatar.
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </div>

                <Input
                    type="text"
                    placeholder="Enter your avatar URL"
                    value={currentAvatar}
                    onChange={(e) => setCurrentAvatar(e.target.value)}
                />
            </div>
            
        </div>
    )
}