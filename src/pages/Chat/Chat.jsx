import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from "../../components/Navbar";
import GroupList from './components/GroupList';
import ChatWindow from './components/ChatWindow';
import LocationModal from './components/LocationModal';
import './Chat.css';

// --- Firebase Imports ---
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc,
  updateDoc,
  getDoc,
  writeBatch,
  getDocs
} from 'firebase/firestore';

// ✅ 1. Import Context ที่เราต้องการใช้
import { useNotifications } from '../../components/NotificationContext';

const Chat = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [groupSearch, setGroupSearch] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const [isTripEnded, setIsTripEnded] = useState(false);
  
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false); 

  const [messageInput, setMessageInput] = useState('');
  const [groups, setGroups] = useState([]); 
  const [messages, setMessages] = useState([]); 

  // ✅ 2. ดึงข้อมูลการแจ้งเตือนทั้งหมดจาก Context
  const { notifications } = useNotifications();

  // 1. Auth Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          name: user.displayName || 'User',
          avatar: user.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
        });
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // 2. Fetch Groups
  useEffect(() => {
    if (!currentUser?.uid) return; 
    const q = query(
      collection(db, 'groups'),
      where('memberUids', 'array-contains', currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedGroups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGroups(loadedGroups);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // 3. Handle URL (ปรับปรุงเล็กน้อย)
  useEffect(() => {
    if (!groupId) {
      setActiveChat(null);
      return;
    }
    if (!currentUser) return;

    const selectGroupFromUrl = async () => {
      const existingGroup = groups.find(g => g.id === groupId);
      if (existingGroup) {
        if (activeChat?.id !== existingGroup.id) {
          setActiveChat(existingGroup);
        }
      } else {
        try {
          const groupRef = doc(db, 'groups', groupId);
          const groupSnap = await getDoc(groupRef);
          if (groupSnap.exists()) {
            const groupData = groupSnap.data();
            if (groupData.memberUids?.includes(currentUser.uid)) {
              if (activeChat?.id !== groupId) {
                 setActiveChat({ id: groupId, ...groupData }); 
              }
            }
          }
        } catch (error) {
          console.error("Error fetching group:", error);
        }
      }
    };
    
    // รอให้ groups โหลดเสร็จก่อน
    if (groups.length > 0) {
        selectGroupFromUrl();
    }
    
  }, [groupId, currentUser, groups, activeChat]);

  // ✅ 4. แก้ไข Effect นี้ (Fetch Messages & Mark Notifications as Read)
  useEffect(() => {
    // รอให้ข้อมูลทั้งหมดพร้อม
    if (!activeChat?.id || !currentUser?.uid || !notifications) return;

    // --- 1. Mark Notifications as Read (โดยใช้ข้อมูลจาก Context) ---
    const markChatNotificationsAsRead = async () => {
      
      // กรองหา Notif ที่ยังไม่อ่าน ที่ตรงกับแชทนี้ (กรองจาก Array ใน JS)
      const unreadNotifsForThisChat = notifications.filter(n =>
        n.groupId === activeChat.id &&
        n.type === 'chat_message' &&
        n.read === false &&
        n.toUid === currentUser.uid // กันเหนียว
      );

      // ถ้าไม่มี ก็ไม่ต้องทำอะไร
      if (unreadNotifsForThisChat.length === 0) return; 

      try {
        // อัปเดต Notif ที่ค้างทั้งหมดเป็น "อ่านแล้ว"
        const batch = writeBatch(db);
        unreadNotifsForThisChat.forEach(notif => {
          const notifRef = doc(db, 'notifications', notif.id);
          batch.update(notifRef, { read: true });
        });
        await batch.commit();
        // console.log(`Marked ${unreadNotifsForThisChat.length} chat notifs as read.`);
      } catch (error) {
        console.error("Error marking chat notifications as read:", error);
      }
    };

    // เรียกใช้งานทันที
    markChatNotificationsAsRead();
    // --------------------------------------------------------
    
    setIsTripEnded(activeChat.status === 'ended');
    
    // --- 2. Fetch Messages (ส่วนนี้เหมือนเดิม) ---
    const qMessages = query(
      collection(db, 'messages'),
      where('room', '==', activeChat.id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(qMessages, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          time: data.createdAt?.seconds 
            ? new Date(data.createdAt.seconds * 1000).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
            : '...',
          isOwn: currentUser?.uid ? data.uid === currentUser.uid : false 
        };
      });
      setMessages(msgs);
    });
    return () => unsubscribe();
    
  // ✅ 5. เพิ่ม 'notifications' เข้าไปใน dependency array
  }, [activeChat, currentUser, notifications]); 

  // --- Handlers (ส่วนนี้เหมือนเดิมทั้งหมด) ---

  const handleChatClick = (group) => {
    setActiveChat(group);
    navigate(`/chat/${group.id}`);
  };

  const handleBackToList = () => {
    setActiveChat(null);
    setMessages([]); 
    navigate('/chat'); 
  };

  const sendChatNotification = async (messageText) => {
    if (!activeChat || !currentUser) return;

    try {
      const otherMembers = activeChat.members.filter(m => m.uid !== currentUser.uid);
      if (otherMembers.length === 0) return;

      const batch = writeBatch(db);

      for (const member of otherMembers) {
        const notifRef = doc(collection(db, 'notifications'));
        batch.set(notifRef, {
          toUid: member.uid,
          fromName: currentUser.name,
          fromAvatar: currentUser.avatar,
          message: `ส่งข้อความในกลุ่ม "${activeChat.name}": ${messageText.substring(0, 30)}...`,
          type: 'chat_message',
          read: false,
          createdAt: serverTimestamp(),
          groupId: activeChat.id
        });
      }
      await batch.commit();

    } catch (error) {
      console.error("Error sending chat notification:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeChat?.id || isTripEnded) return;
    try {
      await addDoc(collection(db, 'messages'), {
        text: messageInput,
        createdAt: serverTimestamp(),
        uid: currentUser.uid,
        sender: currentUser.name, 
        photoURL: currentUser.avatar,
        room: activeChat.id, 
        type: 'text'
      });
      
      const groupRef = doc(db, 'groups', activeChat.id);
      updateDoc(groupRef, {
        description: `${currentUser.name}: ${messageInput}`,
        lastMessageTime: serverTimestamp()
      });
      setMessageInput('');
      await sendChatNotification(messageInput);
      
    } catch (error) {
      console.error("Send message error:", error);
    }
  };

  const handleSendLocation = async (locationData) => {
    if (!activeChat?.id || !locationData) return;

    try {
      await addDoc(collection(db, 'messages'), {
        text: `📍 ${locationData.name}`,
        createdAt: serverTimestamp(),
        uid: currentUser.uid,
        sender: currentUser.name,
        photoURL: currentUser.avatar,
        room: activeChat.id,
        type: 'location',
        location: {
          lat: locationData.lat,
          lng: locationData.lng,
          name: locationData.name,
          address: locationData.address || ''
        }
      });
      
      const groupRef = doc(db, 'groups', activeChat.id);
      updateDoc(groupRef, {
          description: `${currentUser.name}: 📍 แชร์ตำแหน่ง`,
          lastMessageTime: serverTimestamp()
      });

      setIsLocationModalOpen(false);
      await sendChatNotification(`📍 ${locationData.name}`);

    } catch (error) {
      console.error("Error sending location:", error);
      alert("เกิดข้อผิดพลาดในการส่งตำแหน่ง");
    }
  };

  const handleEndTrip = async () => {
    if (!activeChat?.id) return;
    
    // ✅ ย้ายเงื่อนไขการเช็ค isTripEnded มาไว้ตรงนี้
    if (isTripEnded) {
      alert('ทริปนี้ได้สิ้นสุดไปแล้ว');
      return;
    }

    if (window.confirm("ยืนยันที่จะจบขบวนทริปนี้?")) {
      try {
        const groupRef = doc(db, 'groups', activeChat.id);
        await updateDoc(groupRef, {
          status: 'ended',
          description: 'ทริปนี้จบแล้ว'
        });
        setIsTripEnded(true);
      } catch (error) { console.error(error); }
    }
  };

  // (filteredGroups - ส่วนนี้เหมือนเดิม)
  const filteredGroups = groups.filter(g => 
    g.name?.toLowerCase().includes(groupSearch.toLowerCase())
  )
  .sort((a, b) => {
    const isAEnded = a.status === 'ended';
    const isBEnded = b.status === 'ended';

    if (isAEnded && !isBEnded) {
      return 1; 
    }
    if (!isAEnded && isBEnded) {
      return -1; 
    }

    const timeA = a.lastMessageTime?.seconds || 0;
    const timeB = b.lastMessageTime?.seconds || 0;
    return timeB - timeA; 
  });

  return (
    <div className="chat">
      {!activeChat && <Navbar brand="TripTogether" />}

      <div className="chat-sidebar-wrapper">
        {!activeChat ? (
          <GroupList
            groups={filteredGroups}
            searchTerm={groupSearch}
            onSearchChange={setGroupSearch}
            onChatClick={handleChatClick}
            currentUser={currentUser}
          />
        ) : (
          <ChatWindow
            chat={{...activeChat, messages: messages}}
            messageInput={messageInput}
            isTripEnded={isTripEnded}
            
            onBack={handleBackToList}
            onEndTrip={handleEndTrip}
            
            onInputChange={setMessageInput}
            onSendMessage={handleSendMessage}
            
            onOpenLocationModal={() => setIsLocationModalOpen(true)}
            
            currentUser={currentUser}
          />
        )}
      </div>

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSendLocation={handleSendLocation}
      />
    </div>
  );
};

export default Chat;