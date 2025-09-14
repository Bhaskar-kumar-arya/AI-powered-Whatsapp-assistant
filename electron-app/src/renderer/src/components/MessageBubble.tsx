import React, { useState } from 'react'; // useEffect is no longer needed here
import useStore, { Message } from '../store'; // Import useStore
import { downloadMedia } from '../api';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { text, fromMe, timestamp, status, media, mediaBlobUrl, id, senderId, pushName } = message;
  const senderClass = fromMe ? 'me' : 'other';
  const [showAiIcon, setShowAiIcon] = useState(false);
  const updateMessageMediaBlobUrl = useStore((state) => state.updateMessageMediaBlobUrl); // Get the action from the store
  const [downloadedMediaBlobUrl, setDownloadedMediaBlobUrl] = useState<string | undefined>(mediaBlobUrl ?? undefined); // Initialize from store, handle null
  const [downloadedMediaMimeType, setDownloadedMediaMimeType] = useState<string | undefined>(message.media?.mimetype ?? undefined);
  const hasMedia = !!media; // Derive hasMedia from message.media

  console.log('MessageBubble:', { id, hasMedia, mediaMimeType: downloadedMediaMimeType, downloadedMediaBlobUrl, text });

  const renderStatusTicks = () => {
    if (fromMe) {
      let tickClass = 'message-status-ticks';
      if (status === 4) { // READ
        tickClass += ' read';
      }
      return (
        <span className={tickClass}>
          {status === 2 && '✓'} {/* SERVER_ACK (sent) */}
          {(status === 3 || status === 4) && '✓✓'} {/* DELIVERY_ACK or READ */}
        </span>
      );
    }
    return null;
  };

  const handleAiIconClick = () => {
    console.log('AI icon clicked for message:', text);
  };

  const handleDownloadMedia = async () => {
    if (id) {
      const mediaData = await downloadMedia(id);
      if (mediaData) {
        setDownloadedMediaBlobUrl(mediaData.mediaBlobUrl);
        setDownloadedMediaMimeType(mediaData.mediaMimeType);
        // Update the message in the store with the downloaded mediaBlobUrl
        updateMessageMediaBlobUrl(message.chatId!, message.id!, mediaData.mediaBlobUrl);
      }
    }
  };

  const renderMediaContent = () => {
    if (!hasMedia) {
      if (!text && message.type === 'unknown') {
        return <p className="message-text">Unsupported message type</p>;
      }
      return <p className="message-text">{text}</p>;
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
      {!fromMe && pushName && (
        <div className="message-sender-info">
          {/* senderPic is not available in Message interface directly */}
          <span className="message-sender-name">{pushName}</span>
        </div>
      )}
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