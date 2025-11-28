import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, MoreVertical, Edit, Trash2, Send, X, ChevronLeft, ChevronRight, Flag, Star } from 'lucide-react'; 
import { Link, useNavigate } from 'react-router-dom'; 
import './PostCard.css';
import Feb from './Feb'; 
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  deleteDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';

const PostCard = ({
  post,
  currentUser,
  likedPosts: likedPostsFromParent,
  showComments: showCommentsFromParent,
  commentInputs: commentInputsFromParent,
  toggleLike: toggleLikeFromParent,
  toggleComments: toggleCommentsFromParent,
  handleCommentInput: handleCommentInputFromParent,
  addComment: addCommentFromParent,
  handleJoinChat: handleJoinChatFromParent,
  showDropdown: showDropdownFromParent,
  setShowDropdown: setShowDropdownFromParent,
  handleOpenEditModal: handleOpenEditModalFromParent,
  deletePost: deletePostFromParent,
  approveJoinRequest: approveJoinRequestFromParent,
  rejectJoinRequest: rejectJoinRequestFromParent,
  handleReportPost: handleReportPostFromParent,
  onUpdatePost 
}) => {
  
  const navigate = useNavigate();
  
  const [internalShowComments, setInternalShowComments] = useState(new Set());
  const [internalCommentInputs, setInternalCommentInputs] = useState({});
  const [internalShowDropdown, setInternalShowDropdown] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [authorRating, setAuthorRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const showComments = showCommentsFromParent || internalShowComments;
  const commentInputs = commentInputsFromParent || internalCommentInputs;
  const showDropdown = showDropdownFromParent !== undefined ? showDropdownFromParent : internalShowDropdown;
  const setShowDropdown = setShowDropdownFromParent || setInternalShowDropdown;
  
  const postAuthorUid = post.author?.uid || post.uid;
  const isLeader = postAuthorUid === currentUser?.uid;
  
  const hasRequested = post.joinRequests?.some(r => r.uid === currentUser?.uid);
  const isMember = post.members?.some(m => m.uid === currentUser?.uid);
  const isFull = post.currentMembers >= post.maxMembers;
  const isLiked = post.likes?.includes(currentUser?.uid);

  const isTripFinished = post.status === 'ended' || (post.endDate && new Date() > new Date(new Date(post.endDate).setHours(23, 59, 59, 999)));

  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchAuthorRating = async () => {
      if (!postAuthorUid) return;
      try {
        const q = query(
          collection(db, 'friend_reviews'),
          where('targetUserId', '==', postAuthorUid)
        );
        const querySnapshot = await getDocs(q);
        const reviews = querySnapshot.docs.map(doc => doc.data());
        
        if (reviews.length > 0) {
          const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
          setAuthorRating(totalRating / reviews.length);
          setReviewCount(reviews.length);
        } else {
          setAuthorRating(0);
          setReviewCount(0);
        }
      } catch (error) {
        console.error("Error fetching author rating:", error);
      }
    };

    fetchAuthorRating();
  }, [postAuthorUid]);

  const internalToggleLike = async () => {
    if (!currentUser) return;
    
    try {
      const postRef = doc(db, 'posts', post.id);
      if (isLiked) {
        await updateDoc(postRef, { likes: arrayRemove(currentUser.uid) });
      } else {
        await updateDoc(postRef, { likes: arrayUnion(currentUser.uid) });
        
        if (postAuthorUid !== currentUser.uid) {
          await addDoc(collection(db, 'notifications'), {
            toUid: postAuthorUid,
            fromUid: currentUser.uid,
            fromName: currentUser.name,
            fromAvatar: currentUser.avatar,
            message: `ถูกใจทริป "${post.title}" ของคุณ`,
            type: 'like',
            postId: post.id,
            read: false,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const internalToggleComments = (postId) => {
    setInternalShowComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) newSet.delete(postId);
      else newSet.add(postId);
      return newSet;
    });
  };

  const internalHandleCommentInput = (postId, value) => {
    setInternalCommentInputs(prev => ({ ...prev, [postId]: value }));
  };

  const internalAddComment = async (postId) => {
    if (!currentUser) return;
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;

    try {
      const postRef = doc(db, 'posts', postId);
      const newComment = {
        author: currentUser.name || 'User',
        avatar: currentUser.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        uid: currentUser.uid,
        text: commentText,
        timestamp: new Date().toISOString()
      };
      await updateDoc(postRef, { comments: arrayUnion(newComment) });
      setInternalCommentInputs(prev => ({ ...prev, [postId]: '' }));

      if (postAuthorUid !== currentUser.uid) {
        await addDoc(collection(db, 'notifications'), {
          toUid: postAuthorUid,
          fromUid: currentUser.uid,
          fromName: currentUser.name,
          fromAvatar: currentUser.avatar,
          message: `แสดงความคิดเห็นในทริป "${post.title}": ${commentText}`,
          type: 'comment',
          postId: post.id,
          read: false,
          createdAt: serverTimestamp()
        });
      }

    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const internalHandleJoinChat = async () => {
    if (!currentUser || hasRequested || isMember || isFull) return;
    try {
      const postRef = doc(db, 'posts', post.id);
      const joinRequest = {
        uid: currentUser.uid,
        name: currentUser.name || 'User',
        avatar: currentUser.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        requestedAt: new Date().toISOString()
      };
      await updateDoc(postRef, { joinRequests: arrayUnion(joinRequest) });
      
      if (postAuthorUid !== currentUser.uid) {
        await addDoc(collection(db, 'notifications'), {
          toUid: postAuthorUid,
          fromUid: currentUser.uid,
          fromName: currentUser.name,
          fromAvatar: currentUser.avatar,
          message: `ขอเข้าร่วมทริป "${post.title}"`,
          type: 'join_request',
          postId: post.id,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      alert('ส่งคำขอเข้าร่วมกลุ่มเรียบร้อยแล้ว!');
    } catch (error) {
      console.error('Error requesting to join:', error);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  };

  const internalDeletePost = async (postId) => {
    if (!window.confirm('คุณต้องการลบโพสต์นี้ใช่หรือไม่?')) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      alert('ลบโพสต์สำเร็จ');
      window.location.reload();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('เกิดข้อผิดพลาดในการลบโพสต์');
    }
  };

  const internalHandleReportPost = async (post, currentUser) => {
    if (!currentUser) return;
    const reason = prompt('กรุณาระบุเหตุผลในการรายงานโพสต์นี้:');
    if (reason && reason.trim().length > 0) {
      try {
        await addDoc(collection(db, 'reports'), {
          reporterUid: currentUser.uid,
          reporterName: currentUser.name || 'User',
          postId: post.id,
          postTitle: post.title || 'ไม่มีชื่อ',
          postAuthorUid: postAuthorUid,
          reason: reason,
          createdAt: serverTimestamp(),
          status: 'pending'
        });
        alert('ส่งรายงานของคุณเรียบร้อยแล้ว');
      } catch (error) {
        console.error('Error reporting post:', error);
        alert('เกิดข้อผิดพลาดในการส่งรายงาน');
      }
    }
  };

  const internalHandleOpenEditModal = () => {
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (postData) => {
    try {
        const postRef = doc(db, 'posts', post.id);
        await updateDoc(postRef, postData);

        if (onUpdatePost) {
            onUpdatePost({ ...post, ...postData });
        } else {
            window.location.reload();
        }
        setIsEditModalOpen(false);
        alert('แก้ไขโพสต์สำเร็จ!');
    } catch (error) {
        console.error("Error updating post:", error);
        alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const internalApproveJoinRequest = async (request) => {
    if (!currentUser || !isLeader) return;
    if (post.currentMembers >= post.maxMembers) {
      alert('กลุ่มเต็มแล้ว ไม่สามารถเพิ่มสมาชิกได้');
      return;
    }
    try {
      const postRef = doc(db, 'posts', post.id);
      const newMember = { uid: request.uid, name: request.name, avatar: request.avatar };
      await updateDoc(postRef, {
        joinRequests: arrayRemove(request),
        members: arrayUnion(newMember),
        currentMembers: (post.currentMembers || 1) + 1
      });

      await addDoc(collection(db, 'notifications'), {
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

      alert(`อนุมัติ ${request.name} เรียบร้อยแล้ว`);
    } catch (error) {
      console.error('Error approving request:', error);
      alert('เกิดข้อผิดพลาดในการอนุมัติ');
    }
  };

  const internalRejectJoinRequest = async (request) => {
    if (!currentUser || !isLeader) return;
    try {
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, { joinRequests: arrayRemove(request) });

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
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('เกิดข้อผิดพลาดในการปฏิเสธ');
    }
  };

  const toggleLike = toggleLikeFromParent || internalToggleLike;
  const toggleComments = toggleCommentsFromParent || internalToggleComments;
  const handleCommentInput = handleCommentInputFromParent || internalHandleCommentInput;
  const addComment = addCommentFromParent || internalAddComment;
  const handleJoinChat = handleJoinChatFromParent || internalHandleJoinChat;
  const deletePost = deletePostFromParent || internalDeletePost;
  const handleReportPost = handleReportPostFromParent || internalHandleReportPost;
  
  const handleOpenEditModal = handleOpenEditModalFromParent || internalHandleOpenEditModal;
  
  const approveJoinRequest = approveJoinRequestFromParent || internalApproveJoinRequest;
  const rejectJoinRequest = rejectJoinRequestFromParent || internalRejectJoinRequest;

  const handleApprove = (request) => approveJoinRequest(request);
  const handleReject = (request) => rejectJoinRequest(request);

  const openImageViewer = (index) => { 
    setCurrentImageIndex(index); 
    setIsViewerOpen(true); 
    document.body.style.overflow = 'hidden'; 
  };
  
  const closeImageViewer = () => { 
    setIsViewerOpen(false); 
    document.body.style.overflow = 'auto'; 
  };
  
  const nextImage = () => { 
    setCurrentImageIndex((prev) => prev === post.images.length - 1 ? 0 : prev + 1); 
  };
  
  const prevImage = () => { 
    setCurrentImageIndex((prev) => prev === 0 ? post.images.length - 1 : prev - 1); 
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isViewerOpen) return;
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'Escape') closeImageViewer();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewerOpen]);

  return (
    <>
      <div className={`post-card ${isTripFinished ? 'trip-finished' : ''}`}>
        <div className="post-header">
          <div className="post-author">
            <Link to={`/profile/${postAuthorUid}`}>
              <img 
                src={post.author?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                alt="avatar" 
                className="author-avatar" 
              />
            </Link>
            <div className="author-info">
              <h3 className="author-name">
                <Link to={`/profile/${postAuthorUid}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {post.author?.name || 'Unknown'}
                </Link>
                {isLeader && <span className="leader-badge">Leader</span>}
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '2px 0' }}>
                <Star size={14} fill={authorRating > 0 ? "#FFD700" : "none"} color={authorRating > 0 ? "#FFD700" : "#999"} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#444' }}>
                  {authorRating > 0 ? authorRating.toFixed(1) : 'New'}
                </span>
                {reviewCount > 0 && (
                  <span style={{ fontSize: '12px', color: '#888' }}>({reviewCount} รีวิว)</span>
                )}
              </div>

              <p>{post.timestamp || 'เมื่อสักครู่'}</p>
            </div>
          </div>
          
          <div className="dropdown">
            <button 
              className="dropdown-btn" 
              onClick={() => setShowDropdown(showDropdown === post.id ? null : post.id)}
            >
              <MoreVertical size={20} />
            </button>
            {showDropdown === post.id && (
              <div className="dropdown-menu">
                {isLeader ? (
                  <>
                    <button 
                      className={`dropdown-item ${isTripFinished ? 'disabled' : ''}`} 
                      onClick={() => {
                          if (isTripFinished) {
                              alert('ไม่สามารถแก้ไขทริปที่จบไปแล้วได้');
                              return;
                          }
                          handleOpenEditModal(post);
                      }}
                      disabled={isTripFinished} 
                      style={isTripFinished ? { opacity: 0.5, cursor: 'not-allowed', color: '#999' } : {}} 
                    >
                      <Edit size={16} /> {isTripFinished ? 'แก้ไขไม่ได้ (จบแล้ว)' : 'แก้ไข'}
                    </button>
                    <button 
                      className="dropdown-item delete" 
                      onClick={() => deletePost(post.id)}
                    >
                      <Trash2 size={16} /> ลบ
                    </button>
                  </>
                ) : (
                  <button 
                    className="dropdown-item delete" 
                    onClick={() => handleReportPost(post, currentUser)}
                  >
                    <Flag size={16} /> รายงานโพสต์
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="post-body">
          {post.destination && (
            <p className="post-destination">📍 {post.destination}</p>
          )}
          
          <div className="post-title-row" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px'}}>
            {post.title && <h2 className="post-title">{post.title}</h2>}
            
            {isTripFinished && (
              <span className="trip-status-badge ended">
                🏁 ทริปจบแล้ว
              </span>
            )}
          </div>

          {post.content && <p className="post-description">{post.content}</p>}
          {post.text && <p className="post-description">{post.text}</p>}
          {post.description && <p className="post-description">{post.description}</p>}

          {post.startDate && post.endDate && (
            <div className="post-trip-dates">
              <div className="trip-date-item">
                <span className="date-label">📅 เริ่ม:</span>
                <span className="date-value">
                  {new Date(post.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="trip-date-item">
                <span className="date-label">🏁 สิ้นสุด:</span>
                <span className="date-value">
                  {new Date(post.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>  
            </div>
          )}

          {post.images && post.images.length > 0 && (
            <div className={`post-image-gallery images-${Math.min(post.images.length, 5)}`}>
              {post.images.slice(0, 4).map((imageUrl, index) => (
                <img 
                  key={index} 
                  src={imageUrl} 
                  alt="post" 
                  onClick={() => openImageViewer(index)} 
                />
              ))}
              {post.images.length > 4 && (
                <div 
                  className="more-images-overlay" 
                  onClick={() => openImageViewer(3)}
                >
                  +{post.images.length - 4}
                </div>
              )}
            </div>
          )}
        </div>
        
        {isLeader && post.joinRequests && post.joinRequests.length > 0 && (
          <div className="pending-requests-section">
            <h4 className="pending-requests-title">🔔 คำขอเข้าร่วม ({post.joinRequests.length})</h4>
            <div className="pending-requests-list">
              {post.joinRequests.map((request, idx) => (
                <div key={idx} className="request-item">
                  <Link to={`/profile/${request.uid}`}>
                    <img 
                      src={request.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                      alt={request.name} 
                      className="request-avatar" 
                    />
                  </Link>
                  <div className="request-info">
                    <p className="request-name">
                      <Link to={`/profile/${request.uid}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {request.name}
                      </Link>
                    </p>
                    <span className="request-time">
                      ขอเมื่อ: {new Date(request.requestedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="request-actions">
                    <button className="approve-btn" onClick={() => handleApprove(request)}>✓ อนุมัติ</button>
                    <button className="reject-btn" onClick={() => handleReject(request)}>✕ ปฏิเสธ</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="post-actions">
          <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={toggleLike}>
            <Heart size={20} fill={isLiked ? "#f5533d" : "none"} color={isLiked ? "#f5533d" : "currentColor"} />
            <span>{post.likes?.length || 0}</span>
          </button>
          <button className="action-btn" onClick={() => toggleComments(post.id)}>
            <MessageCircle size={20} />
            <span>{post.comments?.length || 0}</span>
          </button>
        </div>

        {!isLeader && (
          <div className="post-join-section">
            <div className={`post-member-count ${isFull ? 'full' : ''}`}>
              {post.currentMembers || 1}/{post.maxMembers || 10} คน {isFull && ' - เต็มแล้ว!'}
            </div>
            {isMember ? (
              <button className="join-now-btn member" disabled>✓ เป็นสมาชิกแล้ว</button>
            ) : hasRequested ? (
              <button className="join-now-btn pending" disabled>⏳ รอการอนุมัติ</button>
            ) : isTripFinished ? (
              <button className="join-now-btn" disabled style={{ background: '#ccc', cursor: 'not-allowed' }}>
                🏁 ทริปจบแล้ว
              </button>
            ) : (
              <button className="join-now-btn" onClick={handleJoinChat} disabled={isFull}>
                {isFull ? '❌ กลุ่มเต็มแล้ว' : '📨 ขอเข้าร่วมกลุ่ม'}
              </button>
            )}
          </div>
        )}

        {showComments.has(post.id) && (
          <div className="comments-section">
            <div className="comments-list">
              {post.comments?.map((comment, idx) => (
                <div key={idx} className="comment-item">
                  <Link to={`/profile/${comment.uid}`}>
                    <img 
                      src={comment.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                      className="comment-avatar" alt="user"
                    />
                  </Link>
                  <div className="comment-bubble">
                    <Link to={`/profile/${comment.uid}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 'bold' }}>
                      <span className="comment-author">{comment.author}</span>
                    </Link>
                    <p>{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="comment-input-wrapper">
              <input
                type="text"
                placeholder="เขียนความคิดเห็น..."
                value={commentInputs[post.id] || ''}
                onChange={(e) => handleCommentInput(post.id, e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
                className="comment-input"
              />
              <button className="send-comment-btn" onClick={() => addComment(post.id)}>
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {isViewerOpen && (
        <div className="image-viewer-overlay" onClick={closeImageViewer}>
          <button className="viewer-close" onClick={closeImageViewer}><X size={32} /></button>
          {(post.images?.length > 1) && (
            <>
              <button className="viewer-nav viewer-prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}><ChevronLeft size={40} /></button>
              <button className="viewer-nav viewer-next" onClick={(e) => { e.stopPropagation(); nextImage(); }}><ChevronRight size={40} /></button>
            </>
          )}
          <div className="viewer-content" onClick={(e) => e.stopPropagation()}>
            <img src={post.images ? post.images[currentImageIndex] : (post.image || '')} alt="Fullscreen" />
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <Feb
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleEditSubmit}
          post={post}
        />
      )}
    </>
  );
};

export default PostCard;