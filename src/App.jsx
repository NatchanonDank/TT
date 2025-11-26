import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { PostProvider } from "./components/PostContext";
import { NotificationProvider } from "./components/NotificationContext";
import NotificationsPage from "./pages/NotificationPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Homepage from "./pages/Homepage";
import Chat from "./pages/Chat/Chat";
import Endtrip from "./pages/Endtrip";
import ProfilePage from "./pages/Profilepage"; 
import PostDetail from "./pages/PostDetail";
import AllPosts from "./pages/AllPosts"; // ✅ เพิ่มบรรทัดนี้
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
      setLoading(false); 
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20%' }}>กำลังโหลดข้อมูล...</div>;
  }

  return (
    <PostProvider>
      <NotificationProvider>
        <Routes>
          <Route path="/" element={currentUser ? <Navigate to="/homepage" /> : <Login />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          
          <Route path="/homepage" element={<Homepage />} />
          <Route path="/posts" element={<AllPosts />} /> {/* ✅ เพิ่มบรรทัดนี้ */}
          <Route path="/post/:postId" element={<PostDetail />} />

          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:groupId" element={<Chat />} />

          <Route 
            path="/notifications"
            element={<NotificationsPage />} 
          />

          <Route path="/endtrip" element={<Endtrip />} />
          <Route path="/end-trip/:groupId" element={<Endtrip />} />

          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          
        </Routes>
      </NotificationProvider>
    </PostProvider>
  );
}