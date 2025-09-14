import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  whatsapp: {
    on: (channel: string, callback: (...args: unknown[]) => void) => {
      ipcRenderer.on(channel, (_event, ...args) => callback(...args))
    },
    getAllChats: () => ipcRenderer.invoke('whatsapp-get-chats'),
    getChatPictureUrl: (chatId: string) => ipcRenderer.invoke('whatsapp-get-chat-picture-url', chatId),
    getChatsForUI: () => ipcRenderer.invoke('whatsapp-get-chats-for-ui'),
    sendMessage: (chatId: string, message: string) => ipcRenderer.invoke('whatsapp-send-message', chatId, message),
    downloadMedia: (messageId: string) => ipcRenderer.invoke('whatsapp-download-media', messageId),
    onNewMessage: (callback: (chatId: string, message: any) => void) => {
      const handler = (_event, chatId, message) => callback(chatId, message);
      ipcRenderer.on('new-message', handler);
      return () => {
        ipcRenderer.removeListener('new-message', handler);
      };
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
