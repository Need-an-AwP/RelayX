import React, { useState, useRef, useEffect } from "react"
import {
    useAudioProcessing, useMediaStream, useChannel, useCurrentUser,
    useTailscale, useCurrentChannel, useRemoteUserStore
} from "@/stores";
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { User } from "@/types";
import InviteCard from "./inviteCard"
import VoiceMemberCard from "./VoiceMemberCard"
import VideoMemberCard from "./VideoMemberCard"
import BottomScrollBar from "./bottomScrollBar"


interface FocusedMember {
    member: User
    isVideo: boolean
}

const CardsDisplay = () => {
    const remoteUsersInfo = useRemoteUserStore((state) => state.remoteUsersInfo)
    const isSelfScreenSharing = useCurrentUser((state) => state.isScreenSharing)
    const currentUser = useCurrentUser((state) => state)
    const remoteUsers = useRemoteUserStore((state) => state)
    const selfIPv4 = useTailscale((state) => state.selfIPs.ipv4);

    const members = useCurrentChannel((state) => state.allUsers);
    const [focusedMember, setFocusedMember] = useState<FocusedMember | null>(null);
    const isFocusView = focusedMember !== null;
    const [isHover, setIsHover] = useState(false)
    const [isScrollBarCollapsed, setIsScrollBarCollapsed] = useState(false);

    const handleMember = (member: User) => {
        const userInfo = remoteUsersInfo.get(member.IPs.ipv4!);
        const memberIsScreenSharing = userInfo?.isScreenSharing || false;
        const isSelf = member.IPs.ipv4 === selfIPv4
        const hasVideo = isSelfScreenSharing || memberIsScreenSharing

        return {
            isSelf,
            hasVideo
        }
    }

    return (
        <div
            className="relative z-30 flex-1 h-full w-full p-4"
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
        >
            <div
                style={{ scrollbarGutter: 'stable' }}
                className={`h-full w-full flex items-center justify-center overflow-x-hidden @container
                    [&::-webkit-scrollbar]:w-2 pl-2 [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#101720]
                    hover:[&::-webkit-scrollbar-thumb]:bg-[#212A37] transition-all duration-300 ease-in-out
                    ${isFocusView && !isScrollBarCollapsed && 'pb-[12%]'} 
                    ${isFocusView ? 'overflow-y-hidden' : 'pb-0 overflow-y-auto'} 
                    `}
            >
                <div className={`${isFocusView ? 'flex' : 'grid @md:grid-cols-2 grid-cols-1 gap-4'} w-full
                transition-all duration-300 ease-in-out`}>
                    {isFocusView && focusedMember ? (
                        <React.Fragment key={focusedMember.member.id}>
                            {focusedMember.isVideo ? (
                                <VideoMemberCard
                                    isSelf={focusedMember.member.IPs.ipv4 === selfIPv4}
                                    member={focusedMember.member}
                                    index={members.findIndex(member => member.id === focusedMember.member.id)}
                                    membersLength={members.length}
                                    onClick={() => setFocusedMember(null)}
                                />
                            ) : (
                                <VoiceMemberCard
                                    isSelf={focusedMember.member.IPs.ipv4 === selfIPv4}
                                    member={focusedMember.member}
                                    index={members.findIndex(member => member.id === focusedMember.member.id)}
                                    membersLength={members.length}
                                    onClick={() => setFocusedMember(null)}
                                />
                            )}
                        </React.Fragment>
                    ) : (<>
                        {members.map((member, index) => {
                            const { isSelf, hasVideo } = handleMember(member)
                            return (
                                <React.Fragment key={member.id}>
                                    <VoiceMemberCard
                                        isSelf={isSelf}
                                        member={member}
                                        index={index}
                                        membersLength={members.length}
                                        onClick={() => setFocusedMember({ member, isVideo: false })}
                                    />
                                    {hasVideo && (
                                        <VideoMemberCard
                                            isSelf={isSelf}
                                            member={member}
                                            index={index}
                                            membersLength={members.length}
                                            onClick={() => setFocusedMember({ member, isVideo: true })}
                                        />
                                    )}
                                </React.Fragment>
                            )
                        })}
                        {members.length === 1 && (
                            <InviteCard
                                totalCardsCount={1 + (handleMember(members[0]).hasVideo ? 1 : 0)}
                            />
                        )}
                        <pre>{JSON.stringify(currentUser, null, 2)}</pre>
                        <pre>{JSON.stringify(remoteUsers, null, 2)}</pre>
                    </>)}
                </div>
            </div>
            {/* horizontal scroll bar */}
            {isFocusView && (
                <BottomScrollBar
                    members={members}
                    handleMember={handleMember}
                    setFocusedMember={setFocusedMember}
                    isScrollBarCollapsed={isScrollBarCollapsed}
                />
            )}
            {/* collapse scroll bar button */}
            {isFocusView && (
                <div className={`absolute left-1/2 -translate-x-full m-2
                    transition-all duration-300 ease-in-out
                    ${isScrollBarCollapsed ? 'bottom-0' : 'bottom-[15%]'}`}
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        className="bg-zinc-800/80 hover:bg-zinc-700/80 rounded-full h-8 w-8"
                        onClick={() => setIsScrollBarCollapsed(!isScrollBarCollapsed)}
                    >
                        {isScrollBarCollapsed ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}

export default CardsDisplay