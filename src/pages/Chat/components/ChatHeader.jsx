import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

const ChatHeader = ({ 
  chat, 
  onBack, 
  onEndTrip,
  isTripEnded,
  currentUser
}) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const handleToggleOptions = (e) => {
    e.stopPropagation();
    setIsOptionsOpen(prev => !prev);
  };

  const isLeader = currentUser?.uid === chat.ownerId;

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
      {isLeader && (
          <>
            <button onClick={handleToggleOptions}>⋮</button>
            {isOptionsOpen && (
              <div className="options-dropdown">
                <button 
                  onClick={() => {
                    setIsOptionsOpen(false);
                    if (isTripEnded) {
                      alert('ทริปนี้ได้สิ้นสุดไปแล้ว');
                    } else {
                      onEndTrip();
                    }
                  }} 
                  className="end-trip-btn"
                >
                  สิ้นสุดทริป
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;