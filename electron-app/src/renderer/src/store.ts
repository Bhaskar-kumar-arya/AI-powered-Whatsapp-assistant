import { create } from 'zustand';
import { Chat as PreloadChat, Message as PreloadMessage } from '../../preload/index.d';

// Define types for your data, extending the preload types with UI-specific properties
export interface Message extends PreloadMessage {
  status: 'sent' | 'delivered' | 'read'; // Crucial for ticks
}

export interface Chat extends PreloadChat {
  messages: Message[]; // Override messages to use the extended Message type
  aiActivity?: 'draft' | 'task-pending';
}

interface AppState {
  chats: Chat[];
  activeChatId: string | null;
  theme: 'light' | 'dark';
  aiSummary: string | null; // New state for AI summary
  // Actions
  setActiveChat: (id: string) => void;
  markChatAsRead: (id: string) => void;
  updateMessageStatus: (chatId: string, messageId: string, status: 'delivered' | 'read') => void;
  toggleTheme: () => void;
  addMessage: (chatId: string, text: string, fromMe: boolean) => void;
  setAiSummary: (summary: string | null) => void; // New action to set AI summary
  setChats: (chats: Chat[]) => void; // New action to set chats
  fetchChats: () => Promise<void>; // New action to fetch chats
}

const useStore = create<AppState>((set) => ({
  chats: [], // Initial empty array for chats
  activeChatId: null,
  theme: 'light', // Default theme
  aiSummary: null, // Initial state for AI summary

  setActiveChat: (id: string) => set(() => ({ activeChatId: id })),
  markChatAsRead: (id: string) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === id ? { ...chat, unreadCount: 0 } : chat
      ),
    })),
  updateMessageStatus: (chatId: string, messageId: string, status: 'delivered' | 'read') =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: chat.messages.map((message) =>
                message.id === messageId ? { ...message, status } : message
              ),
            }
          : chat
      ),
    })),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),
  addMessage: (chatId: string, text: string, fromMe: boolean) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [
                ...chat.messages,
                {
                  id: `msg-${chatId}-${chat.messages.length + 1}`,
                  body: text,
                  timestamp: Date.now(),
                  fromMe,
                  hasMedia: false,
                  hasQuotedMsg: false,
                  status: fromMe ? 'sent' : 'read', // Default status for new messages
                },
              ],
            }
          : chat
      ),
    })),
  setAiSummary: (summary: string | null) => set(() => ({ aiSummary: summary })),
  setChats: (chats: Chat[]) => set(() => ({ chats })), // New action to set chats
  fetchChats: async () => {
    const { getChatsForUI } = await import('./api');
    const fetchedChats: PreloadChat[] = await getChatsForUI();
    const chatsWithUiState: Chat[] = fetchedChats.map(chat => ({
      ...chat,
      messages: chat.messages ? chat.messages.map(msg => ({ ...msg, status: 'read' })) : [], // Initialize status for existing messages, handle undefined messages
      aiActivity: undefined // Initialize aiActivity as undefined
    }));
    set(() => ({ chats: chatsWithUiState }));
  },
}));

export default useStore;