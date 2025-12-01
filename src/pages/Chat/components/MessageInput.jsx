import React, { useRef } from 'react';
import { MapPin, Send, Image } from 'lucide-react'; 
import './MessageInput.css';

const MessageInput = ({ 
  messageInput, 
  onInputChange, 
  onSendMessage, 
  onOpenLocationModal, 
  onSendImage, 
  isTripEnded 
}) => {
  const fileInputRef = useRef(null);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 700 * 1024) {
        alert(`ไฟล์ ${file.name} ใหญ่เกินไป!\nกรุณาใช้รูปขนาดไม่เกิน 700KB`);
        e.target.value = null;
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        onSendImage(reader.result); 
      };
      reader.readAsDataURL(file);
      
      e.target.value = null; 
    }
  };

  return (
    <div className="input-container">
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
        disabled={isTripEnded}
      />

      <button 
        className="location-btn" 
        onClick={() => fileInputRef.current.click()}
        disabled={isTripEnded}
        title="ส่งรูปภาพ"
      >
        <Image size={20} />
      </button>

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