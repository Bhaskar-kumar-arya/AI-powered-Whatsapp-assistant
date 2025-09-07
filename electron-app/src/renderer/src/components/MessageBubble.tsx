import React, { useState } from 'react';
import { Message } from '../store';
import { downloadMedia } from '../api';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { body, fromMe, timestamp, status, hasMedia, mediaMimeType, id } = message;
  const senderClass = fromMe ? 'me' : 'other';
  const [showAiIcon, setShowAiIcon] = useState(false);
  const [downloadedMediaUrl, setDownloadedMediaUrl] = useState<string | undefined>(message.mediaUrl);
  const [downloadedMediaMimeType, setDownloadedMediaMimeType] = useState<string | undefined>(message.mediaMimeType);

  console.log('MessageBubble:', { id, hasMedia, mediaMimeType, downloadedMediaUrl, body });

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

  const handleDownloadMedia = async () => {
    if (id) {
      const mediaData = await downloadMedia(id);
      if (mediaData) {
        setDownloadedMediaUrl(mediaData.mediaUrl);
        setDownloadedMediaMimeType(mediaData.mediaMimeType);
      }
    }
  };

  const renderMediaContent = () => {
    if (!hasMedia) {
      return <p className="message-text">{body}</p>;
    }

    if (downloadedMediaUrl) {
      console.log('Displaying media:', { downloadedMediaUrl, downloadedMediaMimeType });
      if (downloadedMediaMimeType?.startsWith('image')) {
        return <img src={downloadedMediaUrl} alt="media" className="message-media-image" />;
      } else if (downloadedMediaMimeType?.startsWith('video')) {
        return (
          <video controls src={downloadedMediaUrl} className="message-media-video">
            Your browser does not support the video tag.
          </video>
        );
      } else {
        return <p className="message-text">Attachment: {downloadedMediaMimeType}</p>;
      }
    } else if (hasMedia) { // Only show placeholder if hasMedia is true and not yet downloaded
      console.log('Displaying media placeholder for:', { id, downloadedMediaMimeType });
      return (
        <div className="media-placeholder">
          <p>Media available</p>
          <button onClick={handleDownloadMedia}>Download</button>
        </div>
      );
    } else {
      return (
        <div className="media-placeholder">
          <p>Media available</p>
          <button onClick={handleDownloadMedia}>Download</button>
        </div>
      );
    }
  };

  return (
    <div
      className={`message-bubble ${senderClass}`}
      onMouseEnter={() => setShowAiIcon(true)}
      onMouseLeave={() => setShowAiIcon(false)}
    >
      {renderMediaContent()}
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