import { Gift } from '../types';
import { db, doc, updateDoc, deleteDoc, serverTimestamp, OperationType, handleFirestoreError } from '../lib/firebase';
import { Trash2, CheckCircle2, User as UserIcon } from 'lucide-react';
import React, { useState } from 'react';

interface GiftCardProps {
  key?: string | number;
  gift: Gift;
  wishlistId: string;
  isOwner?: boolean;
}

export default function GiftCard({ gift, wishlistId, isOwner }: GiftCardProps) {
  const [claiming, setClaiming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleClaim = async () => {
    if (isOwner || gift.status === 'claimed') return;
    
    // Quick confirmation
    if (!window.confirm("确定要认领这个礼物吗？一旦认领，其他人将无法再选择。")) return;

    const name = window.prompt("请输入您的称呼（可选）：") || "一位匿名好友";
    
    setClaiming(true);
    try {
      const giftRef = doc(db, 'wishlists', wishlistId, 'gifts', gift.id);
      await updateDoc(giftRef, {
        status: 'claimed',
        claimedBy: name,
        claimedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `wishlists/${wishlistId}/gifts/${gift.id}`);
    } finally {
      setClaiming(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwner) return;
    if (!window.confirm("确定要删除这个愿望吗？")) return;

    setDeleting(true);
    try {
      const giftRef = doc(db, 'wishlists', wishlistId, 'gifts', gift.id);
      await deleteDoc(giftRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `wishlists/${wishlistId}/gifts/${gift.id}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`relative group aspect-[16/10] rounded-[24px] overflow-hidden bg-white border border-bento-card-border shadow-sm transition-all hover:shadow-md ${gift.status === 'claimed' ? 'bg-neutral-100/50 opacity-80' : ''}`}>
      {gift.imageUrl ? (
        <img 
          src={gift.imageUrl} 
          alt={gift.name} 
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${gift.status === 'claimed' ? 'grayscale' : ''}`}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full bg-bento-bg flex items-center justify-center text-bento-border transition-colors group-hover:bg-neutral-100">
          <GiftIcon className="w-10 h-10" />
        </div>
      )}

      {/* Info Card Style Overlay (Bento-like) */}
      <div className="absolute inset-x-3 bottom-3 bg-white/90 backdrop-blur-md rounded-[18px] p-4 border border-white/20 shadow-lg flex flex-col group-hover:translate-y-[-4px] transition-transform">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h3 className={`font-bold text-sm tracking-tight truncate ${gift.status === 'claimed' ? 'text-bento-secondary line-through' : 'text-bento-text'}`}>{gift.name}</h3>
            {gift.price && (
              <p className="text-bento-secondary text-[11px] font-bold">¥{gift.price.toLocaleString()}</p>
            )}
          </div>
          
          {gift.status === 'claimed' ? (
            <div className="shrink-0 bg-bento-text text-white text-[9px] px-2 py-1 rounded-full font-black uppercase tracking-tighter shadow-sm">
              已认领
            </div>
          ) : !isOwner && (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="shrink-0 px-3 py-1.5 bg-bento-accent text-white rounded-full text-[10px] font-black hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
            >
              {claiming ? '...' : '我赠送'}
            </button>
          )}
        </div>
      </div>

      {isOwner && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="absolute top-3 left-3 p-2 bg-white/80 backdrop-blur-md ring-1 ring-black/5 rounded-full text-bento-text sm:opacity-0 group-hover:opacity-100 hover:bg-white transition-all shadow-sm active:scale-90"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      {!isOwner && gift.status === 'claimed' && gift.claimedBy && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/80 backdrop-blur-md rounded-full border border-black/5">
           <UserIcon className="w-2.5 h-2.5 text-bento-secondary" />
           <span className="text-[10px] font-black text-bento-secondary">{gift.claimedBy} 已订</span>
        </div>
      )}
    </div>
  );
}

function GiftIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect width="20" height="5" x="2" y="7" />
      <line x1="12" x2="12" y1="22" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}
