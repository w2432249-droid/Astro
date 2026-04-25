import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { db, doc, onSnapshot, getDoc, collection, query, orderBy, OperationType, handleFirestoreError, User } from '../lib/firebase';
import { Wishlist, Gift } from '../types';
import GiftCard from '../components/GiftCard';
import { Gift as GiftIcon, Calendar } from 'lucide-react';

export default function WishlistView({ user }: { user: User | null }) {
  const { wishlistId } = useParams();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!wishlistId) return;

    // 1. Fetch Wishlist
    const unsubscribeWishlist = onSnapshot(doc(db, 'wishlists', wishlistId), (docSnap) => {
      if (docSnap.exists()) {
        setWishlist({ id: docSnap.id, ...docSnap.data() } as Wishlist);
      } else {
        setError(true);
        setLoading(false);
      }
    }, (err) => {
      console.error(err);
      setError(true);
      setLoading(false);
    });

    // 2. Fetch Gifts
    const qGifts = query(collection(db, 'wishlists', wishlistId, 'gifts'), orderBy('order', 'asc'));
    const unsubscribeGifts = onSnapshot(qGifts, (snapshot) => {
      const g = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gift));
      setGifts(g);
      setLoading(false);
    });

    return () => {
      unsubscribeWishlist();
      unsubscribeGifts();
    };
  }, [wishlistId]);

  if (error) {
    return (
      <div className="text-center py-24 animate-in fade-in">
        <h2 className="text-2xl font-bold mb-4">未找到愿望清单</h2>
        <p className="text-neutral-400 text-sm">链接可能已失效或地址不正确。</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
      </div>
    );
  }

  const isOwner = user?.uid === wishlist?.userId;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white shadow-sm border border-bento-card-border rounded-full text-[10px] font-black uppercase tracking-widest text-bento-secondary mb-6">
          <Calendar className="w-3 h-3 text-bento-accent" />
          <span>生日愿望清单 v1.0</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-bento-text mb-4">{wishlist?.title}</h1>
        <div className="p-6 bg-white rounded-[24px] border border-bento-card-border shadow-sm max-w-sm mx-auto mb-8">
          <p className="text-bento-text text-sm font-medium leading-relaxed">
            {wishlist?.userName} 与你分享了他们的生日愿望。<br />点击卡片认领一个礼物送给 TA 吧！
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 mb-16">
        {gifts.map((gift: Gift) => (
          <GiftCard 
            key={gift.id} 
            gift={gift} 
            wishlistId={wishlistId as string} 
            isOwner={!!isOwner} 
          />
        ))}

        {gifts.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-bento-border rounded-[24px] bg-white shadow-sm">
            <GiftIcon className="w-10 h-10 text-bento-border mx-auto mb-3" />
            <p className="text-bento-secondary text-xs font-black uppercase tracking-widest">暂无愿望项目</p>
          </div>
        )}
      </div>

      <footer className="text-center pb-20 pt-8 border-t border-bento-border">
        <p className="text-bento-secondary text-[10px] font-black tracking-widest uppercase mb-4">© 2024 生日愿望单 • 精准送礼系统</p>
        <div className="flex justify-center gap-6 text-[9px] font-black text-bento-border uppercase tracking-tighter">
          <span>极简 UI</span>
          <span>无广告</span>
          <span>直接链接</span>
        </div>
      </footer>
    </div>
  );
}
