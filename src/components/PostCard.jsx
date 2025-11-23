import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, MoreVertical, Edit, Trash2, Send, X, ChevronLeft, ChevronRight, Flag } from 'lucide-react'; 
import { Link } from 'react-router-dom'; 
import './PostCard.css';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';


const PostCard = ({
  post,
  currentUser,
  likedPosts,
  showComments,
  commentInputs,
  toggleLike,
  toggleComments,
  handleCommentInput,
  addComment,
  handleJoinChat,
  showDropdown,
  setShowDropdown,
  handleOpenEditModal,
  deletePost,
  approveJoinRequest,
  rejectJoinRequest,
  handleReportPost 
}) => {
  
  const isLeader = post.uid === currentUser?.uid;
  const hasRequested = post.joinRequests?.some(r => r.uid === currentUser?.uid);
  const isMember = post.members?.some(m => m.uid === currentUser?.uid);
  const isFull = post.currentMembers >= post.maxMembers;
  const isLiked = post.likes?.includes(currentUser?.uid);

  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleApprove = (request) => {
    approveJoinRequest(request);
  };

  const handleReject = (request) => {
    rejectJoinRequest(request);
  };

  const openImageViewer = (index) => { setCurrentImageIndex(index); setIsViewerOpen(true); document.body.style.overflow = 'hidden'; };
  const closeImageViewer = () => { setIsViewerOpen(false); document.body.style.overflow = 'auto'; };
  const nextImage = () => { setCurrentImageIndex((prev) => prev === post.images.length - 1 ? 0 : prev + 1); };
  const prevImage = () => { setCurrentImageIndex((prev) => prev === 0 ? post.images.length - 1 : prev - 1); };

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
      <div className="post-card">
   
        <div className="post-header">
          <div className="post-author">
         
            <Link to={`/profile/${post.author?.uid}`}>
              <img src={post.author?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="avatar" className="author-avatar" />
            </Link>
            <div className="author-info">
           
              <h3 className="author-name">
                <Link to={`/profile/${post.author?.uid}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {post.author?.name || 'Unknown'}
                </Link>
                {isLeader && <span className="leader-badge">Leader</span>}
              </h3>
              <p>{post.timestamp}</p>
            </div>
          </div>
          
        
          <div className="dropdown">
            <button className="dropdown-btn" onClick={() => setShowDropdown(showDropdown === post.id ? null : post.id)}>
              <MoreVertical size={20} />
            </button>
            {showDropdown === post.id && (
              <div className="dropdown-menu">
                {isLeader ? (
                  <>
                    <button className="dropdown-item" onClick={() => handleOpenEditModal(post)}><Edit size={16} /> แก้ไข</button>
                    <button className="dropdown-item delete" onClick={() => deletePost(post.id)}><Trash2 size={16} /> ลบ</button>
                  </>
                ) : (
                
                  <button className="dropdown-item delete" onClick={() => handleReportPost(post, currentUser)}>
                    <Flag size={16} /> รายงานโพสต์
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

      
        <div className="post-body">
          {post.title && <h2 className="post-title">{post.title}</h2>}
          {post.content && <p className="post-description">{post.content}</p>}
          {post.text && <p className="post-description">{post.text}</p>}

          {post.images && post.images.length > 0 && (
            <div className={`post-image-gallery images-${Math.min(post.images.length, 5)}`}>
              {post.images.slice(0, 4).map((imageUrl, index) => (
                <img key={index} src={imageUrl} alt="post" onClick={() => openImageViewer(index)} />
              ))}
              {post.images.length > 4 && (
                <div className="more-images-overlay" onClick={() => openImageViewer(3)}>+{post.images.length - 4}</div>
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
                    <img src={request.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt={request.name} className="request-avatar" />
                  </Link>
                  <div className="request-info">
                   
                    <p className="request-name">
                      <Link to={`/profile/${request.uid}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {request.name}
                      </Link>
                    </p>
                    <span className="request-time">ขอเมื่อ: {new Date(request.requestedAt).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'})}</span>
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
              {post.currentMembers}/{post.maxMembers} คน {isFull && ' - เต็มแล้ว!'}
            </div>
            
            {isMember ? (
              <button className="join-now-btn member" disabled>✓ เป็นสมาชิกแล้ว</button>
            ) : hasRequested ? (
              <button className="join-now-btn pending" disabled>⏳ รอการอนุมัติ</button>
            ) : (
              <button 
                className="join-now-btn" 
                onClick={handleJoinChat} 
                disabled={isFull}
              >
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
                    <img src={comment.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="comment-avatar" alt="user"/>
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
            <img src={post.images ? post.images[currentImageIndex] : (post.image ? post.image : '')} alt="Fullscreen" />
          </div>
        </div>
      )}
    </>
  );
};

export default PostCard;