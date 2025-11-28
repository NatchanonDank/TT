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

  // State สำหรับ PostCard - เก็บเฉพาะที่จำเป็น
  const [showComments, setShowComments] = useState(new Set([postId])); // เปิด comments ทันที
  const [showDropdown, setShowDropdown] = useState(null);

  // ✨ เพิ่ม handler สำหรับ update post (สำหรับไลค์, คอมเมนต์, ฯลฯ)
  const handleUpdatePost = (updatedPost) => {
    setPost(updatedPost);
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);
        
        if (postSnap.exists()) {
          const postData = { id: postSnap.id, ...postSnap.data() };
          setPost(postData);
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
  }, [postId]);

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
          <button className="back-button" onClick={() => navigate('/homepage')}>
            <ArrowLeft size={20} />
            <span>กลับหน้าหลัก</span>
          </button>
          <div className="error-message">{error || 'ไม่พบโพสต์'}</div>
        </div>
      </div>
    );
  }
  
  const postAuthorUid = post.author?.uid || post.uid;
  const isLeader = postAuthorUid === currentUser?.uid;

  console.log('🔍 PostCard Debug:', {
    'Post Author UID': postAuthorUid,
    'Current User UID': currentUser?.uid,
    'Is Leader?': isLeader,
    'post.uid': post.uid,
    'post.author.uid': post.author?.uid
  });

  return (
    <div className="container">
      <Navbar brand="TripTogether" />
      
      <div className="post-detail-container">
        <button className="back-button" onClick={() => navigate('/homepage')}>
          <ArrowLeft size={20} />
          <span>กลับหน้าหลัก</span>
        </button>

        <div className="post-detail-content">
          {/* ✨ ส่ง onUpdatePost เพื่อให้ PostCard update state ได้ */}
          <PostCard
            post={post}
            currentUser={currentUser}
            showComments={showComments}
            showDropdown={showDropdown}
            setShowDropdown={setShowDropdown}
            onUpdatePost={handleUpdatePost}
          />
        </div>
      </div>
    </div>
  );
};

export default PostDetail;