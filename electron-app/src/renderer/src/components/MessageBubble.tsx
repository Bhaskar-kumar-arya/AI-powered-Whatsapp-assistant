import React, { useState } from 'react';
import { Message } from '../store';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { body, fromMe, timestamp, status } = message;
  const senderClass = fromMe ? 'me' : 'other';
  const [showAiIcon, setShowAiIcon] = useState(false);

  const renderStatusTicks = () => {
    if (fromMe) {
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
    console.log('AI icon clicked for message:', body);
  };

  return (
    <div
      className={`message-bubble ${senderClass}`}
      onMouseEnter={() => setShowAiIcon(true)}
      onMouseLeave={() => setShowAiIcon(false)}
    >
      <p className="message-text">{body}</p>
      <div className="message-metadata">
        <span className="message-timestamp">{new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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