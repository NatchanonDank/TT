import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import './MessageList.css'


const MessageList = ({ messages, currentUser }) => {

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ✅ เช็คว่ามีข้อความหรือไม่
  const hasMessages = messages && messages.length > 0;

  return (
    <div className="messages-area">

      {messages && messages.map(msg => (
        <MessageBubble 
          key={msg.id} 
          message={msg} 
          currentUser={currentUser}
        />
      ))}

      {/* ✅ ถ้าไม่มีข้อความ แสดง Empty State */}
      {!hasMessages ? (
        <div className="empty-chat-state">
          <div className="empty-chat-icon">💬</div>
          <p className="empty-chat-text">ยังไม่มีการสนทนา</p>
          <p className="empty-chat-subtext">เริ่มต้นการสนทนาของคุณเลย!</p>
        </div>
      ) : (
        /* ✅ ถ้ามีข้อความ แสดง Messages */
        messages.map(msg => (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            currentUser={currentUser}
          />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;