
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDvPh_MjoeVj1LvfL-8eWYJJeEiTQ0Gjo8",
  authDomain: "triptogether-84ff6.firebaseapp.com",
  projectId: "triptogether-84ff6",
  storageBucket: "triptogether-84ff6.firebasestorage.app",
  messagingSenderId: "555969441430",
  appId: "1:555969441430:web:345e424f2659d8546edcb7",
  measurementId: "G-FTG84TRHLX"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;