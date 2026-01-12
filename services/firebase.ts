
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  collection, 
  query, 
  where, 
  limit, 
  updateDoc, 
  addDoc, 
  serverTimestamp, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCVUMhFhDzfbvF-iXthH6StOlI6mJreTmA",
  authDomain: "smart-support-for-pets.firebaseapp.com",
  projectId: "smart-support-for-pets",
  storageBucket: "smart-support-for-pets.firebasestorage.app",
  messagingSenderId: "737739952686",
  appId: "1:737739952686:web:17ecad5079401fb6ee05bf"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  
  try {
    const result = await signInWithPopup(auth, provider);
    if (result.user) {
      const userRef = doc(db, "users", result.user.uid);
      await setDoc(userRef, {
        username: result.user.displayName?.toLowerCase().replace(/\s/g, '') || result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        lastLogin: new Date().toISOString()
      }, { merge: true });
      return result.user;
    }
  } catch (error: any) {
    console.error("Google login failed:", error);
    throw error;
  }
};

export const loginWithIdentifier = async (identifier: string, pass: string) => {
  try {
    let email = identifier;
    if (!identifier.includes('@')) {
      const q = query(collection(db, "users"), where("username", "==", identifier.toLowerCase()), limit(1));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error("Username not found.");
      }
      email = querySnapshot.docs[0].data().email;
    }
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error: any) {
    console.error("Login failed:", error);
    throw error;
  }
};

// Fix: Implement missing signUpWithEmail function required by Login.tsx
export const signUpWithEmail = async (email: string, pass: string, fullName: string, username: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      await updateProfile(result.user, { displayName: fullName });
      
      const userRef = doc(db, "users", result.user.uid);
      await setDoc(userRef, {
        username: username.toLowerCase().replace(/\s/g, ''),
        email: email,
        displayName: fullName,
        photoURL: null,
        lastLogin: new Date().toISOString()
      }, { merge: true });
      
      return result.user;
    }
    throw new Error("Failed to create user account.");
  } catch (error: any) {
    console.error("Signup failed:", error);
    throw error;
  }
};

export const updateUserProfile = async (uid: string, data: { displayName?: string, username?: string, phoneNumber?: string }) => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user found.");

  const userRef = doc(db, "users", uid);
  const firestoreData: any = { ...data };
  if (data.username) firestoreData.username = data.username.toLowerCase().replace(/\s/g, '');
  
  await updateDoc(userRef, firestoreData);
  if (data.displayName) await updateProfile(user, { displayName: data.displayName });
  await user.reload();
  return auth.currentUser;
};

// Chat Functions
export const startChat = async (currentUid: string, targetUid: string) => {
  if (currentUid === targetUid) return null;
  const chatId = [currentUid, targetUid].sort().join('_');
  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      participants: [currentUid, targetUid],
      createdAt: serverTimestamp(),
      lastMessage: "",
      lastTimestamp: serverTimestamp()
    });
  }
  return chatId;
};

export const sendChatMessage = async (chatId: string, senderId: string, text: string) => {
  const messagesRef = collection(db, "chats", chatId, "messages");
  await addDoc(messagesRef, {
    senderId,
    text,
    timestamp: serverTimestamp()
  });
  
  const chatRef = doc(db, "chats", chatId);
  await updateDoc(chatRef, {
    lastMessage: text,
    lastTimestamp: serverTimestamp()
  });
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
};

export { onAuthStateChanged };
export type { FirebaseUser };
