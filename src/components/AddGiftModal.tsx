import React, { useState, useRef } from 'react';
import { X, Upload, Sparkles, Image as ImageIcon, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeGiftScreenshot } from '../lib/ai';
import { db, collection, addDoc, serverTimestamp, OperationType, handleFirestoreError } from '../lib/firebase';

interface AddGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistId: string;
  currentCount: number;
}

export default function AddGiftModal({ isOpen, onClose, wishlistId, currentCount }: AddGiftModalProps) {
  const [step, setStep] = useState<'upload' | 'edit'>('upload');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setStep('upload');
    setName('');
    setPrice('');
    setImageUrl('');
    setAnalyzing(false);
    setSaving(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image is too large. Please keep it under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImageUrl(base64);
      setStep('edit');
      setAnalyzing(true);
      
      const result = await analyzeGiftScreenshot(base64);
      if (result) {
        if (result.name) setName(result.name);
        if (result.price) setPrice(result.price.toString());
      }
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !wishlistId) return;

    setSaving(true);
    try {
      const giftData = {
        name,
        price: price ? parseFloat(price) : null,
        imageUrl,
        status: 'available',
        order: currentCount,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'wishlists', wishlistId, 'gifts'), giftData);
      onClose();
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `wishlists/${wishlistId}/gifts`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden shadow-2xl h-[90vh] sm:h-auto flex flex-col"
      >
        <div className="p-6 flex items-center justify-between border-b border-bento-border">
          <h2 className="text-xl font-bold tracking-tight text-bento-text">添加愿望</h2>
          <button onClick={onClose} className="p-2 hover:bg-bento-bg rounded-full transition-colors">
            <X className="w-5 h-5 text-bento-secondary" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {step === 'upload' ? (
            <div className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group w-full aspect-[4/3] rounded-[24px] border-2 border-dashed border-bento-border hover:border-bento-accent hover:bg-bento-bg transition-all flex flex-col items-center justify-center gap-4 cursor-pointer bg-bento-bg/30"
              >
                <div className="w-16 h-16 rounded-[18px] bg-white shadow-sm group-hover:bg-bento-accent group-hover:text-white flex items-center justify-center transition-all border border-bento-border group-hover:border-bento-accent">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center px-6">
                  <p className="font-bold text-lg text-bento-text">上传截图</p>
                  <p className="text-bento-secondary text-[11px] font-bold mt-1 uppercase tracking-widest">支持淘宝/小红书/京东等</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-bento-border"></span></div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black text-bento-border">
                  <span className="bg-white px-4">或者</span>
                </div>
              </div>

              <button 
                onClick={() => setStep('edit')}
                className="w-full py-4 bg-white border border-bento-border text-bento-text rounded-2xl font-bold hover:bg-bento-bg transition-colors flex items-center justify-center gap-2 group shadow-sm active:scale-95"
              >
                <Camera className="w-4 h-4 transition-transform group-hover:scale-110" />
                手动录入愿望
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-8">
              <div className="space-y-6">
                <div className="relative w-full aspect-video flex-shrink-0 bg-bento-bg rounded-[24px] overflow-hidden group border border-bento-border shadow-inner">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Gift" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-bento-border">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                  <button 
                    type="button"
                    onClick={() => setStep('upload')}
                    className="absolute inset-x-4 bottom-4 bg-bento-text/90 backdrop-blur-md text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                  >
                    重新上传截图
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2 relative">
                    <label className="text-[10px] uppercase font-black tracking-widest text-bento-secondary ml-1">礼物名称</label>
                    <input 
                      autoFocus
                      required
                      placeholder={analyzing ? "AI 识别中..." : "输入礼物正式全称"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-5 py-4 bg-bento-bg border-transparent focus:bg-white focus:border-bento-accent rounded-2xl transition-all outline-none font-bold border border-bento-border shadow-sm placeholder:text-bento-border"
                    />
                    {analyzing && (
                      <Sparkles className="absolute right-4 top-11 w-4 h-4 text-bento-accent animate-pulse" />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-bento-secondary ml-1">参考价格 (可选)</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-bento-secondary leading-none">¥</span>
                      <input 
                        type="number"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full pl-10 pr-5 py-4 bg-bento-bg border-transparent focus:bg-white focus:border-bento-accent rounded-2xl transition-all outline-none font-bold border border-bento-border shadow-sm placeholder:text-bento-border"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 py-4 pt-2">
                <button 
                  type="submit"
                  disabled={saving || !name}
                  className="w-full py-5 bg-bento-accent text-white font-bold rounded-2xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-bento-accent/20"
                >
                  {saving ? '正在加密保存...' : '极速存入愿望单'}
                </button>
                <button 
                  type="button"
                  onClick={onClose}
                  className="w-full py-4 text-bento-secondary font-bold hover:text-bento-text rounded-2xl transition-colors text-[11px] uppercase tracking-widest"
                >
                  我再想想
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
