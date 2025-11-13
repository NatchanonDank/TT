// src/pages/Chat/components/GroupList.jsx
import React from 'react';
import { Search, Plus } from 'lucide-react';
import GroupCard from './GroupCard'; // 👈 ต้อง import มาจากไฟล์ข้างบน

const GroupList = ({ 
  groups, 
  searchTerm, 
  onSearchChange, 
  onChatClick, 
  onCreateGroup
}) => {
  return (
    <div className="group-list-container">
      {/* Header ค้นหา */}
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
          <div className="no-groups"><p>ยังไม่มีกลุ่ม</p></div>
        ) : (
          groups.map((group) => (
            // เรียกใช้ GroupCard และส่ง props ไปให้ครบ
            <GroupCard 
              key={group.id} 
              group={group} 
              onChatClick={onChatClick} // ส่งฟังก์ชันนี้ลงไป
            />
          ))
        )}
      </div>
    </div>
  );
};

export default GroupList;