import React, { createContext, useState, useContext } from 'react';

const PostContext = createContext();

export const PostProvider = ({ children }) => {
  const [posts, setPosts] = useState([
    {
      id: 101,
      author: {
        name: 'Doughnut',
        avatar: 'https://images.unsplash.com/photo-1543716091-a840c05249ec?w=200',
      },
      timestamp: '16 ตุลาคม 2025',
      title: 'ทริปเชียงใหม่กับ Nomad Collective',
      content: 'สวัสดีค่ะทุกคน! พรุ่งนี้เราเจอกันที่เชียงใหม่ 7:00 น.',
      images: ['https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800'],
      likes: 42,
      comments: [],
      isOwner: false,
      chatGroupId: '1',
      maxMembers: 10,
      currentMembers: 7,
      joinRequests: [], // ✅ เพิ่ม
      members: [], // ✅ เพิ่ม
    },
    {
      id: 102,
      author: {
        name: 'Karen',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
      },
      timestamp: '9 พฤษภาคม 2025',
      title: 'Chiang Mai',
      content: '🌸 Chiang Mai Escape – ทริปโรแมนติกเมืองเหนือ 🌺\n🗓 10–13 ธันวาคม 2025',
      images: ['https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=600&h=400&fit=crop'],
      likes: 12,
      comments: [],
      isOwner: true,
      chatGroupId: '2',
      maxMembers: 10,
      currentMembers: 1, // ✅ แก้จาก 10 เป็น 1 (เพื่อให้ทดสอบได้)
      joinRequests: [], // ✅ เพิ่ม
      members: [], // ✅ เพิ่ม
    },
  ]);

  const addPost = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const updatePost = (id, updatedData) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
  };

  const deletePost = (id) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  // ✅ เพิ่มฟังก์ชันส่ง request
  const sendJoinRequest = (postId, user) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const alreadyRequested = p.joinRequests?.some(r => r.userName === user.name);
        const alreadyMember = p.members?.some(m => m.userName === user.name);
        const isAuthor = p.author.name === user.name;
        
        if (alreadyRequested || alreadyMember || isAuthor) {
          return p;
        }

        return {
          ...p,
          joinRequests: [
            ...(p.joinRequests || []),
            {
              userId: Date.now(),
              userName: user.name,
              userAvatar: user.avatar,
              timestamp: new Date().toLocaleString('th-TH'),
            }
          ]
        };
      }
      return p;
    }));
  };

  // ✅ เพิ่มฟังก์ชันอนุมัติ
  const approveJoinRequest = (postId, userName) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const request = p.joinRequests?.find(r => r.userName === userName);
        if (!request) return p;

        return {
          ...p,
          joinRequests: p.joinRequests.filter(r => r.userName !== userName),
          members: [
            ...(p.members || []),
            request
          ],
          currentMembers: (p.currentMembers || 0) + 1
        };
      }
      return p;
    }));
  };

  // ✅ เพิ่มฟังก์ชันปฏิเสธ
  const rejectJoinRequest = (postId, userName) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          joinRequests: (p.joinRequests || []).filter(r => r.userName !== userName)
        };
      }
      return p;
    }));
  };

  return (
    <PostContext.Provider value={{ 
      posts, 
      addPost, 
      updatePost, 
      deletePost,
      sendJoinRequest, // ✅ เพิ่ม
      approveJoinRequest, // ✅ เพิ่ม
      rejectJoinRequest // ✅ เพิ่ม
    }}>
      {children}
    </PostContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('usePosts must be used within PostProvider');
  }
  return context;
};