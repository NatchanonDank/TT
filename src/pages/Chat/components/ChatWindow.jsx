import React from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import './ChatWindow.css';

const ChatWindow = ({ 
  chat, 
  messageInput,
  isTripEnded,
  onBack,
  onEndTrip,
  onLeaveGroup, // ✅ เพิ่ม prop ใหม่
  onInputChange,
  onSendMessage,
  onOpenLocationModal,
  currentUser
}) => {
  return (
    <div className="chat-window">
      
      <ChatHeader
        chat={chat}
        onBack={onBack}
        onEndTrip={onEndTrip}
        onLeaveGroup={onLeaveGroup} // ✅ ส่งต่อไปที่ ChatHeader
        isTripEnded={isTripEnded}
        currentUser={currentUser}
      />
    
      <MessageList 
        messages={chat.messages} 
        currentUser={currentUser} 
      />
      
      <MessageInput
        messageInput={messageInput}
        onInputChange={onInputChange}
        onSendMessage={onSendMessage}
        onOpenLocationModal={onOpenLocationModal}
        isTripEnded={isTripEnded}
      />
    </div>
  );
};

export default ChatWindow;