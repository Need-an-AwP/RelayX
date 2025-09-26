import UserProfile from "./UserProfile"
import MicphoneSettings from "./MicphoneSettings"
import HeadphoneSettings from "./HeadphoneSettings"
import SettingPopover from "./SettingPopover"
import AudioCaptureSettings from "./AudioCaptureSettings"
import ActionPanel from "./ActionPanel"

export default function UserPanel() {
    return (
        <div className='flex flex-col p-2 px-4 bg-[#2d2d2d] rounded-lg mx-2 mb-2'>
            <ActionPanel />

            <div className="grid grid-cols-3 mt-2">
                <div className="col-span-2">
                    <UserProfile />
                </div>
                <div className="flex justify-end items-center">
                    <SettingPopover />
                </div>
            </div>

            <div className="flex justify-between pt-2">
                <div className="flex flex-row gap-4">
                    <MicphoneSettings />
                    <HeadphoneSettings />
                </div>

                <AudioCaptureSettings />
            </div>
        </div>
    )
}