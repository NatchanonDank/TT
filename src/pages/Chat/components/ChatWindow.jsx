import React from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import './Chatwindow.css';

const ChatWindow = ({ 
  chat, 
  messageInput,
  isTripEnded,
  onBack,
  onEndTrip,
  onLeaveGroup,
  onInputChange,
  onSendMessage,
  onOpenLocationModal,
  onEditMessage,
  onDeleteMessage,
  currentUser
}) => {
  return (
    <div className="chat-window">
      <ChatHeader
        chat={chat}
        onBack={onBack}
        onEndTrip={onEndTrip}
        onLeaveGroup={onLeaveGroup}
        isTripEnded={isTripEnded}
        currentUser={currentUser}
      />
    
      <MessageList 
        messages={chat.messages} 
        currentUser={currentUser}
        onEditMessage={onEditMessage}
        onDeleteMessage={onDeleteMessage}
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