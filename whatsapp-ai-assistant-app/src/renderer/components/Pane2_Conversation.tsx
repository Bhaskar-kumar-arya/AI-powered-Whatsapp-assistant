import React, { useEffect } from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInputBox from './MessageInputBox';
import useStore from '../store';
import { getMessages } from '../api';

const Pane2_Conversation: React.FC = () => {
  const { chats, activeChatId, addMessage, setActiveChat } = useStore();
  const activeChat = chats.find(chat => chat.id === activeChatId);

  useEffect(() => {
    const fetchMessages = async () => {
      if (activeChatId) {
        const fetchedMessages = await getMessages(activeChatId);
        // Update the active chat's messages in the store
        useStore.setState((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === activeChatId ? { ...chat, messages: fetchedMessages } : chat
          ),
        }));
      }
    };
    fetchMessages();
  }, [activeChatId]); // Re-fetch messages when activeChatId changes

  const handleSendMessage = (text: string) => {
    if (activeChatId) {
      addMessage(activeChatId, text, 'me');
    }
  };

  return (
    <div className="pane2-conversation">
      <ChatHeader />
      <div className="message-list">
        {activeChat ? (
          activeChat.messages.map((message) => (
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