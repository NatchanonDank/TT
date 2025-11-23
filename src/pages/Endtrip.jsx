import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Endtrip.css';
import { db, auth } from '../firebase';
import { 
  doc, 
  getDoc, 
  addDoc, 
  collection, 
  serverTimestamp, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';

const Endtrip = () => {
  const { groupId } = useParams(); 
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('review');
  const [tripData, setTripData] = useState(null);
  const [pendingTrips, setPendingTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTripReviewPopup, setShowTripReviewPopup] = useState(false);
  const [showFriendReviewPopup, setShowFriendReviewPopup] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 0, comment: '', images: [] });
  const [friendRatings, setFriendRatings] = useState({});
  const [friendComments, setFriendComments] = useState({});
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      
      if (groupId) {
        try {
          const docRef = doc(db, 'groups', groupId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setTripData({ id: docSnap.id, ...data });
            
            if (data.members && auth.currentUser) {
               const otherMembers = data.members.filter(m => m.uid !== auth.currentUser.uid);
               setMembers(otherMembers);
            }
            setShowTripReviewPopup(true);
          } else {
            alert('ไม่พบข้อมูลทริป');
          }
        } catch (error) { console.error("Error:", error); }
      } else if (auth.currentUser) {
        try {
          const qGroups = query(
            collection(db, 'groups'),
            where('memberUids', 'array-contains', auth.currentUser.uid),
            where('status', '==', 'ended')
          );
          const qReviews = query(collection(db, 'reviews'), where('userId', '==', auth.currentUser.uid));
          
          const [groupsSnap, reviewsSnap] = await Promise.all([getDocs(qGroups), getDocs(qReviews)]);
          const reviewedGroupIds = reviewsSnap.docs.map(doc => doc.data().groupId);
          
          const trips = groupsSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(trip => !reviewedGroupIds.includes(trip.id));
            
          setPendingTrips(trips);
        } catch (error) { console.error("Error:", error); }
      }
      setLoading(false);
    };
    initPage();
  }, [groupId]);

  useEffect(() => {
      const targetId = groupId || tripData?.id;
      const fetchReviews = async () => {
          if (!targetId) return;
          try {
              const q = query(collection(db, 'reviews'), where('groupId', '==', targetId));
              const querySnapshot = await getDocs(q);
              const loadedPosts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              setPosts(loadedPosts);
          } catch (error) { console.error(error); }
      };
      if (activeTab === 'feed' && targetId) fetchReviews();
  }, [groupId, tripData, activeTab]);

  const handleSelectTripToReview = (trip) => {
    setTripData(trip);
    if (trip.members && auth.currentUser) {
        const otherMembers = trip.members.filter(m => m.uid !== auth.currentUser.uid);
        setMembers(otherMembers);
    }
    setShowTripReviewPopup(true);
  };

  const handleStarClick = (rating) => setReviewData({ ...reviewData, rating });
  const handleFriendRating = (friendId, rating) => setFriendRatings({ ...friendRatings, [friendId]: rating });
  const handleFriendComment = (friendId, comment) => setFriendComments({ ...friendComments, [friendId]: comment });
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        if (file.size > 500000) {
            alert(`ไฟล์ ${file.name} ใหญ่เกินไป!`);
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setReviewData(prev => ({ 
                ...prev, 
                images: [...prev.images, reader.result] 
            }));
        };
        reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    const newImages = reviewData.images.filter((_, i) => i !== index);
    setReviewData({ ...reviewData, images: newImages });
  };

  const handleSubmitReview = async () => {
    if (reviewData.rating === 0) { alert('กรุณาให้คะแนนทริป'); return; }
    if (!auth.currentUser) return;

    try {
        await addDoc(collection(db, 'reviews'), {
            groupId: tripData.id,
            groupName: tripData.name,
            location: tripData.description || '',
            rating: reviewData.rating,
            comment: reviewData.comment,
            images: reviewData.images,
            userId: auth.currentUser.uid,
            userName: auth.currentUser.displayName || 'User',
            userAvatar: auth.currentUser.photoURL,
            createdAt: serverTimestamp(),
            date: new Date().toLocaleDateString('th-TH')
        });

        for (const member of members) {
            if (friendRatings[member.uid]) {
                await addDoc(collection(db, 'friend_reviews'), {
                    reviewerId: auth.currentUser.uid,
                    targetUserId: member.uid,
                    rating: friendRatings[member.uid] || 0,
                    comment: friendComments[member.uid] || '',
                    groupId: tripData.id,
                    createdAt: serverTimestamp()
                });
            }
        }

        alert('บันทึกรีวิวเรียบร้อย!');
        setReviewData({ rating: 0, comment: '', images: [] });
        setFriendRatings({}); setFriendComments({});
        setShowTripReviewPopup(false);
        setShowFriendReviewPopup(false);    
        setPendingTrips(prev => prev.filter(t => t.id !== tripData.id));

        if (groupId) {
           setActiveTab('feed');
        } else {
           setTripData(null);
        }

    } catch (error) {
        console.error("Error:", error);
        alert("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  const handleNextToFriendReview = () => {
    if (reviewData.rating === 0) { alert('กรุณาให้คะแนนทริป'); return; }
    setShowTripReviewPopup(false); setShowFriendReviewPopup(true);
  };
  const handleBackToTripReview = () => { setShowFriendReviewPopup(false); setShowTripReviewPopup(true); };
  const handleClosePopups = () => { setShowTripReviewPopup(false); setShowFriendReviewPopup(false); };

  const StarRating = ({ rating, onRate, size = 30 }) => (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={`star ${!onRate ? 'readonly' : ''}`} onClick={() => onRate && onRate(star)}
            style={{ fontSize: `${size}px`, color: star <= rating ? '#FFD700' : '#ddd', cursor: onRate ? 'pointer' : 'default' }}>★</span>
        ))}
      </div>
  );

  if (loading) return <div className="loading-screen">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="endtrip-container">
      <Navbar brand="TripTogether" />

      {tripData ? (
        <>
          <div className="tabs">
            <button className={`tab ${activeTab === 'review' ? 'active' : ''}`} onClick={() => setActiveTab('review')}>รีวิวทริป</button>
            <button className={`tab ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}>Feed (รีวิวจากเพื่อน)</button>
          </div>

          <div className="content">
            {activeTab === 'review' ? (
                <div className="group-card" onClick={() => setShowTripReviewPopup(true)}>
                    <div className="group-avatar">
                        <img src={tripData.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt={tripData.name} style={{width:'100%', height:'100%', borderRadius:'10px', objectFit:'cover'}} />
                    </div>
                    <div className="group-info">
                      <div className="group-name">{tripData.name}</div>
                      <div className="group-location">คลิกเพื่อเขียนรีวิว</div>
                    </div>
                    <button className="review-button">เขียนรีวิว</button>
                </div>
            ) : (
              <div className="feed-list">
                {posts.length === 0 ? (
                  <div className="empty-state"><div className="empty-state-text">ยังไม่มีรีวิวในทริปนี้</div></div>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className="post-card">
                      <div className="post-header">
                        <div className="post-avatar"><img src={post.userAvatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="avatar" style={{width:40, height:40, borderRadius:'50%'}} /></div>
                        <div className="post-info"><div className="post-group-name">{post.userName}</div><div className="post-date">{post.date}</div></div>
                        <div className="star-display">★ {post.rating}</div>
                      </div>
                      <div className="post-content">
                        <p>{post.comment}</p>
                        {post.images && post.images.length > 0 && (
                           <div className="post-images">
                             {post.images.map((img, idx) => <img key={idx} src={img} alt="review" className="post-image" />)}
                           </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          
          {!groupId && (
             <button className="secondary-button" style={{maxWidth: '200px', margin: '20px auto', display:'block'}} onClick={() => setTripData(null)}>กลับไปหน้ารายการ</button>
          )}
        </>
      ) : (
        <div className="content">
           <h2 className="endtrip-title">ทริปที่จบแล้ว(รอรีวิว)</h2>
           {pendingTrips.length === 0 ? (
              <div className="empty-state">
                 <div className="empty-state-text">ไม่มีทริปที่รอรีวิว</div>
                 <button className="primary-button" onClick={() => navigate('/homepage')} style={{marginTop: '10px'}}>กลับหน้าหลัก</button>
              </div>
           ) : (
              <div className="pending-list">
                 {pendingTrips.map(trip => (
                    <div key={trip.id} className="group-card" onClick={() => handleSelectTripToReview(trip)}>
                        <div className="group-avatar"><img src={trip.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt={trip.name} style={{width:'100%', height:'100%', borderRadius:'10px', objectFit:'cover'}} /></div>
                        <div className="group-info"><div className="group-name">{trip.name}</div><div className="group-location">สิ้นสุดเมื่อ: {trip.lastMessageTime ? new Date(trip.lastMessageTime.seconds*1000).toLocaleDateString() : '-'}</div></div>
                        <button className="review-button">รีวิวเลย</button>
                    </div>
                 ))}
              </div>
           )}
        </div>
      )}

      {showTripReviewPopup && tripData && (
        <div className="popup-overlay">
          <div className="popup">
            <div className="popup-header"><h2 className="popup-title">รีวิวทริป: {tripData.name}</h2><button className="close-button" onClick={handleClosePopups}>×</button></div>
            <div className="popup-content">
              <div className="rating-section"><h3>ให้คะแนนความประทับใจ</h3><div className="star-rating"><StarRating rating={reviewData.rating} onRate={handleStarClick} size={40}/></div></div>
              <div className="comment-section"><textarea placeholder="เล่าความประทับใจ..." value={reviewData.comment} onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}/></div>
              <div className="image-upload-section">
                <input type="file" multiple onChange={handleImageUpload} id="upload" hidden />
                <label htmlFor="upload" className="upload-btn">📷 เพิ่มรูปภาพ</label>
                <div className="image-previews">
                  {reviewData.images.map((img, idx) => (
                    <div key={idx} className="img-wrap"><img src={img} alt="preview" /><button onClick={() => handleRemoveImage(idx)}>×</button></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="popup-footer"><button className="secondary-button" onClick={handleClosePopups}>ยกเลิก</button><button className="primary-button" onClick={handleNextToFriendReview}>ถัดไป: รีวิวเพื่อน</button></div>
          </div>
        </div>
      )}

      {showFriendReviewPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <div className="popup-header"><h2 className="popup-title">รีวิวเพื่อนร่วมทริป</h2><button className="close-button" onClick={handleClosePopups}>×</button></div>
            <div className="popup-content scrollable">
              {members.length > 0 ? members.map((friend) => (
                <div key={friend.uid} className="friend-review-item">
                  <div className="friend-header">
                    <img src={friend.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt={friend.name} className="friend-avatar-small" />
                    <span>{friend.name}</span>
                    <div className="mini-stars"><StarRating rating={friendRatings[friend.uid] || 0} onRate={(r) => handleFriendRating(friend.uid, r)} size={20}/></div>
                  </div>
                  <input type="text" placeholder={`เขียนถึง ${friend.name}...`} value={friendComments[friend.uid] || ''} onChange={(e) => handleFriendComment(friend.uid, e.target.value)} className="friend-input" />
                </div>
              )) : <p style={{textAlign:'center'}}>ไม่มีเพื่อนคนอื่นในทริป</p>}
            </div>
            <div className="popup-footer"><button className="secondary-button" onClick={handleBackToTripReview}>ย้อนกลับ</button><button className="primary-button success" onClick={handleSubmitReview}>บันทึกทั้งหมด</button></div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Endtrip;