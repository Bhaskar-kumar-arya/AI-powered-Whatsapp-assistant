import React, { useState } from 'react';
import { Message } from '../store';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { text, sender, timestamp, status } = message;
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