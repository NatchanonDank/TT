import React, { useState, useEffect } from 'react';
import { Camera, Edit2, X, Check, LogOut, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- Firebase Imports ---
import { auth, db } from '../firebase';
import { onAuthStateChanged, updateProfile, signOut } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from 'firebase/firestore';

import Navbar from '../components/Navbar';
import Post from '../components/Post';
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: 'กำลังโหลดข้อมูล...',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    coverColor: 'linear-gradient(135deg, #a8d5e2 0%, #f9d5a5 100%)'
  });

  const [editForm, setEditForm] = useState({ ...profileData });

  // State เก็บรีวิว
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    average: 0,
    total: 0,
    breakdown: [0, 0, 0, 0, 0]
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // 1. โหลดข้อมูลส่วนตัว
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        let firestoreData = {};
        if (userDocSnap.exists()) firestoreData = userDocSnap.data();

        setProfileData({
          name: currentUser.displayName || 'User',
          email: currentUser.email,
          avatar: firestoreData.avatar || currentUser.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
          bio: firestoreData.bio || 'ยังไม่มีคำอธิบายตัวตน',
          coverColor: firestoreData.coverColor || 'linear-gradient(135deg, #a8d5e2 0%, #f9d5a5 100%)'
        });

        // 2. โหลดรีวิวที่มี targetUserId == เรา
        try {
          const reviewsQuery = query(
            collection(db, 'friend_reviews'),
            where('targetUserId', '==', currentUser.uid), 
            orderBy('createdAt', 'desc')
          );
          
          const querySnapshot = await getDocs(reviewsQuery);
          const fetchedReviews = [];
          let totalRating = 0;
          const breakdown = [0, 0, 0, 0, 0];

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            fetchedReviews.push({ id: doc.id, ...data });

            if (data.rating) {
              totalRating += data.rating;
              const index = 5 - Math.floor(data.rating);
              if (index >= 0 && index < 5) breakdown[index]++;
            }
          });

          setReviewsList(fetchedReviews);

          if (fetchedReviews.length > 0) {
            setReviewStats({
              total: fetchedReviews.length,
              average: (totalRating / fetchedReviews.length).toFixed(1),
              breakdown: breakdown
            });
          }

        } catch (error) {
          console.error("Error fetching reviews:", error);
          if (error.code === 'failed-precondition') {
             alert("⚠️ กรุณาสร้าง Index ใน Firebase Console (ดูลิงก์ใน F12)");
          }
        }

        setIsLoading(false);
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleEdit = () => { setIsEditing(true); setEditForm({ ...profileData }); };
  const handleCancel = () => { setIsEditing(false); setEditForm({ ...profileData }); };
  const handleChange = (field, value) => setEditForm(prev => ({ ...prev, [field]: value }));
  const handleProfileImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditForm(prev => ({ ...prev, avatar: reader.result }));
      reader.readAsDataURL(file);
    }
  };
  const handleLogout = async () => {
    if (window.confirm("ต้องการออกจากระบบใช่หรือไม่?")) {
      await signOut(auth);
      navigate('/login');
    }
  };
  const handleSave = async () => {
    if (!auth.currentUser) return;
    try {
      await updateProfile(auth.currentUser, { displayName: editForm.name });
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        name: editForm.name, bio: editForm.bio, coverColor: editForm.coverColor, avatar: editForm.avatar, email: auth.currentUser.email
      }, { merge: true });
      setProfileData({ ...editForm });
      setIsEditing(false);
      alert("บันทึกข้อมูลสำเร็จ!");
    } catch (error) { alert("Error: " + error.message); }
  };

  const renderStars = (count) => '⭐'.repeat(count) + '☆'.repeat(5 - count);
  const coverOptions = ['linear-gradient(135deg, #a8d5e2 0%, #f9d5a5 100%)', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'];

  if (isLoading) return <div className="loading-screen">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="head">
      <Navbar brand="TripTogether" />
      
      <div className="hero-section" style={{ background: profileData.coverColor }}>
         {/* ✅ ปุ่ม Logout มุมขวาบน (ปรับ Style ให้ชัดเจน) */}
         <button 
            onClick={handleLogout} 
            className="logout-btn-absolute"
            style={{
               position: 'absolute',
               top: '100px', // 👈 ปรับให้พ้น Navbar
               right: '30px',
               background: 'rgba(0,0,0,0.6)',
               color: 'white',
               border: 'none',
               padding: '10px 20px',
               borderRadius: '30px',
               cursor: 'pointer',
               display: 'flex',
               alignItems: 'center',
               gap: '8px',
               zIndex: 999,
               fontWeight: 'bold',
               boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}
         >
            <LogOut size={18} /> ออกจากระบบ
         </button>
      </div>

      {isEditing && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header"><h2 className="modal-title">แก้ไขโปรไฟล์</h2><button onClick={handleCancel}><X size={24} /></button></div>
            <div className="form-group"><label>รูปโปรไฟล์</label><input type="file" onChange={handleProfileImageUpload} /></div>
            <div className="form-group"><label>ชื่อ</label><input value={editForm.name} onChange={(e)=>handleChange('name',e.target.value)} className="text-input"/></div>
            <div className="form-group"><label>Bio</label><textarea value={editForm.bio} onChange={(e)=>handleChange('bio',e.target.value)} className="textarea-input"/></div>
            <div className="form-group"><label>สีปก</label><div className="cover-color-grid">{coverOptions.map((c,i)=><button key={i} onClick={()=>handleChange('coverColor',c)} className={`color-option-btn ${editForm.coverColor===c?'selected':''}`} style={{background:c}}>{editForm.coverColor===c&&<Check size={20} color="#fff"/>}</button>)}</div></div>
            <div className="modal-actions"><button onClick={handleCancel}>ยกเลิก</button><button onClick={handleSave}>บันทึก</button></div>
          </div>
        </div>
      )}

      <div className="content-wrapper">
        <div className="profile-card">
          <div className="profile-card-content">
            <div className="avatar-section">
              <div className="profile-avatar-large"><img src={profileData.avatar} alt="Profile" className="avatar-img" /></div>
              <button onClick={handleEdit} className="edit-avatar-btn"><Camera size={18} /></button>
            </div>
            <div className="profile-info">
              <div className="profile-header">
                <h2 className="profile-name">{profileData.name}</h2>
                <button onClick={handleEdit} className="primary-btn edit-profile-btn"><Edit2 size={16} /> แก้ไข</button>
              </div>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>{profileData.email}</p>
              <div className="bio-box"><h3 className="bio-title">ความสนใจ</h3><p className="bio-text">{profileData.bio}</p></div>
            </div>
          </div>
        </div>

        <div className="content-grid">
          <div>
            <div className="content-box">
              <h3 className="section-title">Post</h3>
              <Post 
                currentUser={{ name: profileData.name, avatar: profileData.avatar, id: auth.currentUser?.uid }}
                searchTerm=""
                filterByOwner={true}  
                ownerId={auth.currentUser?.uid}  
              />
            </div>
          </div>

          <div className="right-column-container">
            <div className="content-box">
              <h3 className="section-title">Review</h3>
              {reviewsList.length > 0 ? (
                <>
                  <div className="review-summary">
                    <div className="review-average">{reviewStats.average}</div>
                    <div className="review-total">{reviewStats.total} ratings</div>
                  </div>
                  <div className="review-breakdown">
                    {reviewStats.breakdown.map((count, index) => (
                      <div key={index} className="review-bar-row">
                        <div className="review-stars">{renderStars(5 - index)}</div>
                        <div className="review-bar-container">
                          <div className="review-bar-fill" style={{ width: `${reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0}%`, backgroundColor: count > 0 ? '#4caf50' : '#f0f0f0' }} />
                        </div>
                        <div className="review-count">{count}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}><Star size={40} style={{margin:'0 auto 10px', color:'#ddd'}}/>ยังไม่มีการให้คะแนน</div>
              )}
            </div>

            <div className="content-box">
              <h3 className="section-title">Comment ({reviewsList.length})</h3>
              <div className="comment-list">
                {reviewsList.length > 0 ? (
                  reviewsList.map((review) => (
                    <div key={review.id} className="comment-item">
                      <div className="comment-avatar"><img src="https://cdn-icons-png.flaticon.com/512/149/149071.png" alt="Reviewer" className="avatar-img" /></div>
                      <div style={{flex:1}}>
                         <p className="comment-text" style={{fontWeight:'bold', fontSize:'0.85rem'}}>เพื่อนร่วมทริป</p>
                         <p className="comment-text">{review.comment || "ไม่มีคำอธิบาย"}</p>
                         <div style={{fontSize:'0.8rem', color:'#FFD700'}}>{renderStars(review.rating || 0)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>ยังไม่มีคอมเมนต์</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;