import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy } from "firebase/firestore";

// ✅ तुम्हारा Firebase config — यह सही है
const firebaseConfig = {
  apiKey: "AIzaSyAzPcXJmp4ZB1pFuxQzpuHRM6GAmKF7DpQ",
  authDomain: "mirzapur-ai.firebaseapp.com",
  projectId: "mirzapur-ai",
  storageBucket: "mirzapur-ai.firebasestorage.app",
  messagingSenderId: "745363700223",
  appId: "1:745363700223:web:2836e9281eb90dd49a8fca",
  measurementId: "G-GFTSFM9PFC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Auth functions
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logOut = () => signOut(auth);

// Firestore functions
export const saveChat = async (userId, chat) => {
  return await addDoc(collection(db, 'chats'), {
    userId,
    ...chat,
    createdAt: new Date()
  });
};

export const getUserChats = async (userId) => {
  const q = query(
    collection(db, 'chats'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const deleteChat = async (chatId) => {
  await deleteDoc(doc(db, 'chats', chatId));
};
