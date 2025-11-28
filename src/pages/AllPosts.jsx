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

  // ✨ Smart Search Filter - กรอง category + เนื้อหา + Hot Posts First
  useEffect(() => {
    if (searchQuery.trim() === '') {
      // ✨ เมื่อไม่มีการค้นหา ให้เรียงตาม Hot Score
      const postsWithHotScore = allPosts.map(post => {
        const likes = post.likes?.length || 0;
        const members = post.currentMembers || 0;
        const joinRequests = post.joinRequests?.length || 0;
        const hotScore = likes * 10 + members * 20 + joinRequests * 5;
        
        return {
          ...post,
          hotScore
        };
      });
      
      // เรียงตาม Hot Score สูงสุดก่อน
      const sorted = postsWithHotScore.sort((a, b) => {
        if (b.hotScore !== a.hotScore) {
          return b.hotScore - a.hotScore; // Hot ก่อน
        }
        // ถ้า Hot Score เท่ากัน เรียงตามเวลาล่าสุด
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      
      setFilteredPosts(sorted);
      
      // 🔍 Debug: ดูค่า Hot Score
      console.log('🔥 Top 5 Posts by Hot Score:');
      sorted.slice(0, 5).forEach((post, i) => {
        console.log(`${i+1}. ${post.title} - Hot Score: ${post.hotScore}`);
      });
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
        
        // ✨ Category match - ค้นหาตามหมวดหมู่
        const category = post.category?.toLowerCase() || '';

        if (category.includes(query)) {
          relevanceScore += 150;
          if (!matchType) matchType = 'category';
          
          const hasContentMatch = (
            title.includes(query) || 
            destination.includes(query) || 
            description.includes(query) || 
            content.includes(query) || 
            text.includes(query)
          );
          
          if (hasContentMatch) {
            relevanceScore += 50;
          }
        }
        
        // 🔥 Hot Score - เพิ่มคะแนนจากความนิยม
        if (relevanceScore > 0) {
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
          
          // ✨ เพิ่ม Hot Score มากขึ้น
          const likes = post.likes?.length || 0;
          const members = post.currentMembers || 0;
          const joinRequests = post.joinRequests?.length || 0;
          const popularityBonus = likes * 5 + members * 10 + joinRequests * 3;
          relevanceScore += Math.min(popularityBonus, 100);
        }
        
        // คำนวณ Hot Score สำหรับการเรียงลำดับ
        const likes = post.likes?.length || 0;
        const members = post.currentMembers || 0;
        const joinRequests = post.joinRequests?.length || 0;
        const hotScore = likes * 10 + members * 20 + joinRequests * 5;
        
        return {
          ...post,
          relevanceScore,
          matchType,
          hotScore
        };
      });
      
      // กรองและเรียง - โพสต์ Hot ขึ้นก่อนเมื่อ relevanceScore ใกล้เคียงกัน
      const filtered = postsWithScore
        .filter(post => post.relevanceScore > 0)
        .sort((a, b) => {
          // ถ้า relevanceScore ต่างกันมาก (>100) ให้เรียงตาม relevanceScore
          if (Math.abs(b.relevanceScore - a.relevanceScore) > 100) {
            return b.relevanceScore - a.relevanceScore;
          }
          
          // ถ้า relevanceScore ใกล้เคียงกัน ให้เรียงตาม Hot Score
          if (b.hotScore !== a.hotScore) {
            return b.hotScore - a.hotScore;
          }
          
          // ถ้า Hot Score เท่ากัน ให้เรียงตามเวลาล่าสุด
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });
      
      setFilteredPosts(filtered);
      
      // 🔍 Debug: ดูค่า Hot Score เมื่อค้นหา
      console.log('🔥 Search Results Top 5:');
      filtered.slice(0, 5).forEach((post, i) => {
        console.log(`${i+1}. ${post.title} - Hot Score: ${post.hotScore}, Relevance: ${post.relevanceScore}`);
      });
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
            <button className="back" onClick={handleBackToHome}>
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
                  {/* 🔥 HOT Badge - แสดงเฉพาะ Top 10% */}
                  {filteredPosts.indexOf(post) < Math.ceil(filteredPosts.length * 0.1) && (
                    <span className="hot-badge">
                      🔥 HOT
                    </span>
                  )}
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