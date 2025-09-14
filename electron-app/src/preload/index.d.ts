import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      whatsapp: {
        on: (channel: string, callback: (...args: any[]) => void) => void
        getChatPictureUrl: (chatId: string) => Promise<string | undefined>
        getChatsForUI: () => Promise<Chat[]>
        sendMessage: (chatId: string, message: string) => Promise<void>
        onNewMessage: (callback: (chatId: string, message: Message) => void) => () => void
        downloadMedia: (messageId: string) => Promise<{ mediaUrl: string; mediaMimeType: string } | undefined>
      }
    }
  }

  export interface Message {
    id: string;
    chatId: string;
    fromMe: boolean;
    senderId?: string;
    timestamp: number;
    pushName?: string | null;
    status?: number | null; // M0:ERROR, 1:PENDING, 2:SERVER_ACK, 3:DELIVERY_ACK, 4:READ, 5:PLAYED
    type: string; // contentType
    text: string | null;
    media?: {
      url?: string | null;
      mimetype?: string | null;
      thumbnail?: string | null;
    } | null;
    quoted?: {
      msgId?: string | null;
      senderId?: string | null;
      text?: string | null;
    } | null;
    mentions?: string[];
    reaction?: {
      emoji?: string | null;
      targetMsgId?: string | null;
      from?: string | null;
    } | null;
  }

  export interface Chat {
    id: string;
    name: string;
    isGroup: boolean;
    unreadCount: number;
    timestamp: number;
    lastMessage: Message | null;
    profilePicUrl?: string;
    isMuted: boolean;
    pinned: boolean;
    archived: boolean;
    messages: Message[];
    contactName?: string;
  }
}

export { Message, Chat }
