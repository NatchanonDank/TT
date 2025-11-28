import React from 'react';
import { Search } from 'lucide-react';
import GroupCard from './GroupCard';
import './GroupList.css';

const GroupList = ({ 
  groups, 
  searchTerm, 
  onSearchChange, 
  onChatClick,
  activeGroupId
}) => {
  return (
    <div className="group-list">
      <div className="group-list-header">
        <h2 className="group-list-title">แชท</h2>
        
        <div className="search-bar">
          <input
            type="text"
            placeholder="ค้นหากลุ่ม..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="groups-scroll-area">
        {groups.length === 0 ? (
          <div className="no-groups">
            <p>ยังไม่มีกลุ่ม</p>
          </div>
        ) : (
          groups.map((group) => (
            <GroupCard 
              key={group.id} 
              group={group} 
              onChatClick={onChatClick}
              isActive={group.id === activeGroupId}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default GroupList;