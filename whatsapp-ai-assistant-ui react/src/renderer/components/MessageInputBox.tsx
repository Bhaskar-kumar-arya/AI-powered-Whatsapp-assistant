import React, { useState } from 'react';

interface MessageInputBoxProps {
  onSendMessage: (message: string) => void;
}

const MessageInputBox: React.FC<MessageInputBoxProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleAiButtonClick = () => {
    console.log('AI button clicked in input box');
  };

  return (
    <div className="message-input-box">
      <button className="ai-button" onClick={handleAiButtonClick}>
        ✨
      </button>
      <input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleSend();
          }
        }}
      />
      <button className="send-button" onClick={handleSend}>
        Send
      </button>
    </div>
  );
};

export default MessageInputBox;