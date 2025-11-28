import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from "../../components/Navbar";
import GroupList from './components/GroupList';
import ChatWindow from './components/ChatWindow';
import LocationModal from './components/LocationModel';
import './Chat.css';

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
  getDocs,
  arrayRemove,
  deleteDoc,
  setDoc
} from 'firebase/firestore';

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

  const { notifications } = useNotifications();

  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 900);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 900);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

    if (groups.length > 0) {
        selectGroupFromUrl();
    }
    
  }, [groupId, currentUser, groups, activeChat]);

  useEffect(() => {
    if (!activeChat?.id || !currentUser?.uid || !notifications) return;

    const markChatNotificationsAsRead = async () => {
      const unreadNotifsForThisChat = notifications.filter(n =>
        n.groupId === activeChat.id &&
        n.type === 'chat_message' &&
        n.read === false &&
        n.toUid === currentUser.uid 
      );

      if (unreadNotifsForThisChat.length === 0) return; 

      try {
        const batch = writeBatch(db);
        unreadNotifsForThisChat.forEach(notif => {
          const notifRef = doc(db, 'notifications', notif.id);
          batch.update(notifRef, { read: true });
        });
        await batch.commit();
      } catch (error) {
        console.error("Error marking chat notifications as read:", error);
      }
    };

    markChatNotificationsAsRead();
    
    setIsTripEnded(activeChat.status === 'ended');
    
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
    
  }, [activeChat, currentUser, notifications]); 

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

  const handleLeaveGroup = async () => {
    if (!activeChat?.id || !currentUser?.uid) return;

    if (activeChat.ownerId === currentUser.uid) {
      alert('หัวหน้าทริปไม่สามารถออกจากกลุ่มได้ กรุณาสิ้นสุดทริปแทน');
      return;
    }

    try {
      const groupRef = doc(db, 'groups', activeChat.id);
      const memberToRemove = activeChat.members.find(m => m.uid === currentUser.uid);
      
      if (!memberToRemove) {
        alert('ไม่พบข้อมูลสมาชิก');
        return;
      }

      await updateDoc(groupRef, {
        members: arrayRemove(memberToRemove),
        memberUids: arrayRemove(currentUser.uid),
        currentMembers: (activeChat.currentMembers || 1) - 1
      });

      alert('ออกจากกลุ่มสำเร็จ');
      setActiveChat(null);
      setMessages([]);
      navigate('/chat');

    } catch (error) {
      console.error('Error leaving group:', error);
      alert('เกิดข้อผิดพลาดในการออกจากกลุ่ม');
    }
  };

  const handleEndTrip = async () => {
    if (!activeChat?.id) return;

    if (activeChat.ownerId !== currentUser?.uid) {
      alert('ขออภัย เฉพาะหัวหน้าทริป (Leader) เท่านั้นที่สามารถจบทริปได้');
      return;
    }

    if (isTripEnded) {
      alert('ทริปนี้ได้สิ้นสุดไปแล้ว');
      return;
    }

    if (activeChat.currentMembers === 1) {
      if (window.confirm("เนื่องจากมีสมาชิกเพียง 1 คน การจบทริปจะเป็นการ 'ลบทริป' ออกจากระบบ ยืนยันหรือไม่?")) {
         try {
           await deleteDoc(doc(db, 'groups', activeChat.id));
           await deleteDoc(doc(db, 'posts', activeChat.id));
           
           alert('ลบทริปเรียบร้อยแล้ว');
           navigate('/homepage'); 
         } catch (error) {
           console.error("Error deleting trip:", error);
           alert("เกิดข้อผิดพลาดในการลบทริป");
         }
      }
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

  const handleEditMessage = async (messageId, newText) => {
    if (!newText.trim()) return;
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        text: newText,
        isEdited: true,
        editedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error editing message:", error);
    }
  };

  const handleDeleteMessage = async (message) => {
    if (!window.confirm("ต้องการลบข้อความนี้ใช่หรือไม่?")) return;
    try {
      await setDoc(doc(db, 'deleted_messages', message.id), {
        ...message,
        deletedAt: serverTimestamp(),
        deletedBy: currentUser.uid
      });

      const messageRef = doc(db, 'messages', message.id);
      await updateDoc(messageRef, {
        text: "ข้อความนี้ถูกลบแล้ว",
        isDeleted: true,
        type: 'deleted', 
        originalType: message.type 
      });
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const groupsWithUnread = groups.map(group => {

    const unreadCount = notifications ? notifications.filter(n => 
      n.groupId === group.id && 
      n.type === 'chat_message' && 
      !n.read
    ).length : 0;
    
    return { ...group, unread: unreadCount };
  });

  const filteredGroups = groupsWithUnread.filter(g => 
    g.name?.toLowerCase().includes(groupSearch.toLowerCase())
  )
  .sort((a, b) => {
    const isAEnded = a.status === 'ended';
    const isBEnded = b.status === 'ended';

    if (isAEnded && !isBEnded) return 1; 
    if (!isAEnded && isBEnded) return -1; 

    const timeA = a.lastMessageTime?.seconds || 0;
    const timeB = b.lastMessageTime?.seconds || 0;
    return timeB - timeA; 
  });

  return (
    <div className="chat">
      {(!isMobileView || !activeChat) && <Navbar brand="TripTogether" />}

      <div className={`chat-container ${!isMobileView ? 'split-view' : ''}`}>
        
        <div className={`groups-sidebar ${activeChat && isMobileView ? 'hidden' : ''}`}>
          <GroupList
            groups={filteredGroups}
            searchTerm={groupSearch}
            onSearchChange={setGroupSearch}
            onChatClick={handleChatClick}
            currentUser={currentUser}
            activeGroupId={activeChat?.id}
          />
        </div>

        {activeChat ? (
          <div className="chat-main">
            <ChatWindow
              chat={{...activeChat, messages: messages}}
              messageInput={messageInput}
              isTripEnded={isTripEnded}
              
              onBack={handleBackToList}
              onEndTrip={handleEndTrip}
              onLeaveGroup={handleLeaveGroup}
              
              onInputChange={setMessageInput}
              onSendMessage={handleSendMessage}
              
              onOpenLocationModal={() => setIsLocationModalOpen(true)}
              
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              
              currentUser={currentUser}
            />
          </div>
        ) : (
          !isMobileView && (
            <div className="chat-empty-state">
              <div className="empty-icon">💬</div>
              <h3>เลือกกลุ่มเพื่อเริ่มสนทนา</h3>
              <p>เลือกกลุ่มจากรายการด้านซ้ายเพื่อดูข้อความ</p>
            </div>
          )
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