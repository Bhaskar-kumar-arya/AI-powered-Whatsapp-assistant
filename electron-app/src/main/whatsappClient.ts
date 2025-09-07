import { app, BrowserWindow } from 'electron'
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js'
import qrcode from 'qrcode'
import fs from 'fs'
import path from 'path'
import mime from 'mime'

const mediaDir = path.join(app.getPath('userData'), 'media')
if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir)
}

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
  
  client.on('message', async (msg) => {
    console.log('New message received:', msg.body)

    const chat = await msg.getChat()
    console.log('From chat:', chat.name)

    const mappedMessage: Message = {
      id: msg.id._serialized,
      body: msg.body,
      timestamp: msg.timestamp,
      fromMe: msg.fromMe,
      hasMedia: msg.hasMedia,
      hasQuotedMsg: msg.hasQuotedMsg,
      mediaUrl: undefined,
      mediaMimeType: msg.hasMedia ? msg.type : undefined
    }
    mainWindow.webContents.send('new-message', chat.id._serialized, mappedMessage)
  })

  client.initialize();
}

export async function sendMessage(chatId: string, message: string): Promise<void> {
  await clientReadyPromise;
  if (!client) {
    throw new Error('Whatsapp client not initialized.');
  }
  await client.sendMessage(chatId, message);
}

export function getWhatsappClient(): Client | null {
  return client;
}

import { Message, Chat } from '../preload/index.d'

export async function getChatsForUI(): Promise<Chat[]> {
  await clientReadyPromise // Wait for the client to be ready
  if (!client) {
    throw new Error('Whatsapp client not initialized.')
  }

  const chats = await client.getChats()
  const sortedChats = chats.sort((a, b) => b.timestamp - a.timestamp) // Sort by most recent activity
  const top25Chats = sortedChats.slice(0, 25)

  const chatsWithMetadata = await Promise.all(
    top25Chats.map(async (chat) => {
      const messages = await chat.fetchMessages({ limit: 20 }) // Fetch messages for each chat
      const contact = await chat.getContact()
      const profilePicUrl = await contact.getProfilePicUrl()

      const mappedMessages: Message[] = messages.map((msg) => ({
        id: msg.id._serialized,
        body: msg.body,
        timestamp: msg.timestamp,
        fromMe: msg.fromMe,
        hasMedia: msg.hasMedia,
        hasQuotedMsg: msg.hasQuotedMsg,
        mediaUrl: undefined,
        mediaMimeType: msg.hasMedia ? msg.type : undefined
      }))

      const lastMessage = chat.lastMessage ? {
        id: chat.lastMessage.id._serialized,
        body: chat.lastMessage.body,
        timestamp: chat.lastMessage.timestamp,
        fromMe: chat.lastMessage.fromMe,
        hasMedia: chat.lastMessage.hasMedia,
        hasQuotedMsg: chat.lastMessage.hasQuotedMsg
      } : null

      return {
        id: chat.id._serialized,
        name: chat.name,
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount,
        timestamp: chat.timestamp,
        lastMessage: lastMessage,
        profilePicUrl: profilePicUrl,
        isMuted: chat.isMuted,
        pinned: chat.pinned,
        archived: chat.archived,
        messages: mappedMessages, // Add messages array
        contactName: chat.isGroup ? chat.name : (contact.name || contact.pushname || chat.id._serialized)
      }
      
    })
  )
  return chatsWithMetadata
}

export async function downloadMedia(messageId: string): Promise<{ mediaUrl: string; mediaMimeType: string } | undefined> {
  await clientReadyPromise
  if (!client) {
    throw new Error('Whatsapp client not initialized.')
  }
  try {
    const message = await client.getMessageById(messageId)
    if (message && message.hasMedia) {
      const media = await message.downloadMedia()
      if (media) {
        const fileExtension = mime.getExtension(media.mimetype);
        const mediaFileName = `${message.id.id}.${fileExtension}`;
        const mediaPath = path.join(mediaDir, mediaFileName);
        const buffer = Buffer.from(media.data, 'base64');
        fs.writeFileSync(mediaPath, buffer);
        console.log(`[Main Process] downloadMedia: Media saved to ${mediaPath} with MIME type ${media.mimetype}`);
        const dataUrl = `data:${media.mimetype};base64,${media.data}`;
        console.log(`[Main Process] downloadMedia: Returning dataUrl (truncated): ${dataUrl.substring(0, 100)}..., mediaMimeType: ${media.mimetype}`);
        return { mediaUrl: dataUrl, mediaMimeType: media.mimetype };
      }
    }
  } catch (error) {
    console.error(`Error downloading media for message ${messageId}:`, error)
  }
  return undefined
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