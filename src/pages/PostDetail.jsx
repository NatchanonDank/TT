import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  deleteDoc, 
  collection, 
  addDoc, 
  serverTimestamp,
  writeBatch 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import './PostDetail.css';

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          name: user.displayName || 'User',
          avatar: user.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
        });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const docRef = doc(db, 'posts', postId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPost({ id: docSnap.id, ...docSnap.data() });
        } else {
          alert('ไม่พบโพสต์ที่คุณต้องการ');
          navigate('/posts');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId, navigate]);

  const handleUpdatePost = (updatedData) => {
    setPost(prev => ({ ...prev, ...updatedData }));
  };

  const approveJoinRequest = async (request) => {
    if (!currentUser) return;
    
    if (post.currentMembers >= post.maxMembers) {
      alert('กลุ่มเต็มแล้ว ไม่สามารถเพิ่มสมาชิกได้');
      return;
    }

    try {
      const batch = writeBatch(db); 

      const postRef = doc(db, 'posts', post.id);
      const groupRef = doc(db, 'groups', post.id);

      const newMember = { 
        uid: request.uid, 
        name: request.name, 
        avatar: request.avatar 
      };

      batch.update(postRef, {
        joinRequests: arrayRemove(request),
        members: arrayUnion(newMember),
        currentMembers: (post.currentMembers || 1) + 1
      });

      batch.update(groupRef, {
        members: arrayUnion(newMember),
        memberUids: arrayUnion(request.uid), 
        currentMembers: (post.currentMembers || 1) + 1
      });

      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        toUid: request.uid,
        fromUid: currentUser.uid,
        fromName: currentUser.name,
        fromAvatar: currentUser.avatar,
        message: `อนุมัติคำขอเข้าร่วมทริป "${post.title}" แล้ว`,
        type: 'request_approved',
        postId: post.id,
        groupId: post.id, 
        read: false,
        createdAt: serverTimestamp()
      });

      await batch.commit(); 

      alert(`อนุมัติ ${request.name} เรียบร้อยแล้ว`);
      window.location.reload(); 

    } catch (error) {
      console.error('Error approving request:', error);
      alert('เกิดข้อผิดพลาดในการอนุมัติ');
    }
  };

  const rejectJoinRequest = async (request) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'posts', post.id), {
        joinRequests: arrayRemove(request)
      });
      
      await addDoc(collection(db, 'notifications'), {
        toUid: request.uid,
        fromUid: currentUser.uid,
        fromName: currentUser.name,
        fromAvatar: currentUser.avatar,
        message: `ปฏิเสธคำขอเข้าร่วมทริป "${post.title}"`,
        type: 'request_rejected',
        postId: post.id,
        read: false,
        createdAt: serverTimestamp()
      });

      alert(`ปฏิเสธคำขอของ ${request.name} แล้ว`);
      window.location.reload();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('เกิดข้อผิดพลาดในการปฏิเสธ');
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm('คุณต้องการลบโพสต์นี้ใช่หรือไม่?')) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      try { await deleteDoc(doc(db, 'groups', postId)); } catch(e) {} 
      alert('ลบโพสต์สำเร็จ');
      navigate('/posts');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('เกิดข้อผิดพลาดในการลบโพสต์');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!post) return null;

  return (
    <div className="post-detail-page">
      <Navbar brand="TripTogether" />
      <div className="post-detail-container">
        <PostCard 
          post={post} 
          currentUser={currentUser}
          approveJoinRequest={approveJoinRequest}
          rejectJoinRequest={rejectJoinRequest}
          deletePost={deletePost}
          onUpdatePost={handleUpdatePost}
        />
      </div>
    </div>
  );
};

export default PostDetail;