// src/pages/ForgotPassword.jsx
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage({
        type: "success",
        text: "ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว! กรุณาตรวจสอบ Inbox หรือ Junk mail"
      });
      setEmail("");
    } catch (error) {
      console.error(error);
      let errorMessage = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";

      if (error.code === "auth/user-not-found") {
        errorMessage = "ไม่พบอีเมลนี้ในระบบ";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "รูปแบบอีเมลไม่ถูกต้อง";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่";
      }

      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          padding: "40px",
          maxWidth: "450px",
          width: "100%"
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{ fontSize: "50px", marginBottom: "15px" }}>🔐</div>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#333",
              margin: "0 0 10px 0"
            }}
          >
            Forget Password
          </h2>
          <p
            style={{
              color: "#666",
              fontSize: "14px",
              lineHeight: "1.5",
              margin: "0"
            }}
          >
            กรอกอีเมลของคุณเพื่อรับลิงก์ตั้งรหัสผ่านใหม่
          </p>
        </div>

        {/* Success/Error Message */}
        {message.text && (
          <div
            style={{
              background: message.type === "success" ? "#d4edda" : "#f8d7da",
              border: `1px solid ${
                message.type === "success" ? "#c3e6cb" : "#f5c6cb"
              }`,
              color: message.type === "success" ? "#155724" : "#721c24",
              padding: "15px",
              borderRadius: "12px",
              marginBottom: "20px",
              fontSize: "14px",
              textAlign: "center"
            }}
          >
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleReset} style={{ marginBottom: "20px" }}>
          <div style={{ position: "relative", marginBottom: "20px" }}>
            <span
              style={{
                position: "absolute",
                left: "15px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "18px"
              }}
            >
              📧
            </span>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "15px 15px 15px 45px",
                border: "2px solid #e0e0e0",
                borderRadius: "12px",
                fontSize: "15px",
                boxSizing: "border-box",
                transition: "all 0.3s ease",
                outline: "none"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 4px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e0e0e0";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              background: loading
                ? "#ccc"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading
                ? "none"
                : "0 4px 15px rgba(102, 126, 234, 0.4)",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.6)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
              }
            }}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            paddingTop: "20px",
            borderTop: "1px solid #e0e0e0"
          }}
        >
          <Link
            to="/login"
            style={{
              color: "#667eea",
              textDecoration: "none",
              fontWeight: "500",
              fontSize: "14px",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.color = "#764ba2";
              e.target.style.gap = "8px";
            }}
            onMouseLeave={(e) => {
              e.target.style.color = "#667eea";
              e.target.style.gap = "5px";
            }}
          >
            <span>←</span> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}