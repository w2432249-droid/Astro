/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, User } from './lib/firebase';
import Home from './pages/Home';
import WishlistView from './pages/WishlistView';
import Navbar from './components/Navbar';
import { Gift as GiftIcon } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans antialiased pb-20 sm:pb-0">
        <Navbar user={user} />
        <main className="max-w-md mx-auto px-5 py-6">
          <Routes>
            <Route path="/" element={user ? <Home user={user} /> : <Navigate to="/login" />} />
            <Route path="/login" element={<LoginPage user={user} />} />
            <Route path="/w/:wishlistId" element={<WishlistView user={user} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function LoginPage({ user }: { user: User | null }) {
  if (user) return <Navigate to="/" />;

  const [signingIn, setSigningIn] = useState(false);
  const handleSignIn = async () => {
    const { signInWithPopup, googleProvider } = await import('./lib/firebase');
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error(error);
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-700">
      <div className="w-16 h-16 rounded-[20px] bg-white border border-bento-card-border shadow-sm flex items-center justify-center mb-8 bg-gradient-to-tr from-bento-bg to-white">
        <GiftIcon className="w-8 h-8 text-bento-text" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight text-bento-text mb-4">生日愿望单</h1>
      <p className="text-bento-secondary mb-12 max-w-[280px] text-center text-sm leading-relaxed font-medium">
        Precision Request System v1.0<br />一个极简的愿望清单管理工具。
      </p>
      <button
        onClick={handleSignIn}
        disabled={signingIn}
        className="w-full max-w-[280px] py-4 bg-bento-accent text-white rounded-2xl font-bold hover:bg-opacity-90 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-bento-accent/20"
      >
        {signingIn ? '正在连接...' : '使用 Google 账号登录'}
      </button>
      
      <div className="mt-12 grid grid-cols-2 gap-3 w-full max-w-[280px]">
        <div className="bg-white p-4 rounded-2xl border border-bento-card-border shadow-sm text-center">
          <p className="text-[10px] font-black text-bento-secondary uppercase tracking-widest mb-1">隐私</p>
          <p className="text-xs font-bold">100% 匿名</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-bento-card-border shadow-sm text-center">
          <p className="text-[10px] font-black text-bento-secondary uppercase tracking-widest mb-1">设计</p>
          <p className="text-xs font-bold">极简主义</p>
        </div>
      </div>
    </div>
  );
}
