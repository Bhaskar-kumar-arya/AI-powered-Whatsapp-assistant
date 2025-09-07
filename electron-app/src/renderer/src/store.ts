import { create } from 'zustand';

// Define types for your data
export interface Message {
  id: string;
  text: string;
  timestamp: string;
  sender: 'me' | 'other';
  status: 'sent' | 'delivered' | 'read'; // Crucial for ticks
}

export interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  unreadCount: number;
  timestamp: number;
  lastMessage: {
    id: string;
    body: string;
    timestamp: number;
    fromMe: boolean;
    hasMedia: boolean;
    hasQuotedMsg: boolean;
  } | null;
  profilePicUrl: string | undefined;
  isMuted: boolean;
  pinned: boolean;
  archived: boolean;
  messages: Message[]; // Keep messages for conversation view
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
  addMessage: (chatId: string, text: string, sender: 'me' | 'other') => void;
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
  addMessage: (chatId: string, text: string, sender: 'me' | 'other') =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [
                ...chat.messages,
                {
                  id: `msg-${chatId}-${chat.messages.length + 1}`,
                  text,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  sender,
                  status: sender === 'me' ? 'sent' : 'read', // Default status for new messages
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
    const fetchedChats = await getChatsForUI();
    const chatsWithMessages = fetchedChats.map(chat => ({
      ...chat,
      messages: [], // Initialize with empty messages array
      aiActivity: undefined // Initialize aiActivity as undefined
    }));
    set(() => ({ chats: chatsWithMessages }));
  },
}));

export default useStore;