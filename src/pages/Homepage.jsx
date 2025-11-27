import React, { useState, useEffect } from 'react';
import { Users, Star, Tag, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, getDocs, addDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Feb from '../components/Feb';
import './Homepage.css';

const Homepage = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [recommendedTrips, setRecommendedTrips] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState(''); // ✨ เพิ่ม state สำหรับค้นหา
  
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✨ รายการหมวดหมู่การท่องเที่ยว
  const categories = [
    'ทั้งหมด',
    'ทะเล เกาะ ชายหาด',
    'ภูเขา ธรรมชาติ',
    'วัด วัฒนธรรม ประวัติศาสตร์',
    'สวนสนุก',
    'ผจญภัย Adventure',
    'เกษตร ฟาร์มสเตย์',
    'เที่ยวเมือง City Trip'
  ];

  // ไอคอนสำหรับแต่ละหมวดหมู่
  const categoryIcons = {
    'ทั้งหมด': '📋',
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
            id: user.uid 
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

  // Fetch Recommended Trips - กรองตามหมวดหมู่
  useEffect(() => {
    const fetchRecommendedTrips = async () => {
      try {
        const postsQuery = query(collection(db, 'posts'));
        const querySnapshot = await getDocs(postsQuery);
        let trips = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // ✨ กรองตามหมวดหมู่ที่เลือก
        if (selectedCategory !== 'ทั้งหมด') {
          trips = trips.filter(trip => trip.category === selectedCategory);
        }
        
        // คำนวณ Hot Score สำหรับแต่ละทริป
        const tripsWithScore = trips.map(trip => {
          let hotScore = 0;
          
          const membersCount = trip.members?.length || 0;
          hotScore += membersCount * 10;
          
          const likesCount = trip.likes?.length || 0;
          hotScore += likesCount * 3;
          
          const reviewsCount = trip.reviews?.length || 0;
          hotScore += reviewsCount * 5;
          
          const completedCount = trip.completedTrips || 0;
          hotScore += completedCount * 8;
          
          const avgRating = trip.averageRating || 0;
          hotScore += avgRating * 2;
          
          return {
            ...trip,
            hotScore,
            membersCount,
            isHot: hotScore > 15
          };
        });
        
        const sortedTrips = tripsWithScore.sort((a, b) => b.hotScore - a.hotScore);
        setRecommendedTrips(sortedTrips); 
      } catch (error) {
        console.error("Error fetching recommended trips:", error);
      }
    };

    if (currentUser) {
      fetchRecommendedTrips();
    }
  }, [currentUser, selectedCategory]);

  // Smooth Scroll
  useEffect(() => {
    const handleWheel = (e) => {
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        mainContent.scrollTop += e.deltaY;
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? Math.max(0, Math.ceil(recommendedTrips.length / 4) - 1) : prev - 1));
  };

  const handleNextSlide = () => {
    const maxSlide = Math.max(0, Math.ceil(recommendedTrips.length / 4) - 1);
    setCurrentSlide((prev) => (prev >= maxSlide ? 0 : prev + 1));
  };

  const handleTripClick = (tripId) => {
    navigate(`/post/${tripId}`);
  };

  // ✨ ฟังก์ชันไปหน้าดูโพสต์ทั้งหมด
  const handleViewAllPosts = () => {
    navigate('/posts');
  };

  // ✨ ฟังก์ชันเปิด modal สร้างโพสต์
  const handleOpenCreateModal = () => {
    if (!currentUser) {
      alert("กรุณาเข้าสู่ระบบก่อนสร้างโพสต์");
      navigate('/login');
      return;
    }
    setIsModalOpen(true);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // ใช้ navigate แทน window.location
      navigate(`/posts?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/posts');
    }
  };
  // ✨ ฟังก์ชันสร้างโพสต์
  const createPost = async (postData) => {
    if (!currentUser) return;

    try {
      const docRef = await addDoc(collection(db, 'posts'), {
        ...postData,
        uid: currentUser.uid,
        author: {
          name: currentUser.name,
          avatar: currentUser.avatar,
          uid: currentUser.uid
        },
        likes: [],
        comments: [],
        joinRequests: [],
        members: [
          { name: currentUser.name, avatar: currentUser.avatar, uid: currentUser.uid }
        ],
        currentMembers: 1,
        createdAt: serverTimestamp(),
        timestamp: new Date().toLocaleString('th-TH')
      });

      const postId = docRef.id;

      // สร้างกลุ่มแชท
      const groupRef = doc(db, 'groups', postId);
      await setDoc(groupRef, {
        id: postId,
        name: postData.title,
        avatar: postData.images && postData.images.length > 0 ? postData.images[0] : currentUser.avatar,
        description: `กลุ่มแชทสำหรับทริป: ${postData.title}`,
        maxMembers: parseInt(postData.maxMembers) || 10,
        currentMembers: 1,
        status: 'active',
        ownerId: currentUser.uid,
        memberUids: [currentUser.uid],
        members: [{ name: currentUser.name, avatar: currentUser.avatar, uid: currentUser.uid }]
      });

      await updateDoc(docRef, { chatGroupId: postId });

      setIsModalOpen(false);
      
      // รีโหลดทริป
      const postsQuery = query(collection(db, 'posts'));
      const querySnapshot = await getDocs(postsQuery);
      let trips = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (selectedCategory !== 'ทั้งหมด') {
        trips = trips.filter(trip => trip.category === selectedCategory);
      }
      
      const tripsWithScore = trips.map(trip => {
        let hotScore = 0;
        const membersCount = trip.members?.length || 0;
        hotScore += membersCount * 10;
        const likesCount = trip.likes?.length || 0;
        hotScore += likesCount * 3;
        const reviewsCount = trip.reviews?.length || 0;
        hotScore += reviewsCount * 5;
        const completedCount = trip.completedTrips || 0;
        hotScore += completedCount * 8;
        const avgRating = trip.averageRating || 0;
        hotScore += avgRating * 2;
        
        return {
          ...trip,
          hotScore,
          membersCount,
          isHot: hotScore > 15
        };
      });
      
      const sortedTrips = tripsWithScore.sort((a, b) => b.hotScore - a.hotScore);
      setRecommendedTrips(sortedTrips);

      alert('สร้างโพสต์สำเร็จ! 🎉');
      
    } catch (error) {
      console.error("Error creating post/group:", error);
      alert("สร้างโพสต์ไม่สำเร็จ: " + error.message);
    }
  };

  if (loading) return <div className="loading-screen">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="container">
      <Navbar brand="TripTogether" />

      <div className="homepage-layout">
        <main className="main-content">
          {/* Hero Section with Search */}
          <section className="hero-section">
            <div className="hero-overlay"></div>
            <div className="hero-content">
              <h3 className="hero-title">
                Trip Together: ที่ที่การเดินทางไม่เหงาอีกต่อไป

              </h3>
              
              {/* ✨ Search Bar */}
              <form className="hero-search-container" onSubmit={handleSearch}>
                <div className="search-input-wrapper">
                  <svg className="search-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <input
                    type="text"
                    className="hero-search-input"
                    placeholder="ค้นหาทริปที่คุณสนใจ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="search-submit-btn">
                    ค้นหา
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* ✨ Category Filter Section */}
          <section className="category-filter-section">
            <div className="category-header">
              <Tag size={28} className="category-header-icon" />
              <h1 className="section-title">เลือกหมวดหมู่ที่คุณสนใจ</h1>
            </div>
            
            <div className="category-tabs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  <span className="category-icon">{categoryIcons[cat]}</span>
                  <span className="category-name">{cat}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Recommended Trips Carousel */}
          {recommendedTrips.length > 0 ? (
            <section className="recommended-trips-section">
              <div className="section-header">
                <h2 className="section-title">
                  {categoryIcons[selectedCategory]} {selectedCategory === 'ทั้งหมด' ? 'ประสบการณ์ไม่ควรพลาด' : selectedCategory}
                </h2>
                <button className="view-all-btn" onClick={handleViewAllPosts}>
                  ดูเพิ่มเติม →
                </button>
              </div>
              
              <div className="carousel-container">
                {recommendedTrips.length > 4 && (
                  <button 
                    className="carousel-button prev" 
                    onClick={handlePrevSlide}
                    aria-label="Previous"
                    disabled={currentSlide === 0}
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}

                <div className="carousel-track-wrapper">
                  <div 
                    className="carousel-track"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                  >
                    {recommendedTrips.map((trip) => (
                      <div 
                        key={trip.id} 
                        className="trip-card"
                        onClick={() => handleTripClick(trip.id)}
                      >
                        <div className="trip-card-image-wrapper">
                          <img 
                            src={trip.imageUrl || trip.images?.[0] || 'https://www.ktc.co.th/pub/media/Article/01/wooden-bridge-island-surat-thani-thailand.webp'} 
                            alt={trip.title || trip.destination}
                            className="trip-card-image"
                          />
                          {trip.isHot && (
                            <span className="trip-badge">🔥 HOT</span>
                          )}
                        </div>
                        
                        <div className="trip-card-content">
                          <div className="trip-location">{trip.destination || 'ไทย'}</div>
                          <h3 className="trip-title">{trip.title || trip.content?.substring(0, 50)}</h3>
                          
                          {trip.startDate && trip.endDate && (
                            <div className="trip-dates">
                              <div className="date-details">
                                <div className="date-row">
                                  <span className="date-label">เริ่ม</span>
                                  <span className="date-value">{formatDate(trip.startDate)}</span>
                                </div>
                                <div className="date-row">
                                  <span className="date-label">สิ้นสุด</span>
                                  <span className="date-value">{formatDate(trip.endDate)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="trip-meta">
                            <div className="trip-members">
                              <Users size={16} />
                              <span>{trip.membersCount || 0} คน</span>
                            </div>
                            <div className="trip-rating">
                              <Star size={14} fill="#FFD700" color="#FFD700" />
                              <span>{trip.averageRating?.toFixed(1) || '4.5'}</span>
                            </div>
                          </div>
                          
                          <div className="trip-author">
                            <span className="author-label">จัดโดย </span>
                            <span className="author-name">{trip.author?.name || 'ผู้ใช้'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {recommendedTrips.length > 4 && (
                  <button 
                    className="carousel-button next" 
                    onClick={handleNextSlide}
                    aria-label="Next"
                    disabled={currentSlide >= Math.ceil(recommendedTrips.length / 4) - 1}
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>
            </section>
          ) : (
            <section className="recommended-trips-section">
              <div className="section-header">
                <h2 className="section-title">
                  {categoryIcons[selectedCategory]} {selectedCategory === 'ทั้งหมด' ? 'ประสบการณ์ไม่ควรพลาด' : selectedCategory}
                </h2>
                <button className="view-all-btn" onClick={handleViewAllPosts}>
                  ดูเพิ่มเติม →
                </button>
              </div>
              <div className="empty-state">
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
                <p>ยังไม่มีทริปในหมวดหมู่นี้</p>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* ✨ ปุ่ม Floating Action Button สำหรับสร้างโพสต์ */}
      <button className="post-fab" onClick={handleOpenCreateModal}>
        <Plus size={28} />
      </button>

      {/* ✨ Feb Modal สำหรับสร้างโพสต์ */}
      <Feb
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={createPost}
        post={null}
      />
    </div>
  );
};

export default Homepage;