import React, { useState, useEffect } from 'react';
import { Users, MoreVertical, X, LogOut, Flag, Trash2, UserMinus } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../../firebase'; // ✅ Import db
import { doc, getDoc } from 'firebase/firestore'; // ✅ Import getDoc
import './GroupCard.css';

// ✅ Component ย่อยสำหรับดึงข้อมูลสมาชิก
const MemberItem = ({ member, isLeaderUid, currentUser, isEnded, handleKickMember }) => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (member.uid) {
        try {
          const docRef = doc(db, 'users', member.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) setUserData(docSnap.data());
        } catch (e) { console.error(e); }
      }
    };
    fetchUser();
  }, [member.uid]);

  const displayAvatar = userData?.avatar || member.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  const displayName = userData?.name || member.name || 'สมาชิก';

  return (
    <div className="member-item">
      <Link to={`/profile/${member.uid}`}>
        <img src={displayAvatar} alt={displayName} className="member-avatar" />
      </Link>
      <div className="member-info-detail">
        <Link to={`/profile/${member.uid}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <p className="member-name">{displayName}</p>
        </Link>
        {isLeaderUid === member.uid && <span className="leader-badge">👑 Leader</span>}
      </div>
      {isLeaderUid === currentUser?.uid && member.uid !== currentUser.uid && !isEnded && (
        <button className="kick-btn" onClick={() => handleKickMember(member)} title="ลบสมาชิก">
          <UserMinus size={18} />
        </button>
      )}
    </div>
  );
};

const GroupCard = ({ 
  group, 
  onChatClick, 
  isActive, 
  currentUser, 
  onEndTrip, 
  onLeaveGroup,
  onDeleteGroup,
  onRemoveMember 
}) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  const isLeader = currentUser?.uid === group.ownerId;
  const isEnded = group.status === 'ended';

  // ... (Handlers เดิม) ...
  const handleToggleMenu = (e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); };
  const handleOpenMembers = (e) => { e.stopPropagation(); setIsMembersModalOpen(true); setIsMenuOpen(false); };
  const handleEndTripClick = (e) => { e.stopPropagation(); setIsMenuOpen(false); onEndTrip(group); };
  const handleLeaveGroupClick = (e) => { e.stopPropagation(); setIsMenuOpen(false); onLeaveGroup(group); };
  const handleDeleteGroupClick = (e) => { e.stopPropagation(); setIsMenuOpen(false); onDeleteGroup(group); };
  const closeMembersModal = (e) => { if (e) e.stopPropagation(); setIsMembersModalOpen(false); };
  const handleKickMember = (member) => { onRemoveMember(group, member); };
  const handleViewTripDetail = (e) => { e.stopPropagation(); navigate(`/post/${group.id}`); };

  return (
    <>
      <div 
        className={`group-card ${group.unread > 0 ? 'group-unread-card' : ''} ${isEnded ? 'ended' : ''} ${isActive ? 'active' : ''} ${isMenuOpen ? 'menu-open' : ''}`} 
        onClick={() => onChatClick(group)}
      >
        <div className="group-card-avatar">
          <img src={group.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt={group.name} />
          {group.unread > 0 && <span className="unread-badge">{group.unread}</span>}
        </div>
        
        <div className="group-card-info">
          <div className="group-card-top">
            <h3 className="group-name">{group.name}</h3>
            <div className="group-card-options">
                <button className={`options-trigger ${isMenuOpen ? 'active' : ''}`} onClick={handleToggleMenu}>
                    <MoreVertical size={16} />
                </button>
                {isMenuOpen && (
                    <div className="group-dropdown-menu">
                        <button onClick={handleViewTripDetail}>ดูรายละเอียดทริป</button>
                        <button onClick={handleOpenMembers}>ดูรายชื่อสมาชิก</button>
                        {isLeader ? (
                            isEnded ? (
                                <button onClick={handleDeleteGroupClick} className="danger-option"><Trash2 size={14} style={{marginRight:4}}/> ลบกลุ่มแชท</button>
                            ) : (
                                <button onClick={handleEndTripClick} className="danger-option">สิ้นสุดทริป</button>
                            )
                        ) : (
                            <button onClick={handleLeaveGroupClick} className="warning-option"><LogOut size={14} style={{marginRight:4}}/> ออกจากกลุ่ม</button>
                        )}
                    </div>
                )}
            </div>
          </div>
          <div className="group-card-bottom">
            <p className="group-desc">{group.description || 'ยังไม่มีข้อความ'}</p>
            <div className="group-members-count"><Users size={11} style={{marginRight: '4px'}} />{group.currentMembers}/{group.maxMembers}</div>
          </div>
        </div>
      </div>

      {isMembersModalOpen && (
        <div className="members-modal-overlay" onClick={closeMembersModal}>
          <div className="members-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="members-modal-header">
              <h3>สมาชิกในกลุ่ม ({group.currentMembers})</h3>
              <button className="close-modal-btn" onClick={closeMembersModal}><X size={24} /></button>
            </div>
            <div className="members-list">
              {group.members && group.members.length > 0 ? (
                group.members.map((member, index) => (
                  // ✅ ใช้ MemberItem
                  <MemberItem 
                    key={index}
                    member={member}
                    isLeaderUid={group.ownerId}
                    currentUser={currentUser}
                    isEnded={isEnded}
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

export default GroupCard;