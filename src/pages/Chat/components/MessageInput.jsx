import React from 'react';
import { MapPin, Send } from 'lucide-react';
import './MessageInput.css';

const MessageInput = ({ 
  messageInput, 
  onInputChange, 
  onSendMessage, 
  onOpenLocationModal, 
  isTripEnded 
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="input-container">
      <button 
        className="location-btn" 
        onClick={onOpenLocationModal}
        disabled={isTripEnded}
      >
        <MapPin size={20} />
      </button>
      <input
        type="text"
        className="message-input"
        placeholder={isTripEnded ? "ทริปนี้จบแล้ว" : "พิมพ์ข้อความ..."}
        value={messageInput}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={isTripEnded}
      />
      <button
        className="send-btn"
        onClick={onSendMessage}
        disabled={!messageInput.trim() || isTripEnded}
      >
        <Send size={20} />
      </button>
    </div>
  );
};

export default MessageInput;