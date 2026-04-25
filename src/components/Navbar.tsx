import { User, auth, signOut } from '../lib/firebase';
import { LogOut, Gift as GiftIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar({ user }: { user: User | null }) {
  const handleLogout = () => signOut(auth);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
      <div className="max-w-md mx-auto px-5 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
            <GiftIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold tracking-tighter text-xl font-serif">生日愿望单</span>
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt={user.displayName || ''} 
                className="w-8 h-8 rounded-full border border-neutral-200"
              />
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-neutral-400 hover:text-black transition-colors"
              title="退出登录"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
