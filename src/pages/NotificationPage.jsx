import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar";
import { Heart, MessageCircle, Users, CheckCircle, XCircle, X, Trash2 } from 'lucide-react';
import './NotificationPage.css';

// --- Firebase Imports ---
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  getDocs
} from 'firebase/firestore';

const NotificationPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. เช็ค Login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // 2. ดึงการแจ้งเตือน (Real-time)
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('toUid', '==', currentUser.uid), // ดึงเฉพาะที่ส่งถึงเรา
      orderBy('createdAt', 'desc') // เรียงจากใหม่ไปเก่า
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // แปลงเวลาให้สวยงาม
        timeDisplay: doc.data().createdAt?.seconds 
          ? new Date(doc.data().createdAt.seconds * 1000).toLocaleString('th-TH')
          : 'เมื่อสักครู่'
      }));
      setNotifications(notifs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // --- Handlers ---

  // อ่านแล้ว (เมื่อคลิก)
  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      const notifRef = doc(db, 'notifications', notif.id);
      await updateDoc(notifRef, { read: true });
    }
    
    // ลิงก์ไปยังหน้าต่างๆ ตามประเภท (Optional)
    if (notif.postId) {
       // navigate(`/post/${notif.postId}`); // ถ้ามีหน้ารายละเอียดโพสต์
    }
  };

  // อ่านทั้งหมด
  const markAllAsRead = async () => {
    const batch = writeBatch(db);
    const unreadNotifs = notifications.filter(n => !n.read);
    
    if (unreadNotifs.length === 0) return;

    unreadNotifs.forEach(notif => {
      const ref = doc(db, 'notifications', notif.id);
      batch.update(ref, { read: true });
    });

    await batch.commit();
  };

  // ลบการแจ้งเตือน
  const deleteNotification = async (id) => {
    await deleteDoc(doc(db, 'notifications', id));
  };

  // ไอคอนตามประเภท
  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart size={20} className="notif-icon like" />;
      case 'comment': return <MessageCircle size={20} className="notif-icon comment" />;
      case 'join_request': return <Users size={20} className="notif-icon request" />;
      case 'request_approved': return <CheckCircle size={20} className="notif-icon approved" />;
      case 'request_rejected': return <XCircle size={20} className="notif-icon rejected" />;
      default: return <MessageCircle size={20} className="notif-icon" />;
    }
  };

  if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>กำลังโหลดการแจ้งเตือน...</div>;

  return (
    <div className="notifications-page">
      <Navbar brand="TripTogether" />
      
      <div className="notifications-container">
        <div className="notifications-header">
          <h2 className="notifications-title">การแจ้งเตือน</h2>
          {notifications.some(n => !n.read) && (
            <button className="mark-all-btn" onClick={markAllAsRead}>
              อ่านทั้งหมด
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="empty-notifications">
            <p>ไม่มีการแจ้งเตือนในขณะนี้</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`notification-item ${!notif.read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="notif-icon-wrapper">
                  {getIcon(notif.type)}
                </div>
                
                <img 
                  src={notif.fromAvatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                  alt="Avatar"
                  className="notif-avatar"
                />
                
                <div className="notif-content">
                  <p className="notif-message">
                    <strong>{notif.fromName}</strong> {notif.message}
                  </p>
                  <p className="notif-time">{notif.timeDisplay}</p>
                </div>

                <button 
                  className="delete-notif-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // ป้องกันไม่ให้ไป trigger การคลิกอ่าน
                    deleteNotification(notif.id);
                  }}
                >
                  <X size={16} />
                </button>

                {!notif.read && <div className="unread-dot"></div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;