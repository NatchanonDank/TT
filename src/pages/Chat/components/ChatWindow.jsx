import React from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatWindow = ({ 
  chat, 
  messageInput,
  isTripEnded,
  isOptionsOpen,
  onBack,
  onToggleOptions,
  onEndTrip,
  onInputChange,
  onSendMessage,
  onOpenLocationModal,
  currentUser // ✅ 1. ต้องรับ currentUser เข้ามา
}) => {
  return (
    <div className="chat-window">
      
      <ChatHeader
        chat={chat}
        onBack={onBack}
        isOptionsOpen={isOptionsOpen}
        onToggleOptions={onToggleOptions}
        onEndTrip={onEndTrip}
        isTripEnded={isTripEnded}
      />
    
      <MessageList 
        messages={chat.messages} 
        currentUser={currentUser} // ✅ 2. ส่งต่อให้ MessageList
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