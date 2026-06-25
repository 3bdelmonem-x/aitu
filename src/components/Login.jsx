import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Toast from './Shared/Toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser, setRole, setUserDoc } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const emailLower = email.trim().toLowerCase();
      
      // Check if supervisor exists
      const svQuery = query(collection(db, 'supervisors'), where('email', '==', emailLower));
      const svSnap = await getDocs(svQuery);
      
      let userCredential;
      if (!svSnap.empty) {
        const svData = svSnap.docs[0].data();
        if (svData.password !== password) {
          setError('كلمة المرور غير صحيحة');
          setLoading(false);
          return;
        }
        try {
          userCredential = await signInWithEmailAndPassword(auth, emailLower, password);
        } catch (ae) {
          if (ae.code === 'auth/user-not-found' || ae.code === 'auth/invalid-credential') {
            userCredential = await createUserWithEmailAndPassword(auth, emailLower, password);
          } else {
            throw ae;
          }
        }
      } else {
        userCredential = await signInWithEmailAndPassword(auth, emailLower, password);
      }
      
      navigate('/');
    } catch (err) {
      const messages = {
        'auth/user-not-found': 'البريد أو كلمة المرور غير صحيحة',
        'auth/wrong-password': 'كلمة المرور غير صحيحة',
        'auth/invalid-credential': 'البريد أو كلمة المرور غير صحيحة',
        'auth/invalid-email': 'البريد الإلكتروني غير صالح',
        'auth/too-many-requests': 'محاولات كثيرة، حاول لاحقاً'
      };
      setError(messages[err.code] || 'خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">
          <img src="/fff.png" alt="AITU" />
          <p>نظام إدارة التدريب — AITU</p>
        </div>
        {error && <div className="login-err show">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-g">
            <label><i className="bi bi-envelope"></i> البريد الإلكتروني</label>
            <input 
              className="fc" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@aitu.edu" 
              required
            />
          </div>
          <div className="form-g">
            <label><i className="bi bi-shield-lock"></i> كلمة المرور</label>
            <input 
              className="fc" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              required
            />
          </div>
          <button 
            type="submit" 
            className={`btn btn-primary ${loading ? 'loading' : ''}`} 
            style={{ width: '100%', justifyContent: 'center', padding: '11px' }}
            disabled={loading}
          >
            <i className="bi bi-box-arrow-in-right"></i>
            <span> تسجيل الدخول</span>
          </button>
        </form>
        <div className="login-footer">نظام إدارة التدريب — AITU</div>
      </div>
    </div>
  );
};

export default Login;