import React, { useState, useEffect } from 'react';
import { Camera, Edit2, X, Check, LogOut, Flag, Image as ImageIcon, Trash2 } from 'lucide-react'; // ✅ เพิ่มไอคอน ImageIcon, Trash2
import { useNavigate, useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import './Profilepage.css';
import '../components/PostCard.css'
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
  orderBy,
  writeBatch,
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { userId } = useParams(); 

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [loggedInUser, setLoggedInUser] = useState(null); 
  const [profileUserId, setProfileUserId] = useState(null); 
  const [isOwnProfile, setIsOwnProfile] = useState(false); 

  const [profileData, setProfileData] = useState({
    name: '...',
    email: '...',
    bio: 'กำลังโหลดข้อมูล...',
    avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
    coverColor: 'linear-gradient(135deg, #a8d5e2 0%, #f9d5a5 100%)',
    coverImage: null 
  });

  const [editForm, setEditForm] = useState({ ...profileData });
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    average: 0,
    total: 0,
    breakdown: [0, 0, 0, 0, 0]
  });

  const [userPosts, setUserPosts] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setLoggedInUser(currentUser); 
        const targetUserId = userId || currentUser.uid; 
        setProfileUserId(targetUserId);
        setIsOwnProfile(targetUserId === currentUser.uid); 
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate, userId]);

  useEffect(() => {
    if (!profileUserId) return;

    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const userDocRef = doc(db, "users", profileUserId);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const firestoreData = userDocSnap.data();
          setProfileData({
            name: firestoreData.name || 'User',
            email: firestoreData.email || '... (ไม่มีอีเมล)',
            avatar: firestoreData.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
            bio: firestoreData.bio || 'ยังไม่มีคำอธิบายตัวตน',
            coverColor: firestoreData.coverColor || 'linear-gradient(135deg, #a8d5e2 0%, #f9d5a5 100%)',
            coverImage: firestoreData.coverImage || null 
          });
        } else {
          setProfileData(prev => ({...prev, name: "ไม่พบผู้ใช้", bio: ""}));
        }

        try {
          const postsQuery = query(
            collection(db, 'posts'),
            where('uid', '==', profileUserId),
            orderBy('createdAt', 'desc')
          );
          const postsSnapshot = await getDocs(postsQuery);
          const fetchedPosts = [];
          postsSnapshot.forEach((docSnap) => {
            const postData = docSnap.data();
            fetchedPosts.push({ 
              id: docSnap.id,
              ...postData,
              title: postData.title || 'ไม่มีชื่อโพสต์',
              destination: postData.destination || 'ไม่ระบุสถานที่',
              description: postData.description || '',
              createdAt: postData.createdAt || null,
              uid: postData.uid || profileUserId
            });
          });
          setUserPosts(fetchedPosts);
        } catch (postsError) {
          console.error("Error fetching posts:", postsError);
          setUserPosts([]);
        }

        const reviewsQuery = query(
          collection(db, 'friend_reviews'),
          where('targetUserId', '==', profileUserId),
          orderBy('createdAt', 'desc')
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const fetchedReviews = [];
        let totalRating = 0;
        const breakdown = [0, 0, 0, 0, 0];

        reviewsSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedReviews.push({ id: docSnap.id, ...data });
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
        } else {
          setReviewStats({ average: 0, total: 0, breakdown: [0, 0, 0, 0, 0] });
        }

      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();

  }, [profileUserId]);

  const handleEdit = () => { 
    setIsEditing(true); 
    setEditForm({ ...profileData }); 
  };
  
  const handleCancel = () => { 
    setIsEditing(false); 
    setEditForm({ ...profileData }); 
  };
  
  const handleChange = (field, value) => setEditForm(prev => ({ ...prev, [field]: value }));
  
  const handleProfileImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
       if (file.size > 700 * 1024) {
         alert(`รูป ${file.name} มีขนาดใหญ่เกิน 700KB!`);
         return;
       }
       const reader = new FileReader();
       reader.onloadend = () => setEditForm(prev => ({ ...prev, avatar: reader.result }));
       reader.readAsDataURL(file);
    }
  };

  const handleCoverImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
       if (file.size > 2 * 1024 * 1024) {
         alert(`รูปปกมีขนาดใหญ่เกิน 2MB!`);
         return;
       }
       const reader = new FileReader();
       reader.onloadend = () => setEditForm(prev => ({ ...prev, coverImage: reader.result }));
       reader.readAsDataURL(file);
    }
  };

  const handleRemoveCoverImage = () => {
    setEditForm(prev => ({ ...prev, coverImage: null }));
  };
  
  const handleLogout = async () => {
    if (window.confirm("ต้องการออกจากระบบใช่หรือไม่?")) {
      await signOut(auth);
      navigate('/login');
    }
  };

  const handleSave = async () => {
    if (!loggedInUser || !isOwnProfile) return;
    const userUID = loggedInUser.uid;
    
    try {
      await updateProfile(loggedInUser, { displayName: editForm.name });
      await setDoc(doc(db, "users", userUID), {
        name: editForm.name, 
        bio: editForm.bio, 
        coverColor: editForm.coverColor,
        coverImage: editForm.coverImage || null, 
        avatar: editForm.avatar, 
        email: loggedInUser.email
      }, { merge: true });

      const postsQuery = query(collection(db, 'posts'), where('uid', '==', userUID));
      const postsSnapshot = await getDocs(postsQuery);
      
      const batch = writeBatch(db); 
      postsSnapshot.forEach((docSnap) => {
          const postRef = doc(db, 'posts', docSnap.id);
          batch.update(postRef, {
              'author.name': editForm.name,
              'author.avatar': editForm.avatar 
          });
      });
      await batch.commit();
      
      setProfileData({ ...editForm });
      setIsEditing(false);
      alert("บันทึกข้อมูลสำเร็จ!");
      
    } catch (error) { 
      console.error("Error saving profile:", error);
      alert("Error: บันทึกข้อมูลไม่สำเร็จ"); 
    }
  };

  const handleReportUser = async () => {
    if (!loggedInUser || !profileUserId || isOwnProfile) {
      alert("ไม่สามารถรายงานตัวเองได้");
      return;
    }
    const reason = prompt(`กรุณาระบุเหตุผลในการรายงานผู้ใช้ ${profileData.name}:`);
    if (reason && reason.trim().length > 0) {
      try {
        await addDoc(collection(db, "reports"), {
          reporterUid: loggedInUser.uid,
          reporterName: loggedInUser.displayName || 'User',
          reportedUid: profileUserId,
          reportedName: profileData.name,
          reason: reason,
          context: `Reported from profile page: /profile/${profileUserId}`,
          createdAt: serverTimestamp(),
          status: "pending" 
        });
        alert("ส่งรายงานของคุณเรียบร้อยแล้ว ขอบคุณครับ");
      } catch (error) {
        console.error("Error submitting report:", error);
        alert("เกิดข้อผิดพลาดในการส่งรายงาน");
      }
    }
  };

  const renderStars = (count) => '⭐'.repeat(count) + '☆'.repeat(5 - count);
  const coverOptions = [
    'linear-gradient(135deg, #a8d5e2 0%, #f9d5a5 100%)', 
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', 
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  ];

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="head">
      <Navbar brand="TripTogether" />
      <div 
        className="hero-section" 
        style={{ 
          background: profileData.coverImage ? `url(${profileData.coverImage})` : profileData.coverColor,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#f0f2f5'
        }}
      >
         {isOwnProfile && (
            <button onClick={handleLogout} className="logout-btn-absolute">
                <LogOut size={18} /> ออกจากระบบ
            </button>
         )}
      </div>

      {isOwnProfile && isEditing && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">แก้ไขโปรไฟล์</h2>
              <button onClick={handleCancel}><X size={24} /></button>
            </div>
            
            <div className="form-group">
              <label>รูปโปรไฟล์</label>
              <input type="file" accept="image/*" onChange={handleProfileImageUpload} />
            </div>

            <div className="form-group">
              <label>ชื่อ</label>
              <input 
                value={editForm.name} 
                onChange={(e) => handleChange('name', e.target.value)} 
                className="text-input"
              />
            </div>

            <div className="form-group">
              <label>Bio</label>
              <textarea 
                value={editForm.bio} 
                onChange={(e) => handleChange('bio', e.target.value)} 
                className="textarea-input"
              />
            </div>
            <div className="form-group">
              <label style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                รูปภาพปก
                {editForm.coverImage && (
                  <button 
                    onClick={handleRemoveCoverImage}
                    style={{
                      background: 'none', border: 'none', color: '#e53e3e', 
                      fontSize: '0.85rem', cursor: 'pointer', display: 'flex', gap: '4px', alignItems: 'center'
                    }}
                  >
                    <Trash2 size={14} /> ลบรูปปก
                  </button>
                )}
              </label>
              <div style={{
                border: '2px dashed #dddfe2', borderRadius: '8px', padding: '10px',
                textAlign: 'center', background: '#f9fafb', marginBottom: '10px',
                position: 'relative', overflow: 'hidden', height: '120px'
              }}>
                {editForm.coverImage ? (
                  <img 
                    src={editForm.coverImage} 
                    alt="Cover Preview" 
                    style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px'}} 
                  />
                ) : (
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666'}}>
                    <ImageIcon size={24} style={{marginBottom: '5px'}}/>
                    <span style={{fontSize: '0.9rem'}}>ยังไม่มีรูปภาพปก</span>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleCoverImageUpload}
                  style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                    opacity: 0, cursor: 'pointer'
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>หรือ เลือกสีปก</label>
              <div className="cover-color-grid">
                {coverOptions.map((c, i) => (
                  <button 
                    key={i} 
                    onClick={() => {
                      setEditForm(prev => ({ ...prev, coverColor: c, coverImage: null }));
                    }} 
                    className={`color-option-btn ${editForm.coverColor === c && !editForm.coverImage ? 'selected' : ''}`} 
                    style={{ background: c }}
                  >
                    {editForm.coverColor === c && !editForm.coverImage && <Check size={20} color="#fff" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={handleCancel}>ยกเลิก</button>
              <button onClick={handleSave}>บันทึก</button>
            </div>
          </div>
        </div>
      )}
      <div className="content-wrapper">
        <div className="profile-card">
          <div className="profile-card-content">
            <div className="avatar-section">
              <div className="profile-avatar-large">
                <img src={profileData.avatar} alt="Profile" className="avatar-img" />
              </div>
              {isOwnProfile && (
                <button onClick={handleEdit} className="edit-avatar-btn">
                  <Camera size={18} />
                </button>
              )}
            </div>
            <div className="profile-info">
              <div className="profile-header">
                <h2 className="profile-name">{profileData.name}</h2>
                {isOwnProfile ? (
                  <button onClick={handleEdit} className="primary-btn edit-profile-btn">
                    <Edit2 size={16} /> แก้ไข
                  </button>
                ) : (
                  <button onClick={handleReportUser} className="secondary-btn report-btn">
                    <Flag size={16} /> รายงานผู้ใช้
                  </button>
                )}
              </div>
              <p className="profile-email">{profileData.email}</p>
              <div className="bio-box">
                <h3 className="bio-title">ความสนใจ</h3>
                <p className="bio-text">{profileData.bio}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="content-grid">
          <div>
            <div className="content-box">
              <h3 className="section-title">Post ({userPosts.length})</h3>
              
              {userPosts.length > 0 ? (
                <div className="posts-list">
                  {userPosts.map((post, index) => (
                    <PostCard 
                      key={`post-${post.id}-${index}`}
                      post={post}
                      currentUser={loggedInUser}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <p className="empty-title">ยังไม่มีโพสต์</p>
                  <p className="empty-subtitle">
                    {isOwnProfile ? 'เริ่มสร้างโพสต์แรกของคุณกันเถอะ!' : 'ผู้ใช้ยังไม่มีโพสต์'}
                  </p>
                </div>
              )}
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
                          <div 
                            className="review-bar-fill" 
                            style={{ 
                              width: `${reviewStats.total > 0 ? (count / reviewsList.length) * 100 : 0}%`
                            }} 
                          />
                        </div>
                        <div className="review-count">{count}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-state-small">ยังไม่มีการให้คะแนน</div>
              )}
            </div>

            <div className="content-box">
              <h3 className="section-title">Comment ({reviewsList.length})</h3>
              <div className="comment-list">
                {reviewsList.length > 0 ? (
                  reviewsList.map((review) => (
                    <div key={review.id} className="comment-item">
                      <Link to={`/profile/${review.reviewerId}`}>
                        <div className="comment-avatar">
                          <img 
                            src="https://cdn-icons-png.flaticon.com/512/149/149071.png" 
                            alt="Reviewer" 
                            className="avatar-img" 
                          />
                        </div>
                      </Link>
                      <div className="comment-content">
                        <div className="comment-header">
                          <p className="comment-author">
                            <Link to={`/profile/${review.reviewerId}`} className="comment-author-link">
                              เพื่อนร่วมทริป
                            </Link>
                          </p>
                          {review.createdAt && (
                            <span className="comment-date">
                              {new Date(review.createdAt.seconds * 1000).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          )}
                        </div>
                        <p className="comment-text">{review.comment || "ไม่มีคำอธิบาย"}</p>
                        <div className="comment-stars">{renderStars(review.rating || 0)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state-small">ยังไม่มีคอมเมนต์</div>
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