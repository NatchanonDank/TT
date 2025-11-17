import React, { createContext, useState, useContext, useEffect } from 'react';
// ✅ 1. เพิ่ม Imports
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

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // ✅ 2. เพิ่ม Effect เพื่อเช็คการ Login
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setNotifications([]); // ล้างค่าเมื่อ Logout
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // ✅ 3. เพิ่ม Effect เพื่อดึง Notifications (แบบ Real-time)
  useEffect(() => {
    if (!currentUser) return; // ถ้าไม่ Login ไม่ต้องทำ

    const q = query(
      collection(db, 'notifications'),
      where('toUid', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    // ฟังการเปลี่ยนแปลง
    const unsubscribeNotifs = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(notifs);
    });

    return () => unsubscribeNotifs(); // หยุดฟังเมื่อ component ปิด
  }, [currentUser]); // ทำงานใหม่เมื่อ User เปลี่ยน

  // ✅ 4. อัปเดตฟังก์ชันให้ทำงานกับ Firestore
  const markAsRead = async (id) => {
    try {
      const notifRef = doc(db, 'notifications', id);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.read);
    if (unreadNotifs.length === 0) return;

    try {
      const batch = writeBatch(db);
      unreadNotifs.forEach(notif => {
        const ref = doc(db, 'notifications', notif.id);
        batch.update(ref, { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // ✅ 5. แยกการนับ
  // นับการแจ้งเตือนทั่วไป (Bell icon)
  const unreadCount = notifications.filter(
    n => !n.read && n.type !== 'chat_message'
  ).length;

  // นับแชทที่ยังไม่อ่าน (Chat icon)
  const unreadChatCount = notifications.filter(
    n => !n.read && n.type === 'chat_message'
  ).length;


  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      // addNotification, // (ฟังก์ชันนี้ไม่จำเป็นแล้ว เพราะเราดึงตรง)
      markAsRead,
      markAllAsRead,
      deleteNotification,
      unreadCount,      // ✅ สำหรับ Bell
      unreadChatCount   // ✅ สำหรับ Chat
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};