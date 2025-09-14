import React, { useEffect, useCallback, useRef } from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInputBox from './MessageInputBox';
import useStore from '../store';
import { getMessages, sendMessage, onNewMessage } from '../api';
import { Chat, Message } from '../store'; // Import Chat and Message interfaces from the store

const Pane2_Conversation: React.FC = () => {
  const { chats, activeChatId, addMessage, markChatAsRead } = useStore();
  const activeChat = chats.find((chat: Chat) => chat.id === activeChatId); // Type activeChat
  const messageListRef = useRef<HTMLDivElement>(null);

  // Effect for fetching messages
  useEffect(() => {
    const fetchMessagesForActiveChat = async () => {
      if (activeChatId && activeChat && (!activeChat.messages || activeChat.messages.length === 0)) {
        const fetchedPreloadMessages = await getMessages(activeChatId);
        const fetchedMessages: Message[] = fetchedPreloadMessages.map(msg => ({
          ...msg,
          status: 4 // Default status for fetched messages (4: READ)
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
      addMessage(chatId, { ...message, status: 4 }); // Add to UI, assuming 'read' for incoming (4: READ)
    };

    const unsubscribe = onNewMessage(handleNewMessage);

    return () => {
      unsubscribe();
    };
  }, [addMessage]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (activeChatId) {
      try {
        await sendMessage(activeChatId, text);
      } catch (error) {
        console.error('Error sending message:', error);
        // Handle error, e.g., update message status to 'failed'
      }
    }
  }, [activeChatId]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [activeChat?.messages]);

  return (
    <div className="pane2-conversation">
      <ChatHeader />
      <div className="message-list" ref={messageListRef}>
        {activeChat && activeChat.messages ? (
          activeChat.messages
            .filter((message: Message) => message.type) // Filter out messages with null or undefined type
            .map((message: Message) => (
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