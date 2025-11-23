// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC6UiqHF-gQs1C7HlRUKRfgargxrq6HlVQ",
  authDomain: "harmony-real-estate1.firebaseapp.com",
  projectId: "harmony-real-estate1",
  storageBucket: "harmony-real-estate1.firebasestorage.app",
  messagingSenderId: "466383532556",
  appId: "1:466383532556:web:92e83359b7a271cc37b429"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);

// Note: Authentication can be added later when needed
// For now, we're using the farmer profile system for user identification

export default app;