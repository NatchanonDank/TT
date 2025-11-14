import React, { useRef, useEffect } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatWindow = ({ chat, messageInput, onInputChange, onSendMessage, currentUser, loadOlderMessages, onBack }) => {
  const messageListRef = useRef(null);

  useEffect(() => {
    // scroll ลงล่างเมื่อ chat.messages เปลี่ยน
    messageListRef.current?.scrollToBottom();
  }, [chat.messages]);

  return (
    <div className="chat-container">
      <ChatHeader chat={chat} onBack={onBack} />
      <MessageList 
        ref={messageListRef} 
        messages={chat.messages} 
        currentUser={currentUser} 
        loadOlderMessages={loadOlderMessages} 
      />
      <MessageInput 
        messageInput={messageInput} 
        onInputChange={onInputChange} 
        onSendMessage={onSendMessage} 
      />
    </div>
  );
};

export default ChatWindow;
