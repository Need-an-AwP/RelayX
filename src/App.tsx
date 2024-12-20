import { useEffect } from 'react'
import './App.css'
import MainLayout from './MainLayout'
// import { initializeTailscaleListeners } from './stores/tailscaleStore'
// import { initializeBlankStreams } from './stores/blankStreamsStore'
import { initializeTailscaleListeners, initializeBlankStreams } from './stores'
import RTCService from './services/RTCService'


function App() {
    useEffect(() => {
        initializeTailscaleListeners()
        initializeBlankStreams()

        RTCService.getInstance()
        
        return () => {

        }
    }, [])

    
    return (
        <MainLayout />
    )
}

export default App
