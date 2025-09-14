import "reflect-metadata";
import { app, shell, BrowserWindow, ipcMain, protocol } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initializeWhatsappClient, getChatPictureUrl, getChatsForUI, sendMessage, downloadMedia } from './whatsappClient'
import fs from 'fs'
import path from 'path'
import mime from 'mime'
import { initializeDatabase } from "./db";

let mainWindow: BrowserWindow | null = null
let clientInitialized = false

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Register a custom protocol to serve media files
  initializeDatabase()
  protocol.handle('whatsapp-media', async (request) => {
    const mediaFileName = request.url.replace('whatsapp-media://', '');
    const mediaPath = path.join(app.getPath('userData'), 'media', mediaFileName);
    console.log(`[Main Process] Custom protocol handler: Request for ${request.url}, mapping to local path: ${mediaPath}`);
    try {
      const data = await fs.promises.readFile(mediaPath);
      const mimeType = mime.getType(mediaPath) || 'application/octet-stream';
      console.log(`[Main Process] Custom protocol handler: Successfully read file ${mediaPath}, MIME type: ${mimeType}`);
      return new Response(new Blob([new Uint8Array(data)], { type: mimeType }));
    } catch (error) {
      console.error(`[Main Process] Custom protocol handler: Failed to serve media file ${mediaPath}:`, error);
      return new Response('File not found', { status: 404 });
    }
  })

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  // Initialize WhatsApp client
  if (mainWindow) {
    if (!clientInitialized) {
      initializeWhatsappClient(mainWindow)
      clientInitialized = true
    }
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })


  // Handle IPC call to get chat picture URL
  ipcMain.handle('whatsapp-get-chat-picture-url', async (_event, chatId: string) => {
    try {
      const url = await getChatPictureUrl(chatId)
      return url
    } catch (error) {
      console.error(`Error getting chat picture URL for ${chatId}:`, error)
      return undefined
    }
  })

  // Handle IPC call to get chats for UI
  ipcMain.handle('whatsapp-get-chats-for-ui', async () => {
    try {
      const chats = await getChatsForUI()
      return chats
    } catch (error) {
      console.error('Error getting chats for UI:', error)
      return []
    }
  })

  // Handle IPC call to send a message
  ipcMain.handle('whatsapp-send-message', async (_event, chatId: string, message: string) => {
    try {
      await sendMessage(chatId, message)
    } catch (error) {
      console.error(`Error sending message to ${chatId}:`, error)
    }
  })

  // Handle IPC call to download media
  // ipcMain.handle('whatsapp-download-media', async (_event, messageId: string) => {
  //   try {
  //     const mediaUrl = await downloadMedia(messageId)
  //     return mediaUrl
  //   } catch (error) {
  //     console.error(`Error downloading media for message ${messageId}:`, error)
  //     return undefined
  //   }
  // })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
