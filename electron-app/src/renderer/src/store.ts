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
  id: number;
  name: string;
  avatar: string;
  messages: Message[];
  unreadCount: number;
  aiActivity?: 'draft' | 'task-pending';
}

interface AppState {
  chats: Chat[];
  activeChatId: number | null;
  theme: 'light' | 'dark';
  aiSummary: string | null; // New state for AI summary
  // Actions
  setActiveChat: (id: number) => void;
  markChatAsRead: (id: number) => void;
  updateMessageStatus: (chatId: number, messageId: string, status: 'delivered' | 'read') => void;
  toggleTheme: () => void;
  addMessage: (chatId: number, text: string, sender: 'me' | 'other') => void;
  setAiSummary: (summary: string | null) => void; // New action to set AI summary
}

const useStore = create<AppState>((set) => ({
  chats: [], // Initial empty array for chats
  activeChatId: null,
  theme: 'light', // Default theme
  aiSummary: null, // Initial state for AI summary

  setActiveChat: (id: number) => set(() => ({ activeChatId: id })),
  markChatAsRead: (id: number) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === id ? { ...chat, unreadCount: 0 } : chat
      ),
    })),
  updateMessageStatus: (chatId: number, messageId: string, status: 'delivered' | 'read') =>
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
  addMessage: (chatId: number, text: string, sender: 'me' | 'other') =>
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
}));

export default useStore;