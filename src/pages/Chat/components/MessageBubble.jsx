import React, { useState } from 'react';
import { MapPin, MoreVertical, Edit2, Trash2, X, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import './MessageBubble.css';

const linkify = (text) => {
  if (typeof text !== 'string') return text;
  const urlRegex = /(\b(https?:\/\/|www\.)[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      let href = part;
      if (!href.match(/^https?:\/\//i)) { href = 'http://' + href; }
      return <a key={index} href={href} target="_blank" rel="noopener noreferrer" style={{color: 'inherit', textDecoration: 'underline'}}>{part}</a>;
    }
    return part;
  });
};

function MessageBubble({ message, currentUser, onEdit, onDelete }) {
  const { text, uid, photoURL, sender, time, type, location, isDeleted, isEdited } = message;
  
  const isOwn = currentUser && uid === currentUser.uid;
  const messageClass = isOwn ? 'own' : 'other';
  const isLocation = (type === 'location' || (message.originalType === 'location' && !isDeleted)) && location;

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);
  const [showMenu, setShowMenu] = useState(false);

  const handleSaveEdit = () => {
    if (editValue.trim() !== text) {
      onEdit(message.id, editValue);
    }
    setIsEditing(false);
    setShowMenu(false);
  };

  const handleCancelEdit = () => {
    setEditValue(text);
    setIsEditing(false);
    setShowMenu(false);
  };

  return (
    <div className={`message-wrapper ${messageClass}`} onMouseLeave={() => setShowMenu(false)}>
      
      {!isOwn && (
        <Link to={`/profile/${uid}`}>
          <img src={photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt={sender} className="message-avatar" />
        </Link>
      )}

      <div className={`message-bubble ${messageClass} ${isDeleted ? 'deleted' : ''}`}>
        
        {!isOwn && (
          <Link to={`/profile/${uid}`} style={{ textDecoration: 'none' }}>
            <span className="message-sender-name">{sender}</span>
          </Link>
        )}

        {isDeleted ? (
          <p className="message-text deleted-text">
            🚫 <i>ข้อความนี้ถูกลบแล้ว</i>
          </p>
        ) : isEditing ? (
          <div className="edit-mode-container">
            <input 
              type="text" 
              value={editValue} 
              onChange={(e) => setEditValue(e.target.value)}
              className="edit-message-input"
              autoFocus
            />
            <div className="edit-actions">
              <button onClick={handleSaveEdit} className="edit-btn save"><Check size={14} /></button>
              <button onClick={handleCancelEdit} className="edit-btn cancel"><X size={14} /></button>
            </div>
          </div>
        ) : isLocation ? (
          <a href={`https://www.google.com/maps?q=$${location.lat},${location.lng}`} target="_blank" rel="noopener noreferrer" className="location-link">
            <div style={{ background: isOwn ? 'rgba(255,255,255,0.2)' : '#e3f2fd', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={18} color={isOwn ? '#fff' : '#1976d2'} />
            </div>
            <div style={{display:'flex', flexDirection:'column'}}>
              <span style={{fontWeight: 'bold'}}>{location.name}</span>
              <span style={{fontSize: '0.75rem', opacity: 0.8}}>กดเพื่อดูแผนที่</span>
            </div>
          </a>
        ) : (
          <p className="message-text">
            {linkify(text)}
            {isEdited && <span className="edited-tag"> (แก้ไขแล้ว)</span>}
          </p>
        )}
        
        <span className="message-time">{time}</span>
        {isOwn && !isDeleted && !isEditing && (
          <div className="message-options">
            <button className="options-trigger" onClick={() => setShowMenu(!showMenu)}>
              <MoreVertical size={14} />
            </button>
            {showMenu && (
              <div className="options-menu">
                <button onClick={() => { setIsEditing(true); setShowMenu(false); }}>
                  <Edit2 size={12} /> แก้ไข
                </button>
                <button onClick={() => { onDelete(message); setShowMenu(false); }} className="delete-option">
                  <Trash2 size={12} /> ลบ
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default MessageBubble;