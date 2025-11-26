import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, getDocs } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react'; // ✅ เหลือแค่ ArrowLeft

import Navbar from '../components/Navbar';
import './AllPosts.css';

const AllPosts = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allPosts, setAllPosts] = useState([]);

  // ✨ เก็บ categoryIcons ไว้สำหรับแสดงบนการ์ด
  const categoryIcons = {
    'ทะเล เกาะ ชายหาด': '🏖️',
    'ภูเขา ธรรมชาติ': '⛰️',
    'วัด วัฒนธรรม ประวัติศาสตร์': '🛕',
    'สวนสนุก': '🎡',
    'ผจญภัย Adventure': '🧗',
    'เกษตร ฟาร์มสเตย์': '🌾',
    'เที่ยวเมือง City Trip': '🏙️'
  };

  // ❌ ลบ categories, selectedCategory, filteredPosts

  // Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          let userData = {
            name: user.displayName || 'User',
            avatar: user.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
            uid: user.uid,
          };
          if (userDoc.exists()) {
            const firestoreData = userDoc.data();
            if (firestoreData.avatar) userData.avatar = firestoreData.avatar;
            if (firestoreData.name) userData.name = firestoreData.name;
          }
          setCurrentUser(userData);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        navigate('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  // Fetch All Posts
  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        const postsQuery = query(collection(db, 'posts'));
        const querySnapshot = await getDocs(postsQuery);
        const posts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllPosts(posts);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    if (currentUser) {
      fetchAllPosts();
    }
  }, [currentUser]);

  // ❌ ลบ useEffect สำหรับ filter by category

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  const handleBackToHome = () => {
    navigate('/homepage');
  };

  if (loading) return <div className="loading-screen">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="container">
      <Navbar brand="TripTogether" />

      <div className="all-posts-page">
        {/* Header */}
        <div className="page-header">
          <div className="page-header-top">
            <button className="back-button" onClick={handleBackToHome}>
              <ArrowLeft size={18} />
              <span>กลับหน้าหลัก</span>
            </button>
            <div className="page-title-section">
              <h1 className="page-title">โพสต์ทั้งหมด</h1>
            </div>
            <div className="posts-count">{allPosts.length} โพสต์</div>
          </div>
        </div>

        {/* Category Filter */}
        {/* ❌ ลบส่วนนี้ออก - ไม่ใช้ Category Filter แล้ว */}

        {/* Posts Grid */}
        <div className="posts-grid">
          {allPosts.length > 0 ? (
            allPosts.map((post) => (
              <div 
                key={post.id} 
                className="post-card"
                onClick={() => handlePostClick(post.id)}
              >
                <div className="post-image-wrapper">
                  <img 
                    src={post.images?.[0] || 'https://www.ktc.co.th/pub/media/Article/01/wooden-bridge-island-surat-thani-thailand.webp'} 
                    alt={post.title}
                    className="post-image"
                  />
                  {post.category && (
                    <span className="post-category-badge">
                      {categoryIcons[post.category]} {post.category}
                    </span>
                  )}
                </div>
                
                <div className="post-content">
                  <div className="post-location">📍 {post.destination || 'ไทย'}</div>
                  <h3 className="post-title">{post.title || post.content?.substring(0, 50)}</h3>
                  
                  {post.startDate && post.endDate && (
                    <div className="post-dates">
                      <div className="date-item">
                        <span className="date-label">เริ่ม:</span>
                        <span className="date-value">{formatDate(post.startDate)}</span>
                      </div>
                      <span className="date-separator">→</span>
                      <div className="date-item">
                        <span className="date-label">สิ้นสุด:</span>
                        <span className="date-value">{formatDate(post.endDate)}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="post-meta">
                    <div className="post-members">
                      👥 {post.currentMembers || 0}/{post.maxMembers || 10} คน
                      
                      {/* ✨ Badge สำหรับ Leader แสดงจำนวนคำขอ */}
                      {currentUser && post.author?.uid === currentUser.uid && 
                       post.joinRequests && post.joinRequests.length > 0 && (
                        <span className="join-requests-badge">
                          {post.joinRequests.length} คำขอ
                        </span>
                      )}
                    </div>
                    <div className="post-author">
                      จัดโดย {post.author?.name || 'ผู้ใช้'}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>ไม่พบโพสต์ในหมวดหมู่นี้</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllPosts;