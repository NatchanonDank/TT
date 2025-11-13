import React from 'react';
import { ArrowLeft } from 'lucide-react';

const ChatHeader = ({ 
  chat, 
  onBack, 
  isOptionsOpen, 
  onToggleOptions, 
  onEndTrip 
}) => {
  return (
    <div className="chat-header">
      <button className="back-btn" onClick={onBack}>
        <ArrowLeft size={24} />
      </button>
      <img src={chat.avatar} alt={chat.name} className="chat-avatar" />
      <div className="chat-header-info">
        <h3>{chat.name}</h3>
        <p className="member-info">{chat.currentMembers}/{chat.maxMembers} คน</p>
      </div>

      <div className="chat-options">
        <button onClick={onToggleOptions}>⋮</button>
        {isOptionsOpen && (
          <div className="options-dropdown">
            <button onClick={onEndTrip} className="end-trip-btn">
              สิ้นสุดทริป
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;