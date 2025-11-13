import { Link, useNavigate } from "react-router-dom";
// 1. เพิ่ม sendEmailVerification เข้ามา
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { auth } from "../firebase";
import styles from "./Register.module.css";

export default function Register() {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullname = e.target.fullname.value;
    const email = e.target.email.value;
    const password = e.target.password.value;
    const confirm = e.target.confirm.value;

    if (password !== confirm) {
      alert("รหัสผ่านไม่ตรงกัน!");
      return;
    }

    try {
      // สร้าง User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // อัปเดตชื่อ
      await updateProfile(user, { displayName: fullname });

      // 2. 🟢 ส่งอีเมลยืนยันตัวตน (Verification Email)
      await sendEmailVerification(user);

      console.log("User created & Verification sent");
      alert(`สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมล ${email} เพื่อยืนยันตัวตนก่อนเข้าใช้งาน`);
      
      navigate("/login"); // หรือ "/" ตาม Route ของคุณ

    } catch (error) {
      console.error("Error:", error.code);
      let msg = error.message;
      if (error.code === 'auth/email-already-in-use') msg = "อีเมลนี้ถูกใช้ไปแล้ว";
      if (error.code === 'auth/weak-password') msg = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
      alert(msg);
    }
  };

  return (
    <div className={styles.registerBox}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="fullname" placeholder="Username" required />
        <input type="email" name="email" placeholder="Email" required />
        <input type="password" name="password" placeholder="Password" required />
        <input type="password" name="confirm" placeholder="Confirm Password" required />
        <button type="submit">Register</button>
        <p>มีบัญชีแล้ว? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
}