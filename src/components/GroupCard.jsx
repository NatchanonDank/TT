import React from 'react';
import { Users } from 'lucide-react';

const GroupCard = ({ group, onChatClick }) => {
  return (
    <div 
      className="group-card" 
      onClick={() => onChatClick(group)}
    >
      {/* Avatar Section */}
      <div className="group-card-avatar">
        <img 
          src={group.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
          alt={group.name} 
        />
      </div>
      
      {/* Info Section */}
      <div className="group-card-info">
        <div className="group-card-top">
          <h3 className="group-name">{group.name}</h3>
          {group.lastMessageTime && (
            <span className="group-time">
              {new Date(group.lastMessageTime.seconds * 1000).toLocaleTimeString([], {
                hour: '2-digit', 
                minute:'2-digit'
              })}
            </span>
          )}
        </div>
        
        <div className="group-card-bottom">
          <p className="group-description">
            {group.description || 'ยังไม่มีข้อความ'}
          </p>
          
          <div className="group-members-count">
            <Users size={12} />
            <span>{group.currentMembers}/{group.maxMembers}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupCard;