import React, { useState } from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInputBox from './MessageInputBox';

interface Message {
  id: number;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
}

const Pane2_Conversation: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Hi there!', sender: 'other', timestamp: '10:00 AM' },
    { id: 2, text: 'Hello! How are you?', sender: 'me', timestamp: '10:01 AM' },
    { id: 3, text: 'I am good, thanks! How about you?', sender: 'other', timestamp: '10:05 AM' },
    { id: 4, text: 'I am doing great!', sender: 'me', timestamp: '10:07 AM' },
  ]);

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: messages.length + 1,
      text,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <div className="pane2-conversation">
      <ChatHeader />
      <div className="message-list">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            text={message.text}
            sender={message.sender}
            timestamp={message.timestamp}
          />
        ))}
      </div>
      <MessageInputBox onSendMessage={handleSendMessage} />
    </div>
  );
};

export default Pane2_Conversation;