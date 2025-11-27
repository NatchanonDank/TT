import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, getDocs } from 'firebase/firestore';
import { ArrowLeft, Search, X } from 'lucide-react';

import Navbar from '../components/Navbar';
import './AllPosts.css';

const AllPosts = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allPosts, setAllPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchInput, setSearchInput] = useState(searchQuery);

  const categoryIcons = {
    'ทะเล เกาะ ชายหาด': '🏖️',
    'ภูเขา ธรรมชาติ': '⛰️',
    'วัด วัฒนธรรม ประวัติศาสตร์': '🛕',
    'สวนสนุก': '🎡',
    'ผจญภัย Adventure': '🧗',
    'เกษตร ฟาร์มสเตย์': '🌾',
    'เที่ยวเมือง City Trip': '🏙️'
  };

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
        
        // เรียงตามเวลาล่าสุด
        posts.sort((a, b) => {
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });
        
        setAllPosts(posts);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    if (currentUser) {
      fetchAllPosts();
    }
  }, [currentUser]);

  // Update search input when URL changes
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // ✨ Smart Search Filter - กรอง category + เนื้อหา
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPosts(allPosts);
    } else {
      const query = searchQuery.toLowerCase().trim();
      
      const postsWithScore = allPosts.map(post => {
        let relevanceScore = 0;
        let matchType = '';
        
        // Title match (น้ำหนักสูงสุด)
        const title = post.title?.toLowerCase() || '';
        if (title === query) {
          relevanceScore += 1000;
          matchType = 'title-exact';
        } else if (title.includes(query)) {
          relevanceScore += 500;
          matchType = 'title-partial';
        } else if (title.split(' ').some(word => word.includes(query))) {
          relevanceScore += 250;
          matchType = 'title-word';
        }
        
        // Destination match
        const destination = post.destination?.toLowerCase() || '';
        if (destination === query) {
          relevanceScore += 400;
          if (!matchType) matchType = 'destination-exact';
        } else if (destination.includes(query)) {
          relevanceScore += 200;
          if (!matchType) matchType = 'destination-partial';
        }
        
        // Description/Content match
        const description = post.description?.toLowerCase() || '';
        const content = post.content?.toLowerCase() || '';
        const text = post.text?.toLowerCase() || '';
        
        if (description.includes(query)) {
          relevanceScore += 100;
          if (!matchType) matchType = 'description';
        }
        if (content.includes(query)) {
          relevanceScore += 80;
          if (!matchType) matchType = 'content';
        }
        if (text.includes(query)) {
          relevanceScore += 80;
          if (!matchType) matchType = 'text';
        }
        
        // ✨ Category match - ต้องมีเนื้อหาตรงด้วย (Smart Logic)
        const category = post.category?.toLowerCase() || '';
        const hasContentMatch = (
          title.includes(query) || 
          destination.includes(query) || 
          description.includes(query) || 
          content.includes(query) || 
          text.includes(query)
        );
        
        if (category.includes(query)) {
          if (hasContentMatch) {
            // มีทั้ง category ตรง และเนื้อหาตรง → โบนัสคะแนน
            relevanceScore += 30;
            if (!matchType) matchType = 'category-with-content';
          } else {
            // มีแค่ category ตรง แต่เนื้อหาไม่ตรง → ไม่ให้คะแนน
            relevanceScore = 0;
          }
        }
        
        // 🔧 FIX: ให้ popularity bonus เฉพาะเมื่อมี relevanceScore > 0
        if (relevanceScore > 0) {
          // โบนัสคะแนนสำหรับโพสต์ที่มีหลายตำแหน่งตรง
          const matchCount = [
            title.includes(query),
            destination.includes(query),
            description.includes(query),
            content.includes(query),
            text.includes(query)
          ].filter(Boolean).length;
          
          if (matchCount > 1) {
            relevanceScore += matchCount * 10;
          }
          
          // โบนัสคะแนนสำหรับโพสต์ที่ Hot
          const popularityBonus = (post.likes?.length || 0) + (post.members?.length || 0) * 2;
          relevanceScore += Math.min(popularityBonus, 30);
        }
        
        return {
          ...post,
          relevanceScore,
          matchType
        };
      });
      
      // กรองและเรียง
      const filtered = postsWithScore
        .filter(post => post.relevanceScore > 0)
        .sort((a, b) => {
          if (b.relevanceScore !== a.relevanceScore) {
            return b.relevanceScore - a.relevanceScore;
          }
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });
      
      setFilteredPosts(filtered);
    }
  }, [searchQuery, allPosts]);

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

  // Handle Search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ search: searchInput.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchParams({});
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
              <h1 className="page-title">
                {searchQuery ? `ผลการค้นหา: "${searchQuery}"` : 'โพสต์ทั้งหมด'}
              </h1>
            </div>
            <div className="posts-count">{filteredPosts.length} โพสต์</div>
          </div>

          {/* ✨ Search Bar */}
          <div className="search-section">
            <form className="search-form" onSubmit={handleSearch}>
              <div className="search-wrapper">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="ค้นหาทริป, สถานที่, หมวดหมู่..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                {searchInput && (
                  <button 
                    type="button"
                    className="clear-button"
                    onClick={() => setSearchInput('')}
                  >
                    <X size={18} />
                  </button>
                )}
                <button type="submit" className="search-submit-btn">
                  ค้นหา
                </button>
              </div>
            </form>
            
            {searchQuery && (
              <div className="search-info">
                <p>พบ {filteredPosts.length} โพสต์ที่เกี่ยวข้อง</p>
                <button className="clear-search-btn" onClick={handleClearSearch}>
                  ล้างการค้นหา
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Posts Grid */}
        <div className="posts-grid">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
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
              <div className="empty-icon">🔍</div>
              <h2>ไม่พบผลลัพธ์</h2>
              <p>
                {searchQuery 
                  ? `ไม่พบโพสต์ที่ตรงกับ "${searchQuery}"`
                  : 'ยังไม่มีโพสต์ในระบบ'
                }
              </p>
              {searchQuery && (
                <button className="view-all-btn" onClick={handleClearSearch}>
                  ดูโพสต์ทั้งหมด
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllPosts;