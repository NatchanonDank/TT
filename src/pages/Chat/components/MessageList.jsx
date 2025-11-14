import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import MessageBubble from './MessageBubble';

const MessageList = forwardRef(({ messages, currentUser, loadOlderMessages }, ref) => {
  const containerRef = useRef(null);

  // ให้ parent เรียก scroll
  useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      if (!containerRef.current) return;
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    },
    scrollToTop: () => {
      if (!containerRef.current) return;
      containerRef.current.scrollTop = 0;
    }
  }));

  // auto scroll ลงล่างตอน mount
  useEffect(() => {
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, []);

  // scroll ถึงบนสุด → โหลดข้อความเก่า
  const handleScroll = () => {
    if (!containerRef.current) return;
    if (containerRef.current.scrollTop === 0 && loadOlderMessages) {
      loadOlderMessages();
    }
  };

  // scroll ลงล่างอัตโนมัติเมื่อ messages เปลี่ยน
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages]);

  return (
    <div className="messages-area" ref={containerRef} onScroll={handleScroll}>
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} currentUser={currentUser} />
      ))}
    </div>
  );
});

export default MessageList;
