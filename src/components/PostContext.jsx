import React, { createContext, useState, useContext } from 'react';

const PostContext = createContext();

export const PostProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);

  const addPost = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const updatePost = (id, updatedData) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
  };

  const deletePost = (id) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

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
      sendJoinRequest, 
      approveJoinRequest,
      rejectJoinRequest 
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