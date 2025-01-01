import { useEffect } from 'react'
import './App.css'
import MainLayout from './MainLayout'
// import { initializeTailscaleListeners } from './stores/tailscaleStore'
// import { initializeBlankStreams } from './stores/blankStreamsStore'
import {
    initializeTailscaleListeners,
    initializeBlankStreams,
} from '@/stores'
import RTCService from './services/RTCService'
import SyncService from './services/SyncService'
import '@/stores/storeSync'


function App() {
    useEffect(() => {
        initializeTailscaleListeners()
        initializeBlankStreams()
        RTCService.getInstance()
        SyncService.getInstance()

        return () => { }
    }, [])


    return (
        <MainLayout />
    )
}

export default App
