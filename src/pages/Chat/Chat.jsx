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
  getDoc
} from 'firebase/firestore';

const Chat = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [groupSearch, setGroupSearch] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const [isTripEnded, setIsTripEnded] = useState(false);
  
  // ✅ State สำหรับเปิด/ปิด Modal เลือกสถานที่
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false); 

  const [messageInput, setMessageInput] = useState('');
  const [groups, setGroups] = useState([]); 
  const [messages, setMessages] = useState([]); 

  // ... (useEffect 1-4 เหมือนเดิม ไม่ต้องแก้) ...
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

  // 3. Handle URL
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
           if (existingGroup.status === 'ended') {
              navigate(`/end-trip/${groupId}`);
              return;
           }
           setActiveChat(existingGroup);
        }
      } else {
        try {
          const groupRef = doc(db, 'groups', groupId);
          const groupSnap = await getDoc(groupRef);
          if (groupSnap.exists()) {
             const groupData = groupSnap.data();
             if (groupData.memberUids?.includes(currentUser.uid)) {
                 if (groupData.status === 'ended') {
                    navigate(`/end-trip/${groupId}`);
                 } else {
                    setActiveChat({ id: groupId, ...groupData });
                 }
             }
          }
        } catch (error) {
          console.error("Error fetching group:", error);
        }
      }
    };
    selectGroupFromUrl();
  }, [groupId, currentUser, groups]);

  // 4. Fetch Messages
  useEffect(() => {
    if (!activeChat?.id) return;
    setIsTripEnded(activeChat.status === 'ended');
    const q = query(
      collection(db, 'messages'),
      where('room', '==', activeChat.id),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
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
  }, [activeChat, currentUser]);

  // --- Handlers ---

  const handleChatClick = (group) => {
    if (!group?.id) return;
    if (group.status === 'ended') {
       navigate(`/end-trip/${group.id}`);
       return;
    }
    setActiveChat(group);
    navigate(`/chat/${group.id}`);
  };

  const handleBackToList = () => {
    setActiveChat(null);
    setMessages([]); 
    navigate('/chat'); 
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
    } catch (error) {
      console.error("Send message error:", error);
    }
  };

  // ✅ ฟังก์ชันรับค่า Location จาก Modal แล้วส่ง
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

      // ปิด Modal
      setIsLocationModalOpen(false);

    } catch (error) {
      console.error("Error sending location:", error);
      alert("เกิดข้อผิดพลาดในการส่งตำแหน่ง");
    }
  };

  const handleEndTrip = async () => {
    if (!activeChat?.id) return;
    if (window.confirm("ยืนยันที่จะจบขบวนทริปนี้?")) {
      try {
        const groupRef = doc(db, 'groups', activeChat.id);
        await updateDoc(groupRef, {
          status: 'ended',
          description: 'ทริปนี้จบแล้ว'
        });
        setIsTripEnded(true);
        // navigate(`/end-trip/${activeChat.id}`); 
      } catch (error) { console.error(error); }
    }
  };

  const filteredGroups = groups.filter(g => 
    g.name?.toLowerCase().includes(groupSearch.toLowerCase()) && 
    g.status !== 'ended'
  );

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
            
            // ✅ เปลี่ยนกลับมาเปิด Modal
            onOpenLocationModal={() => setIsLocationModalOpen(true)}
            
            currentUser={currentUser}
          />
        )}
      </div>

      {/* ✅ Modal เลือกสถานที่ */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSendLocation={handleSendLocation}
      />
    </div>
  );
};

export default Chat;