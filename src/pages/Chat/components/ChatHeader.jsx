import React, { useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import './ChatHeader.css';

const ChatHeader = ({ 
  chat, 
  onBack, 
  onEndTrip,
  onLeaveGroup, // ✅ เพิ่ม prop ใหม่
  isTripEnded,
  currentUser
}) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  const handleToggleOptions = (e) => {
    e.stopPropagation();
    setIsOptionsOpen(prev => !prev);
  };

  const isLeader = currentUser?.uid === chat.ownerId;

  const handleOpenMembersModal = () => {
    setIsMembersModalOpen(true);
  };

  const handleCloseMembersModal = () => {
    setIsMembersModalOpen(false);
  };

  // ✅ ฟังก์ชันออกจากกลุ่ม
  const handleLeaveGroup = () => {
    setIsOptionsOpen(false);
    if (window.confirm('คุณต้องการออกจากกลุ่มนี้ใช่หรือไม่?')) {
      onLeaveGroup();
    }
  };

  return (
    <>
      <div className="chat-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <img src={chat.avatar} alt={chat.name} className="chat-avatar" />
        <div className="chat-header-info">
          <h3>{chat.name}</h3>
          <p 
            className="member-info clickable" 
            onClick={handleOpenMembersModal}
          >
            {chat.currentMembers}/{chat.maxMembers} คน
          </p>
        </div>
        <div className="chat-options">
          <button onClick={handleToggleOptions}>⋮</button>
          {isOptionsOpen && (
            <div className="options-dropdown">
              {isLeader ? (
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
                  🏁 สิ้นสุดทริป
                </button>
              ) : (
                <button 
                  onClick={handleLeaveGroup}
                  className="leave-group-btn"
                >
                  ออกจากกลุ่ม
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {isMembersModalOpen && (
        <div className="members-modal-overlay" onClick={handleCloseMembersModal}>
          <div className="members-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="members-modal-header">
              <h3>สมาชิกในกลุ่ม</h3>
              <button className="close-modal-btn" onClick={handleCloseMembersModal}>
                <X size={24} />
              </button>
            </div>
            
            <div className="members-count-badge">
              {chat.currentMembers}/{chat.maxMembers} คน
            </div>

            <div className="members-list">
              {chat.members && chat.members.length > 0 ? (
                chat.members.map((member, index) => (
                  <div key={index} className="member-item">
                    <img 
                      src={member.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                      alt={member.name} 
                      className="member-avatar"
                    />
                    <div className="member-info-detail">
                      <p className="member-name">{member.name || 'สมาชิก'}</p>
                      {index === 0 && <span className="leader-badge">👑 Leader</span>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-members">ยังไม่มีสมาชิก</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatHeader;