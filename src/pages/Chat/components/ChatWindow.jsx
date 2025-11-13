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
  onOpenLocationModal
}) => {
  return (
    <div className="chat-container">
      
      <ChatHeader
        chat={chat}
        onBack={onBack}
        isOptionsOpen={isOptionsOpen}
        onToggleOptions={onToggleOptions}
        onEndTrip={onEndTrip}
      />
    
      <MessageList messages={chat.messages} />
      
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