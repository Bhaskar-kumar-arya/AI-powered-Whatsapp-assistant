import React, { useState, useEffect } from 'react';
import { Message } from '../store';
import { downloadMedia } from '../api';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { body, fromMe, timestamp, status, hasMedia, mediaMimeType, id } = message;
  const senderClass = fromMe ? 'me' : 'other';
  const [showAiIcon, setShowAiIcon] = useState(false);
  const [downloadedMediaBlobUrl, setDownloadedMediaBlobUrl] = useState<string | undefined>(undefined); // This will store the object URL
  const [downloadedMediaMimeType, setDownloadedMediaMimeType] = useState<string | undefined>(message.mediaMimeType);

  // No longer need to create object URL in renderer, main process provides data URL directly

  console.log('MessageBubble:', { id, hasMedia, mediaMimeType, downloadedMediaBlobUrl, body });

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
        setDownloadedMediaBlobUrl(mediaData.mediaBlobUrl);
        setDownloadedMediaMimeType(mediaData.mediaMimeType);
      }
    }
  };

  const renderMediaContent = () => {
    if (!hasMedia) {
      return <p className="message-text">{body}</p>;
    }

    if (downloadedMediaBlobUrl) {
      console.log('MessageBubble: Attempting to display media with Blob URL:', { downloadedMediaBlobUrl, downloadedMediaMimeType });
      if (downloadedMediaMimeType?.startsWith('image')) {
        return <img src={downloadedMediaBlobUrl} alt="media" className="message-media-image" />;
      } else if (downloadedMediaMimeType?.startsWith('video')) {
        console.log('MessageBubble: Rendering video tag with Blob URL src:', downloadedMediaBlobUrl);
        return (
          <video controls src={downloadedMediaBlobUrl} className="message-media-video">
            Your browser does not support the video tag.
          </video>
        );
      } else if (downloadedMediaMimeType) {
        console.log('MessageBubble: Unknown media type, displaying as attachment:', downloadedMediaMimeType);
        return <p className="message-text">Attachment: {downloadedMediaMimeType}</p>;
      } else {
        return (
          <div className="media-placeholder">
            <p>Media available</p>
            <button onClick={handleDownloadMedia}>Download</button>
          </div>
        );
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