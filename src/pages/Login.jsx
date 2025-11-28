import { Link, useNavigate } from "react-router-dom";
import { 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserSessionPersistence 
} from "firebase/auth"; 
import { auth } from "../firebase"; 
import styles from "./Login.module.css";

export default function Login() {
  const navigate = useNavigate();

  const handleSubmit = async (e) => { 
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      await setPersistence(auth, browserSessionPersistence);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        alert("กรุณายืนยันตัวตนผ่านอีเมลที่คุณได้รับก่อนเข้าใช้งาน");
      }
      
      console.log("Login success:", user);
      alert("Login สำเร็จ! ยินดีต้อนรับ " + user.email);

      navigate("/homepage");

    } catch (error) {
      console.error("Login error:", error.code, error.message);
      
      let errorMessage = "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
      
      switch (error.code) {
        case "auth/invalid-credential":
          errorMessage = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
          break;
        case "auth/user-not-found":
          errorMessage = "ไม่พบผู้ใช้งานนี้ในระบบ";
          break;
        case "auth/wrong-password":
          errorMessage = "รหัสผ่านผิด";
          break;
        case "auth/too-many-requests":
          errorMessage = "เข้าสู่ระบบผิดพลาดบ่อยเกินไป กรุณาลองใหม่ภายหลัง";
          break;
        default:
          errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  return (
    <div className={styles.loginBox}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" name="email" placeholder="Email" required />
        <input type="password" name="password" placeholder="Password" required />
        <div className={styles.authFooter}>
          <Link to="/forgot">Forgot password?</Link>
        </div>
        <button type="submit">Login</button>
        <p>
          Don't have any account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}