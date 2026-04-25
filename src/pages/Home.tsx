import React, { useState, useEffect } from 'react';
import { User, db, collection, query, where, getDocs, onSnapshot, addDoc, serverTimestamp, orderBy, OperationType, handleFirestoreError } from '../lib/firebase';
import { Wishlist, Gift } from '../types';
import GiftCard from '../components/GiftCard';
import AddGiftModal from '../components/AddGiftModal';
import { Plus, Share2, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Home({ user }: { user: User }) {
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // 1. Get or create wishlist
    const fetchWishlist = async () => {
      const q = query(collection(db, 'wishlists'), where('userId', '==', user.uid));
      try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          // Create default wishlist
          const newWishlist = {
            title: `${user.displayName} 的生日愿望`,
            userId: user.uid,
            userEmail: user.email,
            userName: user.displayName,
            createdAt: serverTimestamp()
          };
          await addDoc(collection(db, 'wishlists'), newWishlist);
          // Wishlist will be fetched by onSnapshot or similar
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'wishlists');
      }
    };

    fetchWishlist();

    // 2. Real-time wishlist listener
    const qWishlist = query(collection(db, 'wishlists'), where('userId', '==', user.uid));
    const unsubscribeWishlist = onSnapshot(qWishlist, (snapshot) => {
      if (!snapshot.empty) {
        setWishlist({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Wishlist);
      }
    });

    return () => unsubscribeWishlist();
  }, [user]);

  useEffect(() => {
    if (!wishlist) return;

    // 3. Real-time gifts listener
    const qGifts = query(collection(db, 'wishlists', wishlist.id, 'gifts'), orderBy('order', 'asc'));
    const unsubscribeGifts = onSnapshot(qGifts, (snapshot) => {
      const g = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gift));
      setGifts(g);
      setLoading(false);
    });

    return () => unsubscribeGifts();
  }, [wishlist]);

  const copyShareLink = () => {
    if (!wishlist) return;
    const url = `${window.location.origin}/w/${wishlist.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading && !wishlist) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-neutral-400 text-xs text-center">正在准备您的愿望清单...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-8 flex flex-col gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-bento-secondary uppercase mb-1">生日愿望单 v1.0</p>
          <h1 className="text-3xl font-bold tracking-tight text-bento-text">{wishlist?.title}</h1>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={copyShareLink}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-bento-border rounded-full hover:bg-neutral-50 transition-all group active:scale-95 shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-bento-success" />
                <span className="font-semibold text-xs text-bento-text">已复制</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-bento-secondary group-hover:text-bento-text" />
                <span className="font-semibold text-xs text-bento-text">分享链接</span>
              </>
            )}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-bento-accent text-white rounded-full font-bold text-xs shadow-sm hover:opacity-90 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>添加愿望</span>
          </button>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 gap-4 mb-12">
        {/* Status Card (Bento Feature) */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-bento-card-border flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-sm font-bold text-bento-text mb-1">愿望单状态</h2>
              <p className="text-xs text-bento-secondary uppercase tracking-wide">宝贝被认领情况</p>
            </div>
            <div className="h-6 w-6 rounded-full bg-bento-success flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold leading-none">
                {gifts.filter(g => g.status === 'claimed').length}
                <span className="text-bento-border text-xl"> / {gifts.length}</span>
              </p>
              <p className="text-[10px] font-black text-bento-secondary uppercase tracking-widest">
                {((gifts.filter(g => g.status === 'claimed').length / (gifts.length || 1)) * 100).toFixed(0)}% 完成
              </p>
            </div>
            <div className="w-full bg-bento-bg h-2 rounded-full overflow-hidden">
              <div 
                className="bg-bento-success h-full transition-all duration-1000" 
                style={{ width: `${(gifts.filter(g => g.status === 'claimed').length / (gifts.length || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {gifts.map((gift) => (
            <motion.div
              key={gift.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              <GiftCard 
                gift={gift} 
                wishlistId={wishlist!.id} 
                isOwner 
              />
            </motion.div>
          ))}
          
          {gifts.length < 10 && (
            <motion.button
              layout
              onClick={() => setIsAddModalOpen(true)}
              className="group aspect-video rounded-[24px] border-2 border-dashed border-bento-border hover:border-bento-text hover:bg-white transition-all flex flex-col items-center justify-center gap-3 active:scale-[0.98] bg-white shadow-sm"
            >
              <div className="w-8 h-8 rounded-full bg-bento-bg flex items-center justify-center mb-1 group-hover:bg-bento-text group-hover:text-white transition-all">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black text-bento-secondary uppercase tracking-widest group-hover:text-bento-text">
                槽位 {gifts.length + 1} / 10
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Footer Bento Card */}
        <div className="bg-bento-text text-white rounded-[24px] p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <p className="text-xs text-bento-secondary font-bold uppercase tracking-wider">隐身/保护活跃</p>
            <div className="h-6 w-6 rounded-full bg-bento-success flex items-center justify-center">
               <Check className="w-3 h-3 text-white" />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold mb-1">隐私匿名保护</p>
            <p className="text-xs text-bento-secondary leading-relaxed font-medium">朋友们可以看到哪些礼物已被认领，但不会显示由谁认领。为您保留一份神秘感！</p>
          </div>
        </div>
      </div>

      <AddGiftModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        wishlistId={wishlist?.id || ''}
        currentCount={gifts.length}
      />
    </div>
  );
}
