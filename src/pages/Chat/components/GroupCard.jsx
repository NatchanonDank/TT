import React, { useState } from 'react';
import { Users, MoreVertical, X, LogOut, Flag, Trash2 } from 'lucide-react'; // ✅ เพิ่ม Trash2
import './GroupCard.css';

const GroupCard = ({ 
  group, 
  onChatClick, 
  isActive, 
  currentUser, 
  onEndTrip, 
  onLeaveGroup,
  onDeleteGroup 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  const isLeader = currentUser?.uid === group.ownerId;
  const isEnded = group.status === 'ended';

  const handleToggleMenu = (e) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleOpenMembers = (e) => {
    e.stopPropagation();
    setIsMembersModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleEndTripClick = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onEndTrip(group);
  };

  const handleLeaveGroupClick = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onLeaveGroup(group);
  };

  const handleDeleteGroupClick = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onDeleteGroup(group);
  };

  const closeMembersModal = (e) => {
    if (e) e.stopPropagation();
    setIsMembersModalOpen(false);
  };

  return (
    <>
      <div 
        className={`group-card ${group.unread > 0 ? 'group-unread-card' : ''} ${isEnded ? 'ended' : ''} ${isActive ? 'active' : ''}`} 
        onClick={() => onChatClick(group)}
      >
        <div className="group-card-avatar">
          <img 
            src={group.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
            alt={group.name} 
          />
          {group.unread > 0 && <span className="unread-badge">{group.unread}</span>}
        </div>
        
        <div className="group-card-info">
          <div className="group-card-top">
            <h3 className="group-name">{group.name}</h3>
            
            <div className="group-card-options">
                <button className="options-trigger" onClick={handleToggleMenu}>
                    <MoreVertical size={16} />
                </button>
                
                {isMenuOpen && (
                    <div className="group-dropdown-menu">
                        <button onClick={handleOpenMembers}>👥 ดูรายชื่อสมาชิก</button>
                        
                        {isLeader ? (
                            isEnded ? (
                                <button onClick={handleDeleteGroupClick} className="danger-option">
                                    <Trash2 size={14} style={{marginRight:4}}/> ลบกลุ่มแชท
                                </button>
                            ) : (
                                <button onClick={handleEndTripClick} className="danger-option">
                                    🏁 สิ้นสุดทริป
                                </button>
                            )
                        ) : (
                            <button onClick={handleLeaveGroupClick} className="warning-option">
                                <LogOut size={14} style={{marginRight:4}}/> ออกจากกลุ่ม
                            </button>
                        )}
                    </div>
                )}
            </div>
          </div>

          <div className="group-card-bottom">
            <p className="group-desc">{group.description || 'ยังไม่มีข้อความ'}</p>
            <div className="group-members-count">
              <Users size={11} style={{marginRight: '4px'}} />
              {group.currentMembers}/{group.maxMembers}
            </div>
          </div>
        </div>
      </div>

      {isMembersModalOpen && (
        <div className="members-modal-overlay" onClick={closeMembersModal}>
          <div className="members-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="members-modal-header">
              <h3>สมาชิกในกลุ่ม ({group.currentMembers})</h3>
              <button className="close-modal-btn" onClick={closeMembersModal}>
                <X size={24} />
              </button>
            </div>
            <div className="members-list">
              {group.members && group.members.length > 0 ? (
                group.members.map((member, index) => (
                  <div key={index} className="member-item">
                    <img 
                      src={member.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                      alt={member.name} 
                      className="member-avatar"
                    />
                    <div className="member-info-detail">
                      <p className="member-name">{member.name || 'สมาชิก'}</p>
                      {group.ownerId === member.uid && <span className="leader-badge">👑 Leader</span>}
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

export default GroupCard;