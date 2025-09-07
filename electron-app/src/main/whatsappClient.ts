import { app, BrowserWindow } from 'electron'
import { Client, LocalAuth } from 'whatsapp-web.js'
import qrcode from 'qrcode'

let client: Client | null = null
let clientReadyPromise: Promise<void>
let resolveClientReady: () => void

function createClientReadyPromise() {
  clientReadyPromise = new Promise((resolve) => {
    resolveClientReady = resolve
  })
}

createClientReadyPromise() // Initialize the promise when the script loads

export function initializeWhatsappClient(mainWindow: BrowserWindow): void {
  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true, // Set to false if you want to see the browser
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  })

  client.on('qr', async (qr) => {
    console.log('QR RECEIVED', qr)
    const qrCodeDataUrl = await qrcode.toDataURL(qr)
    mainWindow.webContents.send('qr-code', qrCodeDataUrl)
  })

  client.on('ready', async () => {
    console.log('Client is ready!')
    mainWindow.webContents.send('whatsapp-ready')
    resolveClientReady() // Resolve the promise when the client is ready
  })

  client.on('authenticated', (session) => {
    console.log('AUTHENTICATED', session)
    mainWindow.webContents.send('whatsapp-authenticated')
  })

  client.on('auth_failure', (msg) => {
    console.error('AUTHENTICATION FAILURE', msg)
    mainWindow.webContents.send('whatsapp-auth-failure', msg)
  })

  client.on('disconnected', async (reason) => {
    console.log('Client was disconnected', reason)
    mainWindow.webContents.send('whatsapp-disconnected', reason)
  })

  client.initialize()
}

export function getWhatsappClient(): Client | null {
  return client
}

export async function getAllChats() {
  await clientReadyPromise // Wait for the client to be ready
  if (!client) {
    throw new Error('Whatsapp client not initialized.')
  }
  return await client.getChats()
}

export async function getChatPictureUrl(chatId: string): Promise<string | undefined> {
  await clientReadyPromise
  if (!client) {
    throw new Error('Whatsapp client not initialized.')
  }
  try {
    return await client.getProfilePicUrl(chatId)
  } catch (error) {
    console.error(`Error fetching profile picture for chat ${chatId}:`, error)
    return undefined
  }
}