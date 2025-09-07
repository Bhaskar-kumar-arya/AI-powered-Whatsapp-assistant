import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      whatsapp: {
        on: (channel: string, callback: (...args: any[]) => void) => void
        getChatPictureUrl: (chatId: string) => Promise<string | undefined>
        getChatsForUI: () => Promise<any[]>
      }
    }
  }
}
