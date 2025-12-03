import React, { useState, useEffect } from 'react';
import { Users, Star, Trash2, MoreVertical, X } from 'lucide-react'; 
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'; // ✅ เพิ่ม doc, getDoc
import { Link } from 'react-router-dom'; 
import './TripCard.css';

// ✅ Component ย่อย
const TripMemberItem = ({ member, leaderUid }) => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (member.uid) {
        try {
          const docRef = doc(db, 'users', member.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) setUserData(docSnap.data());
        } catch (e) {}
      }
    };
    fetchUser();
  }, [member.uid]);

  const displayAvatar = userData?.avatar || member.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  const displayName = userData?.name || member.name || 'สมาชิก';

  return (
    <div className="trip-member-item">
      <Link to={`/profile/${member.uid}`}>
        <img src={displayAvatar} alt={displayName} className="trip-member-avatar" />
      </Link>
      <div className="trip-member-info">
        <Link to={`/profile/${member.uid}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="trip-member-name">{displayName}</span>
        </Link>
        {leaderUid === member.uid && <span className="leader-tag">Leader</span>}
      </div>
    </div>
  );
};

const TripCard = ({ trip, onClick, onDelete, currentUser }) => { 
  // ... (State และ useEffect เดิมของ TripCard) ...
  const [authorRating, setAuthorRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  const isOwner = currentUser?.uid === (trip.author?.uid || trip.uid);
  const isMember = trip.members?.some(m => m.uid === currentUser?.uid);
  const authorUid = trip.author?.uid || trip.uid; // เก็บ uid เจ้าของทริป

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  useEffect(() => {
    const fetchAuthorRating = async () => {
      if (!authorUid) return;
      try {
        const q = query(collection(db, 'friend_reviews'), where('targetUserId', '==', authorUid));
        const querySnapshot = await getDocs(q);
        const reviews = querySnapshot.docs.map(doc => doc.data());
        if (reviews.length > 0) {
          const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
          setAuthorRating(totalRating / reviews.length);
          setReviewCount(reviews.length);
        } else { setAuthorRating(0); setReviewCount(0); }
      } catch (error) { console.error("Error fetching rating:", error); }
    };
    fetchAuthorRating();
  }, [authorUid]);

  const handleToggleMenu = (e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); };
  const handleDeleteClick = (e) => { e.stopPropagation(); onDelete(trip.id); };
  const handleViewMembers = (e) => { e.stopPropagation(); setIsMembersModalOpen(true); setIsMenuOpen(false); };
  const handleCloseModal = (e) => { e.stopPropagation(); setIsMembersModalOpen(false); };

  return (
    <>
      <div className="trip-card" onClick={onClick}>
        <div className="trip-card-image-wrapper">
          <img 
            src={trip.imageUrl || trip.images?.[0] || 'https://www.ktc.co.th/pub/media/Article/01/wooden-bridge-island-surat-thani-thailand.webp'} 
            alt={trip.title || trip.destination} 
            className="trip-card-image" 
          />
          {trip.isHot && <span className="trip-badge">🔥 HOT</span>}
          
          <div className="trip-card-menu-container">
             <button className={`trip-card-menu-btn ${isMenuOpen ? 'active' : ''}`} onClick={handleToggleMenu}>
               <MoreVertical size={20} />
             </button>
             {isMenuOpen && (
               <div className="trip-card-dropdown" onClick={(e) => e.stopPropagation()}>
                 {isMember ? (
                   <button onClick={handleViewMembers} className="trip-dropdown-item">
                     <Users size={14} /> ดูรายชื่อสมาชิก
                   </button>
                 ) : (
                   <div className="trip-dropdown-info">ต้องเข้าร่วมทริปก่อน</div>
                 )}
                 {isOwner && (
                   <button onClick={handleDeleteClick} className="trip-dropdown-item delete">
                     <Trash2 size={14} /> ลบโพสต์
                   </button>
                 )}
               </div>
             )}
          </div>
        </div>

        <div className="trip-card-content">
          <div className="trip-location">{trip.destination || 'ไทย'}</div>
          <h3 className="trip-title">{trip.title || trip.content?.substring(0, 50)}</h3>
          {trip.startDate && trip.endDate && (
            <div className="trip-dates">
              <div className="date-details">
                <div className="date-row"><span className="date-label">เริ่ม</span><span className="date-value">{formatDate(trip.startDate)}</span></div>
                <div className="date-row"><span className="date-label">สิ้นสุด</span><span className="date-value">{formatDate(trip.endDate)}</span></div>
              </div>
            </div>
          )}
          <div className="trip-meta">
            <div className="trip-members"><Users size={16} /><span>{trip.membersCount || 0} คน</span></div>
            <div className="trip-rating" style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
              <Star size={14} fill={authorRating > 0 ? "#FFD700" : "none"} color={authorRating > 0 ? "#FFD700" : "#999"} />
              <span>{authorRating > 0 ? authorRating.toFixed(1) : 'New'} {reviewCount > 0 && <span style={{fontSize: '10px', color: '#888', marginLeft: '2px'}}> ({reviewCount})</span>}</span>
            </div>
          </div>
          <div className="trip-author"><span className="author-label">จัดโดย </span><span className="author-name">{trip.author?.name || 'ผู้ใช้'}</span></div>
        </div>
      </div>

      {isMembersModalOpen && (
        <div className="trip-members-modal-overlay" onClick={handleCloseModal}>
          <div className="trip-members-modal" onClick={(e) => e.stopPropagation()}>
            <div className="trip-members-header">
              <h3>รายชื่อสมาชิก ({trip.members?.length || 0})</h3>
              <button className="trip-modal-close-btn" onClick={handleCloseModal}><X size={20}/></button>
            </div>
            <div className="trip-members-list">
              {trip.members?.map((member, index) => (
                // ✅ ใช้ TripMemberItem
                <TripMemberItem 
                    key={index} 
                    member={member} 
                    leaderUid={authorUid}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TripCard;