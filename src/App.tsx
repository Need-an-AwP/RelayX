import { useEffect } from 'react'
import './App.css'
import MainLayout from './MainLayout'
// import { initializeTailscaleListeners } from './stores/tailscaleStore'
// import { initializeBlankStreams } from './stores/blankStreamsStore'
import {
    initializeTailscaleListeners,
    initializeBlankStreams,
    initialAudioDevices,
    initializeAudioProcessing
} from '@/stores'
import RTCService from './services/RTCService'
import SyncService from './services/SyncService'
import AudioStreamController from './services/controllers/AudioStreamController'
import ScreenShareController from './services/controllers/ScreenShareController'
import '@/stores/storeSync'


function App() {
    useEffect(() => {
        // receive tailscale status from electron main process
        initializeTailscaleListeners()
        // create blank streams for establishing rtc connections
        initializeBlankStreams()
        // Start rtc connection attempt service
        RTCService.getInstance()
        // init mirror store
        SyncService.getInstance()
        // init remote audio streams player
        AudioStreamController.getInstance()
        // init screen share controller
        ScreenShareController.getInstance()
        // audio process
        initialAudioDevices()
        initializeAudioProcessing()

        return () => { }
    }, [])


    return (
        <MainLayout />
    )
}

export default App
