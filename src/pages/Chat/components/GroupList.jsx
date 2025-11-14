import React from 'react';
import { Search, Plus } from 'lucide-react';
import GroupCard from './GroupCard';

const GroupList = ({ 
  groups, 
  searchTerm, 
  onSearchChange, 
  onChatClick, 
  onCreateGroup 
}) => 
  {
    
  return (
    <div className="group-list">
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

      <div className="groups-scroll-area">
        {groups.length === 0 ? (
          <div className="no-groups"><p>ยังไม่มีกลุ่ม</p></div>
        ) : (
          groups.map((group) => (
            <GroupCard 
              key={group.id} 
              group={group} 
              onChatClick={onChatClick} 
            />
          ))
        )}
      </div>
    </div>
  );
};

export default GroupList;
