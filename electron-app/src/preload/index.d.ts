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
    chatId: string; // Add chatId to Message interface
    body: string;
    timestamp: number;
    fromMe: boolean;
    hasMedia: boolean;
    hasQuotedMsg: boolean;
    status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
    mediaUrl?: string;
    mediaMimeType?: string; // Make mediaMimeType optional
    senderName?: string;
    senderPic?: string;
  }

  export interface Chat {
    id: string;
    name: string;
    isGroup: boolean;
    unreadCount: number;
    timestamp: number;
    lastMessage: Message | null;
    profilePicUrl: string | undefined;
    isMuted: boolean;
    pinned: boolean;
    archived: boolean;
    messages: Message[]; // Add messages array
    contactName?: string; // Add contactName
  }
}

export { Message, Chat }
