import React from 'react';
import { Users } from 'lucide-react';
import './GroupCard.css';

const GroupCard = ({ group, onChatClick, isActive }) => { // ✅ เพิ่ม isActive
  return (
    <div 
      className={`group-card ${group.unread > 0 ? 'group-unread-card' : ''} ${group.status === 'ended' ? 'ended' : ''} ${isActive ? 'active' : ''}`} 
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
          {group.lastMessageTime && (
            <span className="group-time">
              {new Date(group.lastMessageTime.seconds * 1000).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}
            </span>
          )}
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
  );
};

export default GroupCard;