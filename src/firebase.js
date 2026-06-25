import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAcYZb7W5v8KpeoOG489xNgToW8uNpXuOU",
  authDomain: "aitu-std.firebaseapp.com",
  projectId: "aitu-std",
  storageBucket: "aitu-std.firebasestorage.app",
  messagingSenderId: "553298969176",
  appId: "1:553298969176:web:d8a3c69b880cf5cfa1c02d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);