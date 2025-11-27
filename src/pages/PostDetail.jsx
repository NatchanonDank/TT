import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import './PostDetail.css';

const PostDetail = ({ currentUser }) => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State สำหรับ PostCard
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [showComments, setShowComments] = useState(new Set([postId])); // เปิด comments ทันที
  const [commentInputs, setCommentInputs] = useState({});
  const [showDropdown, setShowDropdown] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);
        
        if (postSnap.exists()) {
          const postData = { id: postSnap.id, ...postSnap.data() };
          setPost(postData);
          
          // Check if liked - ตรวจสอบ currentUser ก่อน
          if (currentUser && postData.likes?.includes(currentUser.uid)) {
            setLikedPosts(new Set([postId]));
          }
        } else {
          setError('ไม่พบโพสต์นี้');
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('เกิดข้อผิดพลาดในการโหลดโพสต์');
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId, currentUser]);

  // PostCard handlers (จะต้อง integrate กับ Post.jsx)
  const toggleLike = async (id) => {
    // Implementation จาก Post.jsx
    console.log('Toggle like:', id);
  };

  const toggleComments = (id) => {
    setShowComments(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const handleCommentInput = (id, value) => {
    setCommentInputs(prev => ({ ...prev, [id]: value }));
  };

  const addComment = async (id) => {
    // Implementation จาก Post.jsx
    console.log('Add comment:', id);
  };

  const handleJoinChat = async (id) => {
    // Implementation จาก Post.jsx
    console.log('Join chat:', id);
  };

  const handleOpenEditModal = (post) => {
    console.log('Edit post:', post);
  };

  const deletePost = async (id) => {
    console.log('Delete post:', id);
  };

  const approveJoinRequest = (request) => {
    console.log('Approve:', request);
  };

  const rejectJoinRequest = (request) => {
    console.log('Reject:', request);
  };

  const handleReportPost = (post, user) => {
    console.log('Report:', post);
  };

  if (loading) {
    return (
      <div className="container">
        <Navbar brand="TripTogether" />
        <div className="loading-screen">กำลังโหลดโพสต์...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container">
        <Navbar brand="TripTogether" />
        <div className="post-detail-container">
          <button className="back-button" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
            <span>กลับหน้าหลัก</span>
          </button>
          <div className="error-message">{error || 'ไม่พบโพสต์'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Navbar brand="TripTogether" />
      
      <div className="post-detail-container">
        <button className="back-button" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          <span>กลับหน้าหลัก</span>
        </button>

        <div className="post-detail-content">
          <PostCard
            post={post}
            currentUser={currentUser}
            likedPosts={likedPosts}
            showComments={showComments}
            commentInputs={commentInputs}
            toggleLike={() => toggleLike(post.id)}
            toggleComments={toggleComments}
            handleCommentInput={handleCommentInput}
            addComment={addComment}
            handleJoinChat={() => handleJoinChat(post.id)}
            showDropdown={showDropdown}
            setShowDropdown={setShowDropdown}
            handleOpenEditModal={handleOpenEditModal}
            deletePost={deletePost}
            approveJoinRequest={approveJoinRequest}
            rejectJoinRequest={rejectJoinRequest}
            handleReportPost={handleReportPost}
          />
        </div>
      </div>
    </div>
  );
};

export default PostDetail;