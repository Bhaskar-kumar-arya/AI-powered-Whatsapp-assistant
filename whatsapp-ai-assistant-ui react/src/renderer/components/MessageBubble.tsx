import React, { useState } from 'react';

interface MessageBubbleProps {
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read'; // Added status prop
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ text, sender, timestamp, status }) => {
  const [showAiIcon, setShowAiIcon] = useState(false);

  const renderStatusTicks = () => {
    if (sender === 'me') {
      let tickClass = 'message-status-ticks';
      if (status === 'read') {
        tickClass += ' read';
      }
      return (
        <span className={tickClass}>
          {status === 'sent' && '✓'}
          {(status === 'delivered' || status === 'read') && '✓✓'}
        </span>
      );
    }
    return null;
  };

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
      <div className="message-metadata">
        <span className="message-timestamp">{timestamp}</span>
        {renderStatusTicks()}
      </div>
      {showAiIcon && (
        <span className="ai-icon" onClick={handleAiIconClick}>
          ✨
        </span>
      )}
    </div>
  );
};

export default MessageBubble;