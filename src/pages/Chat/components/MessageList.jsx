import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';

const MessageList = ({ messages, currentUser }) => { // ✅ 3. ต้องรับ currentUser
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="messages-area">
      {messages && messages.map(msg => (
        <MessageBubble 
          key={msg.id} 
          message={msg} 
          currentUser={currentUser} // ✅ 4. ส่งต่อให้ MessageBubble
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;