import React from 'react'; 
import { Link, useNavigate } from 'react-router-dom'; 
import Navbar from "../components/Navbar";
import { Heart, MessageCircle, Users, CheckCircle, XCircle, X, Trash2 } from 'lucide-react';
import './NotificationPage.css';
import { useNotifications } from '../components/NotificationContext';

const NotificationPage = () => {
  const navigate = useNavigate();
  
  const { 
    notifications, 
    markAsRead, 
    deleteNotification, 
    markAllAsRead 
  } = useNotifications();
  const displayNotifications = notifications.filter(n => n.type !== 'chat_message');
  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }
    
    if (notif.type === 'request_approved' && notif.groupId) {
      navigate(`/chat/${notif.groupId}`); 
    }
    else if (['like', 'comment', 'join_request', 'request_rejected'].includes(notif.type) && notif.postId) {
      navigate(`/post/${notif.postId}`); 
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart size={20} className="notif-icon like" />;
      case 'comment': return <MessageCircle size={20} className="notif-icon comment" />;
      case 'join_request': return <Users size={20} className="notif-icon request" />;
      case 'request_approved': return <CheckCircle size={20} className="notif-icon approved" />;
      case 'request_rejected': return <XCircle size={20} className="notif-icon rejected" />;
      default: return <MessageCircle size={20} className="notif-icon" />;
    }
  };

  if (!notifications) {
     return <div style={{textAlign:'center', marginTop:'50px'}}>กำลังโหลดการแจ้งเตือน...</div>;
  }

  return (
    <div className="notifications-page">
      <Navbar brand="TripTogether" />
      
      <div className="notifications-container">
        <div className="notifications-header">
          <h2 className="notifications-title">การแจ้งเตือน</h2>
          
          {displayNotifications.some(n => !n.read) && (
            <button className="mark-all-btn" onClick={markAllAsRead}>
              อ่านทั้งหมด
            </button>
          )}
        </div>

        {displayNotifications.length === 0 ? (
          <div className="empty-notifications">
            <p>ไม่มีการแจ้งเตือนในขณะนี้</p>
          </div>
        ) : (
          <div className="notifications-list">
            {displayNotifications.map(notif => (
              <div 
                key={notif.id} 
                className={`notification-item ${!notif.read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="notif-icon-wrapper">
                  {getIcon(notif.type)}
                </div>
                
                <Link to={notif.fromUid ? `/profile/${notif.fromUid}` : '#'} onClick={(e) => e.stopPropagation()}>
                  <img 
                    src={notif.fromAvatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                    alt="Avatar"
                    className="notif-avatar"
                  />
                </Link>
                
                <div className="notif-content">
                  <p className="notif-message">
                    <Link 
                      to={notif.fromUid ? `/profile/${notif.fromUid}` : '#'} 
                      onClick={(e) => e.stopPropagation()} 
                      style={{color: '#1a1a1a', textDecoration: 'none'}}
                    >
                      <strong>{notif.fromName}</strong>
                    </Link>
                    {' '}{notif.message}
                  </p>
                  <p className="notif-time">
                    {notif.createdAt?.seconds 
                      ? new Date(notif.createdAt.seconds * 1000).toLocaleString('th-TH')
                      : 'เมื่อสักครู่'}
                  </p>
                </div>

                <button 
                  className="delete-notif-btn"
                  onClick={(e) => {
                    e.stopPropagation(); 
                    deleteNotification(notif.id); 
                  }}
                >
                  <X size={16} />
                </button>

                {!notif.read && <div className="unread-dot"></div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;