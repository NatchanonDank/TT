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
  arrayUnion,
  getDoc
} from 'firebase/firestore';

const Chat = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  
  // User State
  const [currentUser, setCurrentUser] = useState(null);
  
  // UI State
  const [groupSearch, setGroupSearch] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const [isTripEnded, setIsTripEnded] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  
  // Modal States (เหลือแค่ Location Modal)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false); 

  // Input State
  const [messageInput, setMessageInput] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchLocation, setSearchLocation] = useState('');
  
  // Data State
  const [groups, setGroups] = useState([]); 
  const [messages, setMessages] = useState([]); 

  // ----------------------------------------------------------------
  // 1. Auth Check & Load User
  // ----------------------------------------------------------------
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

  // ----------------------------------------------------------------
  // 2. Fetch "My Groups" (Real-time)
  // ----------------------------------------------------------------
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

  // ----------------------------------------------------------------
  // 3. Handle URL groupId & Select Chat (รวม Logic ตรวจสอบทริปจบ)
  // ----------------------------------------------------------------
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
             
             // ถ้าเป็นสมาชิกแล้ว ให้เข้าห้อง
             if (groupData.memberUids?.includes(currentUser.uid)) {
                 if (groupData.status === 'ended') {
                    navigate(`/end-trip/${groupId}`);
                 } else {
                    setActiveChat({ id: groupId, ...groupData });
                 }
             }
             // ถ้าไม่ได้เป็นสมาชิก อาจต้องแสดงปุ่ม Join ในหน้า Chat (แต่เราใช้ Post/Approve แทน)
          }
        } catch (error) {
          console.error("Error fetching group:", error);
        }
      }
    };

    selectGroupFromUrl();
  }, [groupId, currentUser, groups]); 

  // ----------------------------------------------------------------
  // 4. Fetch Messages for Active Chat (Real-time)
  // ----------------------------------------------------------------
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


  // ----------------------------------------------------------------
  // Actions & Handlers
  // ----------------------------------------------------------------

  // Logic การ Join ถูกย้ายไป Post.jsx
  // const joinGroup = async ... 

  const handleChatClick = (group) => {
    if (!group?.id) return;
    
    // ถ้าจบแล้ว ไปหน้า Endtrip
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

  const handleSendLocation = async () => {
    if (!selectedLocation || !activeChat?.id || isTripEnded) return;

    const locationText = selectedLocation.name
      ? '📍 ' + selectedLocation.name
      : '📍 พิกัด: ' + selectedLocation.lat.toFixed(6) + ', ' + selectedLocation.lng.toFixed(6);

    try {
      await addDoc(collection(db, 'messages'), {
        text: locationText,
        createdAt: serverTimestamp(),
        uid: currentUser.uid,
        sender: currentUser.name,
        photoURL: currentUser.avatar,
        room: activeChat.id,
        type: 'location',
        location: selectedLocation
      });

      setIsLocationModalOpen(false);
      setSelectedLocation(null);
      setSearchLocation('');
    } catch (error) {
      console.error("Send location error:", error);
    }
  };

  const handleEndTrip = async () => {
    if (!activeChat?.id) return;
    if (window.confirm("ยืนยันที่จะจบขบวนทริปนี้? สมาชิกจะไม่สามารถพิมพ์ข้อความได้อีก")) {
      try {
        const groupRef = doc(db, 'groups', activeChat.id);
        await updateDoc(groupRef, {
          status: 'ended',
          description: 'ทริปนี้จบแล้ว'
        });
        
        setIsTripEnded(true);
        setIsOptionsOpen(false);
        navigate(`/end-trip/${activeChat.id}`);
      } catch (error) {
        console.error("End trip error:", error);
      }
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target.result); 
      reader.readAsDataURL(file);
    }
  };

  // กรองเฉพาะกลุ่มที่ status !== 'ended' (กลุ่มแชทปัจจุบันเท่านั้น)
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
            isOptionsOpen={isOptionsOpen}
            onBack={handleBackToList}
            onToggleOptions={() => setIsOptionsOpen(prev => !prev)}
            onEndTrip={handleEndTrip}
            onInputChange={setMessageInput}
            onSendMessage={handleSendMessage}
            onOpenLocationModal={() => !isTripEnded && setIsLocationModalOpen(true)}
            currentUser={currentUser}
          />
        )}
      </div>

      <LocationModal
        isOpen={isLocationModalOpen}
        selectedLocation={selectedLocation}
        searchLocation={searchLocation}
        onClose={() => {
          setIsLocationModalOpen(false);
          setSelectedLocation(null);
          setSearchLocation('');
        }}
        onSearchChange={setSearchLocation}
        onSendLocation={handleSendLocation}
        onLocationChange={setSelectedLocation}
      />
    </div>
  );
};

export default Chat;