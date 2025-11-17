import React from 'react';
import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom'; 

// Helper: Linkify Function 
const linkify = (text) => {
    if (typeof text !== 'string') return text;
    
    const urlRegex = /(\b(https?:\/\/|www\.)[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
        if (part.match(urlRegex)) {
            let href = part;
            if (!href.match(/^https?:\/\//i)) {
                href = 'http://' + href;
            }
            return (
                <a 
                    key={index} 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{color: 'inherit', textDecoration: 'underline'}} 
                >
                    {part}
                </a>
            );
        }
        return part;
    });
};

function MessageBubble({ message, currentUser }) {
  const { text, uid, photoURL, sender, time, type, location } = message;
  
  const isOwn = currentUser && uid === currentUser.uid;
  const messageClass = isOwn ? 'own' : 'other';
  const isLocation = type === 'location' && location;

  return (
    <div className={`message-wrapper ${messageClass}`}>
      
      {!isOwn && (
   
        <Link to={`/profile/${uid}`}>
          <img 
              src={photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
              alt={sender} 
              className="message-avatar" 
          />
        </Link>
      )}

      <div className={`message-bubble ${messageClass}`}>
        
     
        {!isOwn && (
          <Link to={`/profile/${uid}`} style={{ textDecoration: 'none' }}>
            <span className="message-sender-name">{sender}</span>
          </Link>
        )}

        {isLocation ? (
             <a 
                 href={`https://www.google.com/maps?q=${location.lat},${location.lng}`} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="location-link"
                 style={{
                    color: 'inherit', 
                    textDecoration: 'none', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                 }}
             >
                <div style={{
                    background: isOwn ? 'rgba(255,255,255,0.2)' : '#f0f0f0',
                    borderRadius: '50%',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <MapPin size={20} color={isOwn ? '#fff' : '#f5533d'} />
                </div>
                <div style={{display:'flex', flexDirection:'column'}}>
                    <span>{location.name}</span>
                    <span style={{fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.8}}>
                        กดเพื่อดูแผนที่
                    </span>
                </div>
             </a>
        ) : (
            <p className="message-text">
                {linkify(text)}
            </p>
        )}
        
        <span className="message-time">{time}</span>
      </div>
    </div>
  );
}

export default MessageBubble;