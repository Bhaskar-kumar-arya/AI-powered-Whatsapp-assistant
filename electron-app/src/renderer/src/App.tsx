import React, { useState, useEffect } from 'react'
import './App.css'
import MainLayout from './components/MainLayout'
import Pane1_ChatList from './components/Pane1_ChatList'
import Pane2_Conversation from './components/Pane2_Conversation'
import Pane3_AIPanel from './components/Pane3_AIPanel'
import useStore, { Message, Chat } from './store'
import { getChatsForUI } from './api'

function App() {
  const [theme] = useState<'light' | 'dark'>('dark') // Default to dark mode
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isWhatsappReady, setIsWhatsappReady] = useState(false)
  const addMessage = useStore((state) => state.addMessage)
  const setChats = useStore((state) => state.setChats) // This line is not strictly needed as fetchChats will call setChats
  const fetchChats = useStore((state) => state.fetchChats)


  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    window.api.whatsapp.on('qr-code', (qrCodeDataUrl: string) => {
      console.log('QR Code received in renderer:', qrCodeDataUrl)
      setQrCode(qrCodeDataUrl)
    })

    window.api.whatsapp.on('whatsapp-ready', async () => {
      console.log('WhatsApp client is ready!')
      setIsWhatsappReady(true)
      setQrCode(null) // Clear QR code once ready
      await fetchChats() // Fetch chats when WhatsApp is ready
    })

    window.api.whatsapp.on('whatsapp-authenticated', () => {
      console.log('WhatsApp client authenticated!')
      setIsWhatsappReady(true)
      setQrCode(null) // Clear QR code once authenticated
    })

    window.api.whatsapp.on('whatsapp-auth-failure', (msg: string) => {
      console.error('WhatsApp authentication failed:', msg)
      setIsWhatsappReady(false)
      setQrCode(null) // Clear QR code on auth failure
      // Optionally, trigger a re-initialization or show an error message
    })

    window.api.whatsapp.on('whatsapp-disconnected', (reason: string) => {
      console.log('WhatsApp client disconnected:', reason)
      setIsWhatsappReady(false)
      setQrCode(null) // Clear QR code on disconnect
      // Optionally, trigger a re-initialization or show QR again
    })

    // Cleanup listeners on component unmount
    return () => {
      // Note: ipcRenderer.removeListener is not directly exposed via contextBridge.
      // For a more robust solution, you might need to expose a way to remove listeners
      // or ensure that the main process handles listener cleanup.
      // For this example, we'll rely on the main process to manage its listeners.
    }

    window.api.whatsapp.on('new-message', (chatId: string, message: Message) => {
      console.log('New message received in renderer:', chatId, message)
      addMessage(chatId, message)
    })

    return () => {
      // Consider implementing a cleanup mechanism if necessary
    }
  }, [addMessage, fetchChats])

  if (!isWhatsappReady && qrCode) {
    return (
      <div className="qr-code-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', backgroundColor: 'var(--app-bg)', color: 'var(--text-primary)' }}>
        <h1 style={{ color: 'var(--text-primary)' }}>Scan this QR code with your WhatsApp app</h1>
        <img src={qrCode} alt="WhatsApp QR Code" style={{ width: '300px', height: '300px' }} />
      </div>
    )
  }

  if (!isWhatsappReady && !qrCode) {
    return (
      <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--app-bg)', color: 'var(--text-primary)' }}>
        <h1 style={{ color: 'var(--text-primary)' }}>Initializing WhatsApp...</h1>
      </div>
    )
  }

  return (
    <div className="app-container">
      <MainLayout>
        <Pane1_ChatList />
        <Pane2_Conversation />
        <Pane3_AIPanel />
      </MainLayout>
    </div>
  )
}

export default App
