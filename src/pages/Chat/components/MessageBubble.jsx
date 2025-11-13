import React from 'react';
import { MapPin } from 'lucide-react';

// ----------------------------------------------------
// Helper: Linkify Function (แปลงข้อความเป็นลิงก์)
// ----------------------------------------------------
const linkify = (text) => {
    if (typeof text !== 'string') return text;
    
    // RegEx สำหรับตรวจจับลิงก์ที่ขึ้นต้นด้วย http/https หรือ www.
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
                    // Style สำหรับลิงก์ใน Bubble (กำหนดสีให้ต่างจากพื้นหลัง)
                    style={{color: 'inherit', textDecoration: 'underline'}} 
                >
                    {part}
                </a>
            );
        }
        return part;
    });
};


// ----------------------------------------------------
// Component: MessageBubble (แสดงผลข้อความเดี่ยว)
// ----------------------------------------------------
function MessageBubble({ message, currentUser }) {
  const { text, uid, photoURL, sender, time, type, location } = message;
  
  // กำหนดคลาสสำหรับจัดวางซ้าย/ขวา
  const messageClass = uid === currentUser?.uid ? 'own' : 'other';
  
  // ตรวจสอบว่าเป็น Location
  const isLocation = type === 'location' && location;

  return (
    <div className={`message-wrapper ${messageClass}`}>
      
      {/* Avatar (แสดงเฉพาะฝั่งคนอื่น) */}
      {messageClass === 'other' && (
        <img src={photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt={sender} className="message-avatar" />
      )}

      <div className={`message-bubble ${messageClass}`}>
        
        {/* ชื่อคนส่ง (แสดงเฉพาะฝั่งคนอื่น) */}
        {messageClass === 'other' && <span className="message-sender-name">{sender}</span>}

        {/* เนื้อหาข้อความ / ตำแหน่งที่อยู่ */}
        {isLocation ? (
             <a 
                 href={`http://maps.google.com/?q=${location.lat},${location.lng}`} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="location-link"
             >
                <MapPin size={16} /> 
                <span style={{fontWeight: 'bold'}}>พิกัด: {location.name || 'ตำแหน่งที่แชร์'}</span>
             </a>
        ) : (
            <p className="message-text">
                {linkify(text)} {/* ✅ ใช้ Linkify ที่สร้างไว้ */}
            </p>
        )}
        
        <span className="message-time">{time}</span>
      </div>
    </div>
  );
}

export default MessageBubble;