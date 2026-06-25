import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await loadUserRole(firebaseUser);
      } else {
        setUser(null);
        setRole(null);
        setUserDoc(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loadUserRole = async (firebaseUser) => {
    const email = firebaseUser.email?.trim().toLowerCase();
    
    // Check if supervisor
    const svQuery = query(collection(db, 'supervisors'), where('email', '==', email));
    const svSnap = await getDocs(svQuery);
    
    if (!svSnap.empty) {
      const svData = svSnap.docs[0].data();
      const userDocData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: 'supervisor',
        fname: svData.fname || (svData.name || '').split(' ')[0] || '',
        lname: svData.lname || (svData.name || '').split(' ').slice(1).join(' ') || '',
        supervisorId: svData.id
      };
      setUserDoc(userDocData);
      setRole('supervisor');
      await setDoc(doc(db, 'users', firebaseUser.uid), userDocData, { merge: true });
      return;
    }

    // Check users collection
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userDocRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      setUserDoc(data);
      setRole(data.role === 'supervisor' ? 'supervisor' : 'admin');
    } else {
      const userDocData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: 'admin',
        fname: 'المدير',
        lname: 'العام'
      };
      setUserDoc(userDocData);
      setRole('admin');
      await setDoc(doc(db, 'users', firebaseUser.uid), userDocData);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
    setUserDoc(null);
  };

  const value = {
    user,
    role,
    userDoc,
    loading,
    logout,
    isAdmin: () => role === 'admin',
    isSupervisor: () => role === 'supervisor'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};