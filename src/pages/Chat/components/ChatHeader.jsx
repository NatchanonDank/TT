import React, { useState } from 'react';
import { ArrowLeft, X, Trash2, UserMinus } from 'lucide-react';
import './ChatHeader.css';

const ChatHeader = ({ 
  chat, 
  onBack, 
  onEndTrip,
  onLeaveGroup, 
  onDeleteGroup,
  onRemoveMember,
  isTripEnded,
  currentUser
}) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  const handleLeaveGroup = () => {
    setIsOptionsOpen(false);
    onLeaveGroup(); 
  };

  return (
    <>
      <div className="chat-header">    
        <div className="chat-options">
          <button onClick={handleToggleOptions}>⋮</button>
          {isOptionsOpen && (
            <div className="options-dropdown">
              <button onClick={handleOpenMembersModal}>
                👥 ดูรายชื่อสมาชิก
              </button>

              {isLeader ? (
                isTripEnded ? (
                  <button onClick={handleDeleteGroup} className="end-trip-btn">
                    <Trash2 size={16} style={{marginRight: '4px', display: 'inline'}}/> ลบกลุ่มแชท
                  </button>
                ) : (
                  <button onClick={() => { setIsOptionsOpen(false); onEndTrip(); }} className="end-trip-btn">
                    🏁 สิ้นสุดทริป
                  </button>
                )
              ) : (
                <button onClick={handleLeaveGroup} className="leave-group-btn">
                  ออกจากกลุ่ม
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatHeader;