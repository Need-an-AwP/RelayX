import React, { useState } from "react"
import ThumbnailCard from "./thumbnailCard"
import type { User } from "@/types"


interface BottomScrollBarProps {
    members: User[]
    handleMember: (member: User) => { hasVideo: boolean }
    setFocusedMember: (member: { member: User, isVideo: boolean }) => void
    isScrollBarCollapsed: boolean
}

const BottomScrollBar = ({ members, handleMember, setFocusedMember, isScrollBarCollapsed }: BottomScrollBarProps) => {

    return (
        <div
            style={{ scrollbarGutter: 'stable' }}
            className={`absolute z-40 bottom-0 left-0 w-full h-[15%]
                    flex flex-row gap-2 p-2 justify-center items-center overflow-x-auto overflow-y-hidden
                    bg-white/5 backdrop-blur-[2px] transition-all duration-300 ease-in-out
                    ${isScrollBarCollapsed ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
        >
            {members.map((member) => {
                const { hasVideo } = handleMember(member)
                return (
                    <React.Fragment key={member.id}>
                        <ThumbnailCard
                            member={member}
                            type="audio"
                            onClick={() => setFocusedMember({ member, isVideo: false })}
                        />
                        {hasVideo && (
                            <ThumbnailCard
                                member={member}
                                type="video"
                                onClick={() => setFocusedMember({ member, isVideo: true })}
                            />
                        )}
                    </React.Fragment>
                )
            })}
            
        </div>
    )
}

export default BottomScrollBar