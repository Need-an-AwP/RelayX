import './App.css'
import { useEffect } from 'react'
import OnlinePeersDisplay from '@/components/OnlinePeersDisplay'
import TailscaleStatusDisplay from '@/components/TailscaleStatusDisplay'
import RTCConnectionDisplay from '@/components/RTCConnectionDisplay'
import { ThemeProvider } from '@/components/theme-provider'
import { initializeTailscaleListeners, initializeTURNListeners, useRTCStore } from '@/stores'


function App() {
    useEffect(() => {
        // receive tailscale status from electron main process
        initializeTailscaleListeners()
        // receive TURN info from electron main process
        initializeTURNListeners()

        // const checkInterval = setInterval(() => {
        // const { getAllConnections } = useRTCStore.getState()
        // console.log('getAllConnections @ app.tsx', getAllConnections())
        // }, 1000)

        // return () => {
        // clearInterval(checkInterval)
        // }
    }, [])

    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <OnlinePeersDisplay />
            <TailscaleStatusDisplay />

            <RTCConnectionDisplay />

        </ThemeProvider>
    )
}

export default App
