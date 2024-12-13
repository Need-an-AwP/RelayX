import { useState } from 'react'
import './App.css'
import TitleBar from '@/components/TitleBar'
import { BackgroundBeams } from '@/components/ui/background-beams'
import { ThemeProvider } from "@/components/theme-provider"


function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <div className="flex flex-col h-screen w-screen">
                <TitleBar />
                <BackgroundBeams className='pointer-events-none' />
            </div>
        </ThemeProvider>
    )
}

export default App
