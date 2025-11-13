import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Firebase Imports
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

// Contexts
import { PostProvider } from "./components/PostContext";
import { NotificationProvider } from "./components/NotificationContext";

// Pages
import NotificationsPage from "./pages/NotificationPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Homepage from "./pages/Homepage";
import Chat from "./pages/Chat/Chat";
import Endtrip from "./pages/Endtrip";
import ProfilePage from "./pages/Profilepage"; // ตรวจสอบชื่อไฟล์ให้ตรง (Profilepage หรือ ProfilePage)

export default function App() {
  // 1. สร้าง State เพื่อเก็บข้อมูลผู้ใช้จริงจาก Firebase
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // สถานะรอโหลดข้อมูล

  // 2. ตรวจสอบสถานะ Login ตลอดเวลา (Real-time Auth Listener)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // ถ้ามีคนล็อกอินอยู่ ให้เก็บข้อมูลลง State
        setCurrentUser(user);
      } else {
        // ถ้าไม่มี (Logout แล้ว) ให้เคลียร์ค่า
        setCurrentUser(null);
      }
      setLoading(false); // โหลดเสร็จแล้ว
    });

    // Cleanup function เมื่อ Component ถูกทำลาย
    return () => unsubscribe();
  }, []);

  // แสดงหน้า Loading ระหว่างรอเช็คสถานะ Firebase (เพื่อไม่ให้หน้าเว็บกระตุก)
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20%' }}>กำลังโหลดข้อมูล...</div>;
  }

  return (
    <PostProvider>
      <NotificationProvider>
        <Routes>
          {/* Path "/" (หน้าแรกสุด): 
            - ถ้า Login แล้ว -> ไป Homepage
            - ถ้ายังไม่ Login -> ไปหน้า Login
          */}
          <Route path="/" element={currentUser ? <Navigate to="/homepage" /> : <Login />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          
          {/* หน้าที่ควรเข้าได้เฉพาะตอน Login แล้ว (แต่เปิดกว้างไว้ก่อนได้) */}
          <Route path="/homepage" element={<Homepage />} />

          {/* Chat Routes */}
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:groupId" element={<Chat />} />

          {/* Notifications */}
          <Route 
            path="/notifications" 
            element={<NotificationsPage currentUser={currentUser} />} 
          />

          {/* EndTrip Routes */}
          <Route path="/endtrip" element={<Endtrip />} />
          {/* ✅ เพิ่ม Route นี้เพื่อให้รองรับการกด "จบขบวนทริป" จากหน้า Chat */}
          <Route path="/end-trip/:groupId" element={<Endtrip />} />

          {/* Profile */}
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </NotificationProvider>
    </PostProvider>
  );
}