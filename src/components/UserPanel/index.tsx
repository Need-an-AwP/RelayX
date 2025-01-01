import InVoiceChannelPanel from './inVoiceChannelPanel'
import UserProfile from './UserProfile'
import MicphoneSettings from './MicphoneSettings'
import HeadphoneSettings from './HeadphoneSettings'
import AudioCaptureSettings from './AudioCaptureSettings'
import SettingPopover from './SettingPopover'

const UserPanel = () => {
    return (
        <div className='flex flex-col p-2'>

            <InVoiceChannelPanel />

            <UserProfile />

            <div className="flex justify-between pt-2">
                <MicphoneSettings />

                <HeadphoneSettings />

                <AudioCaptureSettings />

                <SettingPopover />
            </div>
        </div>
    )
}

export default UserPanel