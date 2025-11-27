import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import Feb from '../components/Feb';
import './Post.css';

const Post = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  
  const [currentUser, setCurrentUser] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchQuery);
  
  // States for PostCard
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [showComments, setShowComments] = useState(new Set());
  const [commentInputs, setCommentInputs] = useState({});
  const [showDropdown, setShowDropdown] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  // Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          let userData = {
            uid: user.uid,
            name: user.displayName || 'User',
            avatar: user.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
          };

          if (userDoc.exists()) {
            const firestoreData = userDoc.data();
            if (firestoreData.avatar) userData.avatar = firestoreData.avatar;
            if (firestoreData.name) userData.name = firestoreData.name;
          }
          
          setCurrentUser(userData);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setCurrentUser({
            uid: user.uid,
            name: user.displayName || 'User',
            avatar: user.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
          });
        }
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Fetch All Posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsQuery = query(collection(db, 'posts'));
        const querySnapshot = await getDocs(postsQuery);
        const posts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // เรียงตามเวลาล่าสุด
        posts.sort((a, b) => {
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });
        
        setAllPosts(posts);
        
        // Set liked posts
        const liked = new Set();
        posts.forEach(post => {
          if (post.likes?.includes(currentUser?.uid)) {
            liked.add(post.id);
          }
        });
        setLikedPosts(liked);
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchPosts();
    }
  }, [currentUser]);

  // Update search input when URL changes
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // ✨ Filter Posts - ปรับปรุงให้แม่นยำ (กรองตาม category + เนื้อหา)
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPosts(allPosts);
    } else {
      const query = searchQuery.toLowerCase().trim();
      
      const postsWithScore = allPosts.map(post => {
        let relevanceScore = 0;
        let matchType = '';
        
        // Title match
        const title = post.title?.toLowerCase() || '';
        if (title === query) {
          relevanceScore += 1000;
          matchType = 'title-exact';
        } else if (title.includes(query)) {
          relevanceScore += 500;
          matchType = 'title-partial';
        } else if (title.split(' ').some(word => word.includes(query))) {
          relevanceScore += 250;
          matchType = 'title-word';
        }
        
        // Destination match
        const destination = post.destination?.toLowerCase() || '';
        if (destination === query) {
          relevanceScore += 400;
          if (!matchType) matchType = 'destination-exact';
        } else if (destination.includes(query)) {
          relevanceScore += 200;
          if (!matchType) matchType = 'destination-partial';
        }
        
        // Description/Content match
        const description = post.description?.toLowerCase() || '';
        const content = post.content?.toLowerCase() || '';
        const text = post.text?.toLowerCase() || '';
        
        if (description.includes(query)) {
          relevanceScore += 100;
          if (!matchType) matchType = 'description';
        }
        if (content.includes(query)) {
          relevanceScore += 80;
          if (!matchType) matchType = 'content';
        }
        if (text.includes(query)) {
          relevanceScore += 80;
          if (!matchType) matchType = 'text';
        }
        
        // ✨ Category match - ต้องมีเนื้อหาตรงด้วย
        const category = post.category?.toLowerCase() || '';
        const hasContentMatch = (
          title.includes(query) || 
          destination.includes(query) || 
          description.includes(query) || 
          content.includes(query) || 
          text.includes(query)
        );
        
        if (category.includes(query)) {
          if (hasContentMatch) {
            relevanceScore += 30;
            if (!matchType) matchType = 'category-with-content';
          } else {
            // มี category ตรง แต่เนื้อหาไม่ตรง → ไม่ให้คะแนน
            relevanceScore = 0;
          }
        }
        
        // โบนัสคะแนน
        const matchCount = [
          title.includes(query),
          destination.includes(query),
          description.includes(query),
          content.includes(query),
          text.includes(query)
        ].filter(Boolean).length;
        
        if (matchCount > 1) {
          relevanceScore += matchCount * 10;
        }
        
        const popularityBonus = (post.likes?.length || 0) + (post.members?.length || 0) * 2;
        relevanceScore += Math.min(popularityBonus, 30);
        
        return {
          ...post,
          relevanceScore,
          matchType
        };
      });
      
      const filtered = postsWithScore
        .filter(post => post.relevanceScore > 0)
        .sort((a, b) => {
          if (b.relevanceScore !== a.relevanceScore) {
            return b.relevanceScore - a.relevanceScore;
          }
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });
      
      setFilteredPosts(filtered);
    }
  }, [searchQuery, allPosts]);

  // Toggle Like
  const toggleLike = async (postId) => {
    if (!currentUser) return;
    
    const postRef = doc(db, 'posts', postId);
    const isCurrentlyLiked = likedPosts.has(postId);
    
    try {
      if (isCurrentlyLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(currentUser.uid)
        });
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(currentUser.uid)
        });
        setLikedPosts(prev => new Set(prev).add(postId));
      }
      
      setAllPosts(prev => prev.map(post => 
        post.id === postId 
          ? {
              ...post,
              likes: isCurrentlyLiked 
                ? post.likes.filter(uid => uid !== currentUser.uid)
                : [...(post.likes || []), currentUser.uid]
            }
          : post
      ));
      
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // Toggle Comments
  const toggleComments = (postId) => {
    setShowComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  // Handle Comment Input
  const handleCommentInput = (postId, value) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }));
  };

  // Add Comment
  const addComment = async (postId) => {
    if (!currentUser || !commentInputs[postId]?.trim()) return;
    
    const postRef = doc(db, 'posts', postId);
    const newComment = {
      uid: currentUser.uid,
      author: currentUser.name,
      avatar: currentUser.avatar,
      text: commentInputs[postId].trim(),
      timestamp: new Date().toISOString()
    };
    
    try {
      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });
      
      setAllPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, comments: [...(post.comments || []), newComment] }
          : post
      ));
      
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Join Chat Request
  const handleJoinChat = async (postId) => {
    if (!currentUser) return;
    
    const postRef = doc(db, 'posts', postId);
    const joinRequest = {
      uid: currentUser.uid,
      name: currentUser.name,
      avatar: currentUser.avatar,
      requestedAt: new Date().toISOString()
    };
    
    try {
      await updateDoc(postRef, {
        joinRequests: arrayUnion(joinRequest)
      });
      
      setAllPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, joinRequests: [...(post.joinRequests || []), joinRequest] }
          : post
      ));
      
      alert('ส่งคำขอเข้าร่วมกลุ่มเรียบร้อย!');
    } catch (error) {
      console.error("Error sending join request:", error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  // Approve Join Request
  const approveJoinRequest = async (postId, request) => {
    const postRef = doc(db, 'posts', postId);
    
    try {
      await updateDoc(postRef, {
        joinRequests: arrayRemove(request),
        members: arrayUnion({
          uid: request.uid,
          name: request.name,
          avatar: request.avatar
        }),
        currentMembers: (allPosts.find(p => p.id === postId)?.currentMembers || 0) + 1
      });
      
      setAllPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            joinRequests: post.joinRequests.filter(r => r.uid !== request.uid),
            members: [...(post.members || []), request],
            currentMembers: (post.currentMembers || 0) + 1
          };
        }
        return post;
      }));
      
      alert(`อนุมัติ ${request.name} เรียบร้อย!`);
    } catch (error) {
      console.error("Error approving request:", error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  // Reject Join Request
  const rejectJoinRequest = async (postId, request) => {
    const postRef = doc(db, 'posts', postId);
    
    try {
      await updateDoc(postRef, {
        joinRequests: arrayRemove(request)
      });
      
      setAllPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, joinRequests: post.joinRequests.filter(r => r.uid !== request.uid) }
          : post
      ));
      
      alert(`ปฏิเสธ ${request.name} เรียบร้อย`);
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  // Delete Post
  const deletePost = async (postId) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบโพสต์นี้?')) return;
    
    try {
      await deleteDoc(doc(db, 'posts', postId));
      setAllPosts(prev => prev.filter(post => post.id !== postId));
      alert('ลบโพสต์เรียบร้อย!');
    } catch (error) {
      console.error("Error deleting post:", error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (post) => {
    setEditingPost(post);
    setIsEditModalOpen(true);
  };

  // Update Post
  const updatePost = async (postData) => {
    if (!editingPost) return;
    
    try {
      const postRef = doc(db, 'posts', editingPost.id);
      await updateDoc(postRef, postData);
      
      setAllPosts(prev => prev.map(post => 
        post.id === editingPost.id 
          ? { ...post, ...postData }
          : post
      ));
      
      setIsEditModalOpen(false);
      setEditingPost(null);
      alert('แก้ไขโพสต์สำเร็จ!');
    } catch (error) {
      console.error("Error updating post:", error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  // Report Post
  const handleReportPost = async (post, reporter) => {
    const reason = prompt('กรุณาระบุเหตุผลในการรายงาน:');
    if (!reason) return;
    
    try {
      await addDoc(collection(db, 'reports'), {
        postId: post.id,
        postTitle: post.title,
        reportedBy: reporter.uid,
        reporterName: reporter.name,
        reason: reason,
        timestamp: serverTimestamp()
      });
      
      alert('รายงานโพสต์เรียบร้อย');
    } catch (error) {
      console.error("Error reporting post:", error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  // Handle Search Submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ search: searchInput.trim() });
    } else {
      setSearchParams({});
    }
  };

  // Handle Clear Search
  const handleClearSearch = () => {
    setSearchInput('');
    setSearchParams({});
  };

  if (loading) {
    return <div className="loading-screen">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="posts-container">
      <Navbar brand="TripTogether" />
      
      <div className="posts-layout">
        <main className="posts-main">
          {/* Search Bar */}
          <div className="posts-search-section">
            <h1 className="posts-page-title">
              {searchQuery ? `ผลการค้นหา: "${searchQuery}"` : 'โพสต์ทั้งหมด'}
            </h1>
            
            <form className="posts-search-form" onSubmit={handleSearch}>
              <div className="search-wrapper">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  type="text"
                  className="posts-search-input"
                  placeholder="ค้นหาทริป, สถานที่, หมวดหมู่..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                {searchInput && (
                  <button 
                    type="button"
                    className="clear-input-btn"
                    onClick={() => setSearchInput('')}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
                <button type="submit" className="posts-search-btn">
                  ค้นหา
                </button>
              </div>
            </form>
            
            {searchQuery && (
              <div className="search-results-info">
                <p>พบ {filteredPosts.length} โพสต์ที่เกี่ยวข้อง</p>
                <button 
                  className="clear-search-btn" 
                  onClick={handleClearSearch}
                >
                  ล้างการค้นหา
                </button>
              </div>
            )}
          </div>

          {/* Posts List */}
          <div className="posts-list">
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
                  approveJoinRequest={(request) => approveJoinRequest(post.id, request)}
                  rejectJoinRequest={(request) => rejectJoinRequest(post.id, request)}
                  handleReportPost={handleReportPost}
                />
              ))
            ) : (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h2>ไม่พบผลลัพธ์</h2>
                <p>
                  {searchQuery 
                    ? `ไม่พบโพสต์ที่ตรงกับ "${searchQuery}"`
                    : 'ยังไม่มีโพสต์ในระบบ'
                  }
                </p>
                <p className="no-results-suggestion">
                  ลองค้นหาด้วยคำอื่น หรือดูโพสต์ทั้งหมด
                </p>
                {searchQuery && (
                  <button 
                    className="view-all-posts-btn"
                    onClick={handleClearSearch}
                  >
                    ดูโพสต์ทั้งหมด
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <Feb
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingPost(null);
          }}
          onSubmit={updatePost}
          post={editingPost}
        />
      )}
    </div>
  );
};

export default Post;