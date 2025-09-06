import React, { useState } from 'react';

interface MessageBubbleProps {
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ text, sender, timestamp }) => {
  const [showAiIcon, setShowAiIcon] = useState(false);

  const handleAiIconClick = () => {
    console.log('AI icon clicked for message:', text);
  };

  return (
    <div
      className={`message-bubble ${sender}`}
      onMouseEnter={() => setShowAiIcon(true)}
      onMouseLeave={() => setShowAiIcon(false)}
    >
      <p className="message-text">{text}</p>
      <span className="message-timestamp">{timestamp}</span>
      {showAiIcon && (
        <span className="ai-icon" onClick={handleAiIconClick}>
          ✨
        </span>
      )}
    </div>
  );
};

export default MessageBubble;