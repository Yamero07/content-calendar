import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDBjzYaOKqzRY8mdyHRthZryPSHR3i9-Dk",
  authDomain: "stella-content-calendar.firebaseapp.com",
  projectId: "stella-content-calendar",
  storageBucket: "stella-content-calendar.firebasestorage.app",
  messagingSenderId: "1081520387830",
  appId: "1:1081520387830:web:c0b6cb89458c77bf635ed7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);