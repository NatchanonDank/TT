// src/pages/ForgotPassword.jsx
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { Link } from "react-router-dom";
// import styles from "./Login.module.css"; // ใช้ style เดียวกับ Login ได้

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      // ส่งอีเมลรีเซ็ต
      await sendPasswordResetEmail(auth, email);
      alert("ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว! กรุณาตรวจสอบ Inbox หรือ Junk mail");
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/user-not-found') {
        alert("ไม่พบอีเมลนี้ในระบบ");
      } else {
        alert("เกิดข้อผิดพลาด: " + error.message);
      }
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}> {/* หรือใช้ className จาก css */}
      <h2>ลืมรหัสผ่าน</h2>
      <p>กรอกอีเมลของคุณเพื่อรับลิงก์ตั้งรหัสผ่านใหม่</p>
      <form onSubmit={handleReset}>
        <input 
          type="email" 
          placeholder="ระบุอีเมลของคุณ" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required 
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        />
        <button type="submit" style={{ width: "100%", padding: "10px" }}>ส่งลิงก์รีเซ็ต</button>
      </form>
      <div style={{ marginTop: "10px", textAlign: "center" }}>
        <Link to="/login">กลับไปหน้าเข้าสู่ระบบ</Link>
      </div>
    </div>
  );
}