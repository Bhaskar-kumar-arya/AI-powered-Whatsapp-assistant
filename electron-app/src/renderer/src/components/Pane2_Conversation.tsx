import React, { useEffect, useCallback } from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInputBox from './MessageInputBox';
import useStore from '../store';
import { getMessages, sendMessage, onNewMessage } from '../api';
import { Chat, Message } from '../store'; // Import Chat and Message interfaces from the store

const Pane2_Conversation: React.FC = () => {
  const { chats, activeChatId, addMessage, setActiveChat, markChatAsRead } = useStore();
  const activeChat = chats.find((chat: Chat) => chat.id === activeChatId); // Type activeChat

  // Effect for fetching messages
  useEffect(() => {
    const fetchMessagesForActiveChat = async () => {
      if (activeChatId && activeChat && (!activeChat.messages || activeChat.messages.length === 0)) {
        const fetchedPreloadMessages = await getMessages(activeChatId);
        const fetchedMessages: Message[] = fetchedPreloadMessages.map(msg => ({
          ...msg,
          status: 'read' // Default status for fetched messages
        }));
        // Update the active chat's messages in the store
        useStore.setState((state) => ({
          chats: state.chats.map((chatItem: Chat) =>
            chatItem.id === activeChatId ? { ...chatItem, messages: fetchedMessages } : chatItem
          ),
        }));
      }
    };
    fetchMessagesForActiveChat();
  }, [activeChatId, activeChat]); // Re-fetch messages when activeChatId changes or activeChat updates

  // Effect for marking chat as read
  useEffect(() => {
    if (activeChatId) {
      markChatAsRead(activeChatId);
    }
  }, [activeChatId, markChatAsRead]);

  useEffect(() => {
    const handleNewMessage = (chatId: string, message: Message) => {
      console.log('New message received in renderer:', chatId, message);
      addMessage(chatId, { ...message, status: 'read' }); // Add to UI, assuming 'read' for incoming
    };

    const unsubscribe = onNewMessage(handleNewMessage);

    return () => {
      unsubscribe();
    };
  }, [addMessage]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (activeChatId) {
      const tempMessage: Message = {
        id: `temp-${Date.now()}`, // Temporary ID
        body: text,
        timestamp: Date.now() / 1000, // Unix timestamp
        fromMe: true,
        hasMedia: false,
        hasQuotedMsg: false,
        status: 'pending' // Custom status for messages being sent
      };
      addMessage(activeChatId, tempMessage); // Add to UI immediately

      try {
        await sendMessage(activeChatId, text);
        // Optionally, update the message status to 'sent' or 'delivered' if the API provides feedback
        // For now, we'll assume it's sent successfully.
      } catch (error) {
        console.error('Error sending message:', error);
        // Handle error, e.g., update message status to 'failed'
      }
    }
  }, [activeChatId, addMessage]);

  return (
    <div className="pane2-conversation">
      <ChatHeader />
      <div className="message-list">
        {activeChat && activeChat.messages ? (
          activeChat.messages.map((message: Message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        ) : (
          <div className="no-chat-selected">Select a chat to start messaging</div>
        )}
      </div>
      <MessageInputBox onSendMessage={handleSendMessage} />
    </div>
  );
};

export default Pane2_Conversation;