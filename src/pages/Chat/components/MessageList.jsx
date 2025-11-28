import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import './MessageList.css'

const MessageList = ({ messages, currentUser, onEditMessage, onDeleteMessage }) => { 

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const hasMessages = messages && messages.length > 0;

  return (
    <div className="messages-area">
      {!hasMessages ? (
        <div className="empty-chat-state">
          <div className="empty-chat-icon">💬</div>
          <p className="empty-chat-text">ยังไม่มีการสนทนา</p>
          <p className="empty-chat-subtext">เริ่มต้นการสนทนาของคุณเลย!</p>
        </div>
      ) : (
        messages.map(msg => (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            currentUser={currentUser}
            onEdit={onEditMessage}
            onDelete={onDeleteMessage}
          />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;