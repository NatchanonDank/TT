import { Link, useNavigate } from "react-router-dom";
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
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    if (!passwordRegex.test(password)) {
      alert(
        "Password is not secure!\n\n" +
        "Your password must be at least 8 characters long and include:\n" +
        "- At least one lowercase letter (a-z)\n" +
        "- At least one uppercase letter (A-Z)\n" +
        "- At least one number (0-9)\n" +
        "- At least one special character (e.g., @, $, !, %, *, ?, &)"
      );
      return; 
    }

    if (password !== confirm) {
      alert("Passwords do not match!");
      return;
    }

    try {
      // Create User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile name
      await updateProfile(user, { displayName: fullname });

      // Send Verification Email
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
        <button type="submit">Register</button>
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
}