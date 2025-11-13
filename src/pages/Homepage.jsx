import React, { useState, useEffect } from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- Firebase Imports ---
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import Navbar from '../components/Navbar';
import Post from '../components/Post';
import './Homepage.css';

const Homepage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  // ✅ State สำหรับเก็บข้อมูล User จริง
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. ดึงข้อมูล User จริงจาก Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 1.1 ดึงข้อมูลเพิ่มเติม (เช่น Avatar ที่อัปเดตล่าสุด) จาก Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          let userData = {
            name: user.displayName || 'User',
            avatar: user.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
            uid: user.uid,
            id: user.uid // เผื่อ component ไหนใช้ id
          };

          if (userDoc.exists()) {
             const firestoreData = userDoc.data();
             // ใช้รูปและชื่อจาก Firestore ถ้ามี (เพราะเป็นข้อมูลล่าสุด)
             if (firestoreData.avatar) userData.avatar = firestoreData.avatar;
             if (firestoreData.name) userData.name = firestoreData.name;
          }
          
          setCurrentUser(userData);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        // ถ้าไม่ได้ล็อกอิน ให้เด้งไปหน้า Login
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Scroll Logic
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

  const suggestions = ['ทะเล', 'ภูเขา', 'น้ำตก', 'วัด', 'คาเฟ่', 'ถ่ายรูป', 'เดินป่า', 'ปลูกป่า','เขาใหญ่','สวนสัตว์','เดินสยาม','กิจกรรม'];

  if (loading) return <div className="loading-screen">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="container">
      <Navbar brand="TripTogether" />
      
      <div className="homepage-layout">
        {/* Main Content - ซ้าย */}
        <main className="main-content">
          <div className="welcome-banner">
            <h2 className="banner-title">
              🚗 ยินดีต้อนรับสู่ TripTogether 💨
            </h2>
            <p className="banner-subtitle">
                เที่ยวงี้มีเพื่อน สนุกกว่าเที่ยวคนเดียวเยอะ
            </p>
          </div>

          {/* ✅ ส่ง currentUser จริงไปให้ Post Component */}
          {currentUser && (
            <Post 
              currentUser={currentUser} 
              searchTerm={searchTerm}
              filterByOwner={false}  // แสดงโพสต์ของทุกคน
            />
          )}
        </main>

        {/* Search Sidebar - ขวา */}
        <aside className="search-sidebar">
          <div className="search-box-sticky">
            <div className="search-box">
              <div className="search-header">
                <Sparkles size={18} className="sparkle-icon" />
                <h3>ค้นหาทริปของคุณ</h3>
              </div>

              <div className="search-input-wrapper">
                <Search size={20} className="search-icon" />
                <input
                  type="text"
                  placeholder="ค้นหาทริป, สถานที่..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button 
                    className="search-clear-btn"
                    onClick={() => setSearchTerm('')}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Suggestions */}
            <div className="suggestions-section">
              <div className="suggestions-header">
                <Sparkles size={18} />
                <h3>💡 คำแนะนำ</h3>
              </div>
              <div className="suggestion-tags">
                {suggestions.map((tag, index) => (
                  <button 
                    key={index} 
                    className="suggestion-tag"
                    onClick={() => setSearchTerm(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Homepage;