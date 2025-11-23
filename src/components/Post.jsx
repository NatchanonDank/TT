import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Feb from './Feb'; 
import PostCard from './PostCard';
import './Post.css';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc,
  doc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';

const Post = ({ currentUser, searchTerm = '', filterByOwner = false, ownerId = null }) => {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [showComments, setShowComments] = useState(new Set());
  const [showDropdown, setShowDropdown] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
   
    if (filterByOwner && !ownerId) {
     
      return; 
    }
    setLoading(true);

    const postsRef = collection(db, 'posts');
    let q;

    if (filterByOwner && ownerId) {
      q = query(
        postsRef, 
        where('uid', '==', ownerId), 
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(postsRef, orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(loadedPosts);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filterByOwner, ownerId, currentUser]); 

  const handleOpenCreateModal = () => {
    if (!currentUser) { 
       alert("กรุณาเข้าสู่ระบบก่อนสร้างโพสต์");
       navigate('/login');
       return;
    }
    setEditingPost(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (post) => {
    setEditingPost(post);
    setIsModalOpen(true);
  };

  
  const createPost = async (postData) => {
    if (!currentUser) return;

  
    try {
      const docRef = await addDoc(collection(db, 'posts'), {
        ...postData, 
        uid: currentUser.uid,
        author: {
           name: currentUser.name,
           avatar: currentUser.avatar,
           uid: currentUser.uid
        },
        likes: [],
        comments: [],
        joinRequests: [],
        members: [
           { name: currentUser.name, avatar: currentUser.avatar, uid: currentUser.uid }
        ],
        currentMembers: 1,
        createdAt: serverTimestamp(),
        timestamp: new Date().toLocaleString('th-TH')
      });
      
      const postId = docRef.id;

     
      const groupRef = doc(db, 'groups', postId);
      await setDoc(groupRef, {
          id: postId,
          name: postData.title, 
          avatar: postData.images && postData.images.length > 0 ? postData.images[0] : currentUser.avatar, // ✅ ใช้ Base64 รูปแรก
          description: `กลุ่มแชทสำหรับทริป: ${postData.title}`,
          maxMembers: parseInt(postData.maxMembers) || 10,
          currentMembers: 1,
          status: 'active',
          ownerId: currentUser.uid,
          memberUids: [currentUser.uid],
          members: [{ name: currentUser.name, avatar: currentUser.avatar, uid: currentUser.uid }]
      });

      await updateDoc(docRef, { chatGroupId: postId });
      
      setIsModalOpen(false);
      
    } catch (error) {
      console.error("Error creating post/group:", error);
      alert("สร้างโพสต์ไม่สำเร็จ: " + error.message);
    }
  };


  const updatePost = async (updatedData) => {
    if (!editingPost) return;
    try {
      const postRef = doc(db, 'posts', editingPost.id);
      

      await updateDoc(postRef, {
        title: updatedData.title,
        content: updatedData.content,
        images: updatedData.images,
        maxMembers: Math.max(
           editingPost.currentMembers, 
           Math.min(updatedData.maxMembers || editingPost.maxMembers, 50)
        )
      });
      setIsModalOpen(false);
      setEditingPost(null);
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };

  const deletePost = async (postId) => {
    if (window.confirm("ยืนยันการลบโพสต์?")) {
      try {
        await deleteDoc(doc(db, 'posts', postId));
        await deleteDoc(doc(db, 'groups', postId));
     
      } catch (error) {
        console.error("Error deleting post:", error);
        alert("เกิดข้อผิดพลาดในการลบ: " + error.message);
      }
    }
  };

  const toggleLike = async (postId) => {
    if (!currentUser) { alert("กรุณาเข้าสู่ระบบ"); return; }
    
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const postRef = doc(db, 'posts', postId);
    const isLiked = post.likes?.includes(currentUser.uid);

    try {
      if (isLiked) {
        await updateDoc(postRef, { likes: arrayRemove(currentUser.uid) });
      } else {
        await updateDoc(postRef, { likes: arrayUnion(currentUser.uid) });
        
        if (post.uid !== currentUser.uid) {
           await addDoc(collection(db, 'notifications'), {
              toUid: post.uid, 
              type: 'like',
              message: `ถูกใจโพสต์ของคุณ "${post.title ? post.title.substring(0, 20) : 'รูปภาพ'}"`,
              fromName: currentUser.name,
              fromAvatar: currentUser.avatar,
              fromUid: currentUser.uid, 
              postId: postId,
              read: false,
              createdAt: serverTimestamp()
           });
        }
      }
    } catch (error) {
      console.error("Like error:", error);
    }
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

  const addComment = async (postId) => {
    const text = commentInputs[postId];
    if (!text?.trim() || !currentUser) { alert("กรุณาเข้าสู่ระบบ หรือ พิมพ์ข้อความ"); return; }

    const post = posts.find(p => p.id === postId); 

    try {
      const postRef = doc(db, 'posts', postId);
      const newComment = {
        id: Date.now(),
        uid: currentUser.uid, 
        author: currentUser.name,
        avatar: currentUser.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        text: text,
        timestamp: new Date().toLocaleString('th-TH')
      };

      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });

      if (post && post.uid !== currentUser.uid) {
          await addDoc(collection(db, 'notifications'), {
              toUid: post.uid,
              type: 'comment',
              message: `แสดงความคิดเห็น: "${text.substring(0, 30)}..."`,
              fromName: currentUser.name,
              fromAvatar: currentUser.avatar,
              fromUid: currentUser.uid, 
              postId: postId,
              read: false,
              createdAt: serverTimestamp()
          });
      }

      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (error) {
      console.error("Comment error:", error);
    }
  };

  const handleJoinChat = async (postId) => {
    if (!currentUser) { alert("กรุณาเข้าสู่ระบบ"); return; }
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const roomId = post.chatGroupId || postId; 

    const isMember = post.members?.some(m => m.uid === currentUser.uid);
    if (post.uid === currentUser.uid || isMember) {
        navigate(`/chat/${roomId}`); 
        return;
    }

    if (post.currentMembers >= post.maxMembers) {
        alert('กลุ่มเต็มแล้วครับ');
        return;
    }

    const hasRequested = post.joinRequests?.some(req => req.uid === currentUser.uid);
    if (hasRequested) {
        alert('คุณได้ส่งคำขอไปแล้ว รอการอนุมัติครับ');
        return;
    }

    try {
       const postRef = doc(db, 'posts', postId);
       await updateDoc(postRef, {
          joinRequests: arrayUnion({
             uid: currentUser.uid,
             name: currentUser.name,
             avatar: currentUser.avatar,
             requestedAt: new Date().toISOString()
          })
       });

       await addDoc(collection(db, 'notifications'), {
          toUid: post.uid, 
          type: 'join_request',
          message: `ขอเข้าร่วมทริป "${post.title || 'ของคุณ'}"`,
          fromName: currentUser.name,
          fromAvatar: currentUser.avatar,
          fromUid: currentUser.uid, 
          postId: postId,
          read: false,
          createdAt: serverTimestamp()
       });

       alert('ส่งคำขอเข้าร่วมสำเร็จ!');
    } catch (error) {
       console.error("Join request error:", error);
    }
  };

  const approveJoinRequest = async (postId, requestUser) => {
     if (!currentUser || !requestUser?.uid) return;
     
     try {
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);
        if (!postSnap.exists()) return;
        const postData = postSnap.data();
        const groupId = postData.chatGroupId || postId;
        const groupRef = doc(db, 'groups', groupId);

        const memberToAdd = {
            uid: requestUser.uid,
            name: requestUser.name || 'Member',
            avatar: requestUser.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
        };

        const updatedRequests = (postData.joinRequests || []).filter(req => req.uid !== requestUser.uid);
        const currentMembers = postData.members || [];
        let updatedMembers = [...currentMembers];
        if (!currentMembers.some(m => m.uid === requestUser.uid)) {
            updatedMembers.push(memberToAdd);
        }

        await updateDoc(postRef, {
           joinRequests: updatedRequests,
           members: updatedMembers,
           currentMembers: updatedMembers.length
        });
        
        await updateDoc(groupRef, {
           memberUids: arrayUnion(requestUser.uid),
           members: arrayUnion(memberToAdd), 
           currentMembers: updatedMembers.length
        });

        await addDoc(collection(db, 'notifications'), {
            toUid: requestUser.uid, 
            type: 'request_approved',
            message: `อนุมัติคำขอเข้าร่วมทริป "${postData.title || ''}" แล้ว 🎉`,
            fromName: currentUser.name,
            fromAvatar: currentUser.avatar,
            fromUid: currentUser.uid, 
            postId: postId,
            read: false,
            createdAt: serverTimestamp()
        });

        alert('อนุมัติสำเร็จ!');

     } catch (error) {
        console.error("Approve error:", error);
        alert("เกิดข้อผิดพลาด: " + error.message);
     }
  };

  const rejectJoinRequest = async (postId, requestUser) => {
     if (!currentUser || !requestUser?.uid) {
        console.error("Invalid request user data");
        return;
     }

     try {
        const postRef = doc(db, 'posts', postId);
        
        const postSnap = await getDoc(postRef);
        if (!postSnap.exists()) return;
        const postData = postSnap.data();

        const currentRequests = postData.joinRequests || [];
        const updatedRequests = currentRequests.filter(req => req.uid !== requestUser.uid);

        await updateDoc(postRef, {
           joinRequests: updatedRequests
        });

        await addDoc(collection(db, 'notifications'), {
            toUid: requestUser.uid,
            type: 'request_rejected',
            message: `ปฏิเสธคำขอเข้าร่วมทริป "${postData.title || ''}"`,
            fromName: currentUser.name,
            fromAvatar: currentUser.avatar,
            fromUid: currentUser.uid, 
            postId: postId,
            read: false,
            createdAt: serverTimestamp()
        });
        
        alert("ปฏิเสธคำขอเรียบร้อย");

     } catch (error) {
        console.error("Reject error:", error);
        alert("เกิดข้อผิดพลาด: " + error.message);
     }
  };

 
  const handleReportPost = async (postToReport, reporter) => {
    if (!reporter || !postToReport) { alert("กรุณาเข้าสู่ระบบ"); return; }

    const reason = prompt(`กรุณาระบุเหตุผลในการรายงานโพสต์ "${postToReport.title}":`);

    if (reason && reason.trim().length > 0) {
      try {
        await addDoc(collection(db, "reports"), {
          reporterUid: reporter.uid,
          reporterName: reporter.name,
          reportedUid: postToReport.author?.uid,
          reportedName: postToReport.author?.name,
          postId: postToReport.id,
          reason: reason,
          context: `Reported post: ${postToReport.title}`,
          createdAt: serverTimestamp(),
          status: "pending"
        });
        alert("ส่งรายงานโพสต์เรียบร้อยแล้ว ขอบคุณครับ");
      } catch (error) {
        console.error("Error submitting post report:", error);
        alert("เกิดข้อผิดพลาดในการส่งรายงาน");
      }
    } else if (reason !== null) {
      alert("กรุณาระบุเหตุผลในการรายงาน");
    }
  };

  const filteredPosts = posts.filter(post => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        post.title?.toLowerCase().includes(searchLower) ||
        (post.content || post.text)?.toLowerCase().includes(searchLower) || 
        post.author?.name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading) return <div className="loading-posts">กำลังโหลดโพสต์...</div>;

  return (
    <div className="post-container">
    
      {!filterByOwner && (
        <button className="post-fab" onClick={handleOpenCreateModal}>
          <Plus size={28} />
        </button>
      )}

      <div className="post-list">
        {filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <PostCard
              key={post.id}
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
              approveJoinRequest={(requestUser) => {
                  approveJoinRequest(post.id, requestUser);
              }}
              rejectJoinRequest={(requestUser) => {
                  rejectJoinRequest(post.id, requestUser);
              }}
              handleReportPost={handleReportPost} 
            />
          ))
        ) : (
          <div className="empty-state">
            {filterByOwner 
              ? 'ผู้ใช้คนนี้ยังไม่มีโพสต์' 
              : (searchTerm 
                  ? `ไม่พบโพสต์ที่ตรงกับการค้นหา "${searchTerm}"`
                  : 'ยังไม่มีโพสต์ในระบบ กดปุ่ม + เพื่อเริ่มสร้างโพสต์แรก!'
                )
            }
          </div>
        )}
      </div>
      
      <Feb
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={editingPost ? updatePost : createPost}
        post={editingPost}
      />
    </div>
  );
};

export default Post;