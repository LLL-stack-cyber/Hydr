import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDai4v2G1VzSxVdQduVwG3CqTHehnpKE90",
  authDomain: "silver-partition-jcjpc.firebaseapp.com",
  projectId: "silver-partition-jcjpc",
  storageBucket: "silver-partition-jcjpc.firebasestorage.app",
  messagingSenderId: "940550428286",
  appId: "1:940550428286:web:4b6bf6cb8a396e61cb6a2f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app, "ai-studio-hydroguardaiesp3-e5a7b29a-a057-40b7-a94f-66eb963b5090");

export { signInWithPopup, signOut, onAuthStateChanged, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp };
export type { User };
