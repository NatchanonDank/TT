import React, { useState, useEffect } from 'react';
import { Users, Star, Tag, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  where, 
  deleteDoc 
} from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Feb from '../components/Feb';
import TripCard from '../components/TripCard'; 
import './Homepage.css';

const Homepage = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [recommendedTrips, setRecommendedTrips] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = [
    'ทั้งหมด', 'ทะเล เกาะ', 'ภูเขา ดอย', 'แคมป์ปิ้ง', 'วัด ทำบุญ',
    'คาเฟ่ อาหาร', 'สวนสนุก สวนน้ำ', 'เดินป่า ผจญภัย', 'เที่ยวในเมือง',
    'ไนท์ไลฟ์ ปาร์ตี้', 'ดำน้ำ', 'จิตอาสา', 'ถ่ายรูป', 'ดูคอนเสิร์ต'
  ];

  const categoryIcons = {
    'ทั้งหมด': '🌎', 'ทะเล เกาะ': '🏖️', 'ภูเขา ดอย': '⛰️', 'แคมป์ปิ้ง': '⛺',
    'วัด ทำบุญ': '🛕', 'คาเฟ่ อาหาร': '☕', 'สวนสนุก สวนน้ำ': '🎡',
    'เดินป่า ผจญภัย': '🧗', 'เที่ยวในเมือง': '🏙️', 'ไนท์ไลฟ์ ปาร์ตี้': '🍻',
    'ดำน้ำ': '🤿', 'จิตอาสา': '🤝', 'ถ่ายรูป': '📸', 'ดูคอนเสิร์ต': '🎵'
  };

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

  useEffect(() => {
    const fetchRecommendedTrips = async () => {
      try {
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
          const likes = trip.likes?.length || 0;
          const members = trip.currentMembers || trip.members?.length || 0;
          const joinRequests = trip.joinRequests?.length || 0;
          const hotScore = likes * 10 + members * 20 + joinRequests * 5;
          
          return {
            ...trip,
            hotScore,
            membersCount: members
          };
        });
        
        const sortedTrips = tripsWithScore.sort((a, b) => {
          if (b.hotScore !== a.hotScore) return b.hotScore - a.hotScore;
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });
        
        const top10PercentCount = Math.ceil(sortedTrips.length * 0.1);
        const tripsWithHotFlag = sortedTrips.map((trip, index) => ({
          ...trip,
          isHot: index < top10PercentCount
        }));
        
        setRecommendedTrips(tripsWithHotFlag);
        
      } catch (error) {
        console.error("Error fetching trips:", error);
      }
    };

    if (currentUser) {
      fetchRecommendedTrips();
    }
  }, [currentUser, selectedCategory]);

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

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? Math.max(0, Math.ceil(recommendedTrips.length / 4) - 1) : prev - 1));
  };

  const handleNextSlide = () => {
    const maxSlide = Math.max(0, Math.ceil(recommendedTrips.length / 4) - 1);
    setCurrentSlide((prev) => (prev >= maxSlide ? 0 : prev + 1));
  };

  const handleTripClick = (tripId) => navigate(`/post/${tripId}`);
  const handleViewAllPosts = () => navigate('/posts');
  
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
    navigate(searchQuery.trim() ? `/posts?search=${encodeURIComponent(searchQuery.trim())}` : '/posts');
  };

  const handleDeleteTrip = async (tripId) => {
    if (window.confirm("คุณต้องการลบโพสต์นี้ใช่หรือไม่?")) {
      try {
        await deleteDoc(doc(db, 'posts', tripId));
        try { await deleteDoc(doc(db, 'groups', tripId)); } catch(e) { /* ignore error if group not found */ }
        
        setRecommendedTrips(prev => prev.filter(t => t.id !== tripId));
        alert('ลบโพสต์สำเร็จ');
      } catch (error) {
        console.error("Error deleting post:", error);
        alert("เกิดข้อผิดพลาดในการลบ");
      }
    }
  };
  
  const createPost = async (postData) => {
    if (!currentUser) return;

    try {
      const docRef = await addDoc(collection(db, 'posts'), {
        ...postData,
        uid: currentUser.uid,
        author: { name: currentUser.name, avatar: currentUser.avatar, uid: currentUser.uid },
        likes: [],
        comments: [],
        joinRequests: [],
        members: [{ name: currentUser.name, avatar: currentUser.avatar, uid: currentUser.uid }],
        currentMembers: 1,
        createdAt: serverTimestamp(),
        timestamp: new Date().toLocaleString('th-TH')
      });

      await setDoc(doc(db, 'groups', docRef.id), {
        id: docRef.id,
        name: postData.title,
        avatar: postData.images?.[0] || currentUser.avatar,
        description: `กลุ่มแชทสำหรับทริป: ${postData.title}`,
        maxMembers: parseInt(postData.maxMembers) || 10,
        currentMembers: 1,
        status: 'active',
        ownerId: currentUser.uid,
        memberUids: [currentUser.uid],
        members: [{ name: currentUser.name, avatar: currentUser.avatar, uid: currentUser.uid }],
        startDate: postData.startDate,
        notified_approaching: false,
        notified_today: false
      });

      await updateDoc(docRef, { chatGroupId: docRef.id });
      setIsModalOpen(false);

      alert('สร้างโพสต์สำเร็จ! 🎉');
      window.location.reload(); 

    } catch (error) {
      console.error("Error creating post:", error);
      
      if (error.message.includes("exceeds the maximum allowed size")) {
        alert("สร้างโพสต์ไม่สำเร็จ: \n❌ รูปภาพรวมกันมีขนาดใหญ่เกินไป! \n(1MB ต่อโพสต์) \nกรุณาลดขนาดณรูปภาพ หรือเลือกรูปที่มีขนาดไฟล์เล็กลง");
      } else {
        alert("สร้างโพสต์ไม่สำเร็จ: " + error.message);
      }
    }
  };

  if (loading) return <div className="loading-screen">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="container">
      <Navbar brand="TripTogether" />
      <div className="homepage-layout">
        <main className="main-content">
          <section className="hero-section">
            <div className="hero-overlay"></div>
            <div className="hero-content">
              <h3 className="hero-title">Trip Together: ที่ที่การเดินทางไม่เหงาอีกต่อไป</h3>
              <form className="hero-search-container" onSubmit={handleSearch}>
                <div className="search-input-wrapper">
                  <svg className="search-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <input type="text" className="hero-search-input" placeholder="ค้นหาทริปที่คุณสนใจ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  <button type="submit" className="search-submit-btn">ค้นหา</button>
                </div>
              </form>
            </div>
          </section>

          <section className="category-filter-section">
            <div className="category-header">
              <Tag size={28} className="category-header-icon" />
              <h1 className="section-title">เลือกหมวดหมู่ที่คุณสนใจ</h1>
            </div>
            <div className="category-tabs">
              {categories.map((cat) => (
                <button key={cat} className={`category-tab ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>
                  <span className="category-icon">{categoryIcons[cat]}</span>
                  <span className="category-name">{cat}</span>
                </button>
              ))}
            </div>
          </section>

          {recommendedTrips.length > 0 ? (
            <section className="recommended-trips-section">
              <div className="section-header">
                <h2 className="section-title">{categoryIcons[selectedCategory]} {selectedCategory === 'ทั้งหมด' ? 'ประสบการณ์ไม่ควรพลาด' : selectedCategory}</h2>
                <button className="view-all-btn" onClick={handleViewAllPosts}>ดูเพิ่มเติม →</button>
              </div>
              <div className="carousel-container">
                {recommendedTrips.length > 4 && (
                  <button className="carousel-button prev" onClick={handlePrevSlide} disabled={currentSlide === 0}>
                    <svg viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                )}
                <div className="carousel-track-wrapper">
                  <div className="carousel-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                    {recommendedTrips.map((trip) => (
                      <TripCard 
                        key={trip.id} 
                        trip={trip} 
                        onClick={() => handleTripClick(trip.id)} 
                        currentUser={currentUser}
                        onDelete={handleDeleteTrip} 
                      />
                    ))}
                  </div>
                </div>
                {recommendedTrips.length > 4 && (
                  <button className="carousel-button next" onClick={handleNextSlide} disabled={currentSlide >= Math.ceil(recommendedTrips.length / 4) - 1}>
                    <svg viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                )}
              </div>
            </section>
          ) : (
            <section className="recommended-trips-section">
              <div className="section-header">
                <h2 className="section-title">{categoryIcons[selectedCategory]} {selectedCategory === 'ทั้งหมด' ? 'ประสบการณ์ไม่ควรพลาด' : selectedCategory}</h2>
                <button className="view-all-btn" onClick={handleViewAllPosts}>ดูเพิ่มเติม →</button>
              </div>
              <div className="empty-state">
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
                <p>ยังไม่มีทริปในหมวดหมู่นี้</p>
              </div>
            </section>
          )}
        </main>
      </div>
      <button className="post-fab" onClick={handleOpenCreateModal}><Plus size={28} /></button>
      <Feb isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={createPost} post={null} />
    </div>
  );
};

export default Homepage;