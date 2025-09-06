// src/renderer/api.ts

import { Chat, Message } from './store'; // Assuming Chat and Message types are defined in store.ts

// Utility to simulate network latency
const simulateLatency = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Data (can be expanded as needed)
const mockChats: Chat[] = [
  {
    id: 1,
    name: 'Alice',
    avatar: 'https://i.pravatar.cc/150?img=1',
    messages: [
      { id: 'msg1', text: 'Hi!', timestamp: '10:28 AM', sender: 'other', status: 'read' },
      { id: 'msg2', text: 'Hello!', timestamp: '10:29 AM', sender: 'me', status: 'read' },
      { id: 'msg3', text: 'Hey there!', timestamp: '10:30 AM', sender: 'other', status: 'read' },
    ],
    unreadCount: 1,
  },
  {
    id: 2,
    name: 'Bob',
    avatar: 'https://i.pravatar.cc/150?img=2',
    messages: [
      { id: 'msg4', text: 'How are you?', timestamp: 'Yesterday', sender: 'other', status: 'read' },
      { id: 'msg5', text: 'Good, thanks!', timestamp: 'Yesterday', sender: 'me', status: 'read' },
      { id: 'msg6', text: 'See you later!', timestamp: 'Yesterday', sender: 'other', status: 'read' },
    ],
    unreadCount: 0,
  },
  {
    id: 3,
    name: 'Project Team',
    avatar: 'https://i.pravatar.cc/150?img=3',
    messages: [
      { id: 'msg7', text: 'Meeting at 3 PM', timestamp: '09/01/2025', sender: 'other', status: 'read' },
      { id: 'msg8', text: 'Got it!', timestamp: '09/01/2025', sender: 'other', status: 'read' },
      { id: 'msg9', text: 'Will be there.', timestamp: '09/01/2025', sender: 'me', status: 'read' },
    ],
    unreadCount: 3,
  },
];

// Helper to extract messages from mockChats for getMessages
const getMessagesFromMockChats = (chatId: number): Message[] => {
  const chat = mockChats.find(c => c.id === chatId);
  return chat ? chat.messages : [];
};

// Mock AI Responses
const mockAiSummaries: { [chatId: number]: string } = {
  1: 'This chat is a short greeting exchange between Alice and you.',
  2: 'This chat is a brief conversation with Bob about how you are doing.',
  3: 'This chat is about a project team meeting scheduled for 3 PM.',
};


/**
 * Mocks fetching a list of chats.
 */
export const getChats = async (): Promise<Chat[]> => {
  await simulateLatency();
  return mockChats;
};

/**
 * Mocks fetching messages for a specific chat.
 */
export const getMessages = async (chatId: number): Promise<Message[]> => {
  await simulateLatency();
  return getMessagesFromMockChats(chatId);
};

/**
 * Mocks an AI summary generation.
 */
export const getAiSummary = async (chatId: number): Promise<string> => {
  await simulateLatency(1500); // Longer latency for AI processing
  return mockAiSummaries[chatId] || 'No summary available for this chat.';
};

/**
 * Mocks sending a message to the Co-pilot AI and simulating tool use.
 */
export const sendCoPilotMessage = async (prompt: string): Promise<{ type: 'text' | 'tool_use', content: string | { tool: string, args: any }[] }> => {
  await simulateLatency(1000);

  if (prompt.toLowerCase().includes('summarize')) {
    // Simulate tool use for summarization
    return {
      type: 'tool_use',
      content: [{ tool: 'summarizeChat', args: { chat: 'current chat' } }]
    };
  } else if (prompt.toLowerCase().includes('task')) {
    // Simulate tool use for creating a task
    return {
      type: 'tool_use',
      content: [{ tool: 'createTask', args: { taskDetails: 'send report' } }]
    };
  } else {
    // Regular AI response
    return {
      type: 'text',
      content: `AI Mock Response to: "${prompt}". I can help with summaries or tasks!`
    };
  }
};

/**
 * Mocks creating a task.
 */
export const createTask = async (taskDetails: string): Promise<string> => {
  await simulateLatency();
  console.log('Mock: Creating task:', taskDetails);
  return `Task "${taskDetails}" created successfully.`;
};

/**
 * Mocks scheduling a message.
 */
export const scheduleMessage = async (chatId: string, message: string, time: string): Promise<string> => {
  await simulateLatency();
  console.log('Mock: Scheduling message:', { chatId, message, time });
  return `Message "${message}" scheduled for ${time} in chat ${chatId}.`;
};

/**
 * Mocks creating a calendar event.
 */
export const createCalendarEvent = async (title: string, date: string, attendees: string[]): Promise<string> => {
  await simulateLatency();
  console.log('Mock: Creating calendar event:', { title, date, attendees });
  return `Calendar event "${title}" created for ${date} with attendees ${attendees.join(', ')}.`;
};