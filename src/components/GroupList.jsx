import React from 'react';
import { Search, Users } from 'lucide-react'; // ลบ Plus ออก

const GroupList = ({ 
  groups, 
  searchTerm, 
  onSearchChange, 
  onChatClick, 
  currentUser 
}) => {
  return (
    <div className="group-list-container">
      <div className="group-list-header">
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="ค้นหากลุ่ม..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      {/* รายการกลุ่ม */}
      <div className="groups-scroll-area">
        {groups.length === 0 ? (
          <div className="no-groups">
            <p>ไม่พบกลุ่ม</p>
          </div>
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              onClick={() => onChatClick(group)} 
              className="group-card"
            >
              {/* Avatar Section */}
              <div className="group-card-avatar" style={{
                 width: '60px',
                 height: '60px',
                 minWidth: '60px',
                 borderRadius: '50%',
                 overflow: 'hidden',
                 flexShrink: 0,
                 border: '2px solid #f0f0f0',
                 marginRight: '15px'
              }}>
                <img 
                  src={group.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                  alt={group.name} 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              </div>
              
              {/* Info */}
              <div className="group-card-info">
                <div className="group-card-top">
                  <h3 className="group-name">{group.name}</h3>
                  {group.lastMessageTime && (
                      <span className="group-time">
                        {new Date(group.lastMessageTime.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                  )}
                </div>
                
                <div className="group-card-bottom">
                  <p className="group-desc">
                    {group.description || 'ยังไม่มีข้อความ'}
                  </p>
                  <div className="group-members-count">
                      <Users size={12} />
                      <span>{group.currentMembers}/{group.maxMembers}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GroupList;