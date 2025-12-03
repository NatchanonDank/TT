import React, { useState, useEffect } from 'react';
import { ArrowLeft, X, Trash2, UserMinus } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../../firebase'; // ✅ Import db
import { doc, getDoc } from 'firebase/firestore'; // ✅ Import getDoc
import './ChatHeader.css';

// ✅ Component ย่อยสำหรับดึงข้อมูลสมาชิกแต่ละคน
const MemberItem = ({ member, isLeader, currentUser, isTripEnded, handleKickMember }) => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (member.uid) {
        try {
          const docRef = doc(db, 'users', member.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      }
    };
    fetchUser();
  }, [member.uid]);

  // ใช้ข้อมูลล่าสุดจาก userData ถ้ามี, ถ้าไม่มีใช้จาก member เดิม, ถ้าไม่มีเลยใช้รูป default
  const displayAvatar = userData?.avatar || member.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  const displayName = userData?.name || member.name || 'สมาชิก';

  return (
    <div className="member-item">
      <Link to={`/profile/${member.uid}`}>
        <img 
          src={displayAvatar} 
          alt={displayName} 
          className="member-avatar"
        />
      </Link>
      <div className="member-info-detail">
        <Link to={`/profile/${member.uid}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <p className="member-name">{displayName}</p>
        </Link>
        {/* เช็คว่าเป็น Leader โดยเทียบ uid */}
        {member.uid === isLeader && <span className="leader-badge">👑 Leader</span>}
      </div>

      {/* ปุ่มลบสมาชิก (แสดงเฉพาะถ้าเราเป็น Leader และไม่ใช่ตัวเอง และทริปยังไม่จบ) */}
      {isLeader === currentUser?.uid && member.uid !== currentUser.uid && !isTripEnded && (
        <button 
          className="kick-btn"
          onClick={() => handleKickMember(member)}
          title="ลบสมาชิก"
        >
          <UserMinus size={18} />
        </button>
      )}
    </div>
  );
};

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
  const navigate = useNavigate();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  
  const handleToggleOptions = (e) => {
    e.stopPropagation();
    setIsOptionsOpen(prev => !prev);
  };

  const isLeader = currentUser?.uid === chat.ownerId;

  const handleOpenMembersModal = () => {
    setIsMembersModalOpen(true);
    setIsOptionsOpen(false); 
  };

  const handleCloseMembersModal = () => {
    setIsMembersModalOpen(false);
  };

  const handleLeaveGroup = () => {
    setIsOptionsOpen(false);
    onLeaveGroup(); 
  };

  const handleDeleteGroup = () => {
    setIsOptionsOpen(false);
    onDeleteGroup();
  };

  const handleKickMember = (member) => {
    onRemoveMember(chat, member);
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
          <p className="member-info clickable" onClick={handleOpenMembersModal}>
            {chat.currentMembers}/{chat.maxMembers} คน
          </p>
        </div>
        
        <div className="chat-options">
          <button onClick={handleToggleOptions}>⋮</button>
          {isOptionsOpen && (
            <div className="options-dropdown">
              <button onClick={() => navigate(`/post/${chat.id}`)}>
                ดูรายละเอียดทริป
              </button>

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
                  // ✅ เรียกใช้ MemberItem ที่สร้างขึ้นใหม่
                  <MemberItem 
                    key={index}
                    member={member}
                    isLeader={chat.ownerId}
                    currentUser={currentUser}
                    isTripEnded={isTripEnded}
                    handleKickMember={handleKickMember}
                  />
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