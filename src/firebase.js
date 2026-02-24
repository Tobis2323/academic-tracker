import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAA-tSRGUUUW2ZO7bW4od9fiHKI3tFT7hs",
  authDomain: "academic-tracker-42db0.firebaseapp.com",
  projectId: "academic-tracker-42db0",
  storageBucket: "academic-tracker-42db0.firebasestorage.app",
  messagingSenderId: "1073246696217",
  appId: "1:1073246696217:web:dd366f1262eeb6b9624b88",
  measurementId: "G-C17JQFTHD4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
