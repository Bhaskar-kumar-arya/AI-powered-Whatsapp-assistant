import React from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInputBox from './MessageInputBox';
import useStore from '../store';

const Pane2_Conversation: React.FC = () => {
  const { chats, activeChatId, addMessage } = useStore();
  const activeChat = chats.find(chat => chat.id === activeChatId);

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