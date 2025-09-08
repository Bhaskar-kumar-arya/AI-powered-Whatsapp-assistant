import React, { useState } from 'react'; // useEffect is no longer needed here
import useStore, { Message } from '../store'; // Import useStore
import { downloadMedia } from '../api';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { body, fromMe, timestamp, status, hasMedia, mediaMimeType, id, senderName, senderPic } = message;
  const senderClass = fromMe ? 'me' : 'other';
  const [showAiIcon, setShowAiIcon] = useState(false);
  const updateMessageMediaBlobUrl = useStore((state) => state.updateMessageMediaBlobUrl); // Get the action from the store
  const [downloadedMediaBlobUrl, setDownloadedMediaBlobUrl] = useState<string | undefined>(message.mediaBlobUrl); // Initialize from store
  const [downloadedMediaMimeType, setDownloadedMediaMimeType] = useState<string | undefined>(message.mediaMimeType);

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
        // Update the message in the store with the downloaded mediaBlobUrl
        updateMessageMediaBlobUrl(message.chatId!, message.id!, mediaData.mediaBlobUrl);
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
      {!fromMe && senderName && (
        <div className="message-sender-info">
          {senderPic && <img src={senderPic} alt={senderName} className="message-sender-avatar" />}
          <span className="message-sender-name">{senderName}</span>
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