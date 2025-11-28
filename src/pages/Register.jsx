import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { auth } from "../firebase";
import styles from "./Register.module.css";

export default function Register() {
  const navigate = useNavigate();
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      alert("กรุณายอมรับนโยบายความเป็นส่วนตัวและเงื่อนไขการให้บริการก่อนสมัครสมาชิก");
      return;
    }

    const fullname = e.target.fullname.value;
    const email = e.target.email.value;
    const password = e.target.password.value;
    const confirm = e.target.confirm.value;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;
    
    if (!passwordRegex.test(password)) {
      alert(
        "Password is not secure!\n\n" +
        "Your password must be at least 8 characters long and include:\n" +
        "- At least one lowercase letter (a-z)\n" +
        "- At least one uppercase letter (A-Z)\n" +
        "- At least one number (0-9)\n" +
        "- At least one special character (e.g., ! @ # $ % ^ & * _ + - =)"
      );
      return; 
    }

    if (password !== confirm) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: fullname });
      await sendEmailVerification(user);
      console.log("User created & Verification sent");
      alert(`Registration successful! Please check your email ${email} to verify your account before logging in.`);
      navigate("/login");
    } catch (error) {
      console.error("Error:", error.code);
      let msg = error.message;
      if (error.code === 'auth/email-already-in-use') msg = "This email is already in use.";
      if (error.code === 'auth/weak-password') msg = "Password must be at least 6 characters long.";
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
        
        <div className={styles.termsCheckbox}>
          <input 
            type="checkbox" 
            id="accept-terms"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
          />
          <label htmlFor="accept-terms">
            ฉันได้อ่านและยอมรับ{' '}
            <a 
              href="/privacy-policy" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.termsLink}
            >
              นโยบายความเป็นส่วนตัว
            </a>
            {' '}และ{' '}
            <a 
              href="/terms-of-service" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.termsLink}
            >
              เงื่อนไขการให้บริการ
            </a>
          </label>
        </div>

        <button 
          type="submit" 
          disabled={!acceptedTerms}
          className={!acceptedTerms ? styles.disabled : ''}
        >
          Register
        </button>
        
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
}