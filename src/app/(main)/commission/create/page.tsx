'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { commissionService } from '@/services/commission.service';

export default function CreateCommissionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [creatorId, setCreatorId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await commissionService.create({
        creatorId,
        title,
        description,
        totalPrice: price,
        milestones: [
          { sequence: 1, title: 'Final delivery', price }
        ]
      });
      router.push('/client/commissions');
    } catch {
      alert('Error creating commission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl w-full mx-auto px-6 py-10 space-y-8">
      {/* Hero Title */}
      <div className="text-center space-y-2">
        <h1 className="font-h1 text-4xl font-extrabold tracking-tight text-white">
          Commission <span className="text-[#C5C9F8] drop-shadow-[0_0_20px_rgba(197,201,248,0.4)]">Request</span>
        </h1>
        <p className="text-xs text-[#8A8FA9] max-w-md mx-auto">
          Elevate your vision with a custom ethereal masterpiece. Define your project parameters below.
        </p>
      </div>

      {/* 4-Step Circle Wizard Stepper */}
      <div className="flex items-center justify-between max-w-lg mx-auto px-4 text-[11px] font-bold">
        {/* Step 1: Active */}
        <div className="flex flex-col items-center gap-1.5 text-[#C5C9F8]">
          <div className="w-10 h-10 rounded-full border-2 border-[#C5C9F8] bg-[#C5C9F8]/20 flex items-center justify-center shadow-[0_0_15px_rgba(197,201,248,0.3)]">
            <span className="material-symbols-outlined text-base">edit</span>
          </div>
          <span className="tracking-wider uppercase text-[9px]">PROJECT DETAILS</span>
        </div>
        <div className="h-[1px] flex-grow bg-white/10 -mt-5 mx-2"></div>

        {/* Step 2 */}
        <div className="flex flex-col items-center gap-1.5 text-[#8A8FA9]">
          <div className="w-10 h-10 rounded-full border border-white/15 bg-white/5 flex items-center justify-center">
            <span className="material-symbols-outlined text-base">schedule</span>
          </div>
          <span className="tracking-wider uppercase text-[9px]">TIMELINE</span>
        </div>
        <div className="h-[1px] flex-grow bg-white/10 -mt-5 mx-2"></div>

        {/* Step 3 */}
        <div className="flex flex-col items-center gap-1.5 text-[#8A8FA9]">
          <div className="w-10 h-10 rounded-full border border-white/15 bg-white/5 flex items-center justify-center">
            <span className="material-symbols-outlined text-base">folder</span>
          </div>
          <span className="tracking-wider uppercase text-[9px]">ASSETS</span>
        </div>
        <div className="h-[1px] flex-grow bg-white/10 -mt-5 mx-2"></div>

        {/* Step 4 */}
        <div className="flex flex-col items-center gap-1.5 text-[#8A8FA9]">
          <div className="w-10 h-10 rounded-full border border-white/15 bg-white/5 flex items-center justify-center">
            <span className="material-symbols-outlined text-base">play_arrow</span>
          </div>
          <span className="tracking-wider uppercase text-[9px]">REVIEW</span>
        </div>
      </div>

      {/* Step 1 Form Card */}
      <form onSubmit={handleSubmit} className="bg-[#141722]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-8 space-y-6">
        {/* Project Title */}
        <div className="space-y-2">
          <label className="block text-[10px] uppercase font-bold tracking-wider text-[#8A8FA9]">PROJECT TITLE</label>
          <input 
            type="text" 
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Neon Genesis Character Illustration" 
            className="w-full px-4 py-3.5 bg-black/40 rounded-xl border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-[#C5C9F8] transition-colors" 
          />
        </div>

        {/* Style & Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold tracking-wider text-[#8A8FA9]">CREATOR ID</label>
            <input 
              type="text" 
              required
              value={creatorId}
              onChange={e => setCreatorId(e.target.value)}
              className="w-full px-4 py-3.5 bg-black/40 rounded-xl border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-[#C5C9F8] transition-colors" 
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold tracking-wider text-[#8A8FA9]">PRICE (USD)</label>
            <input 
              type="number" 
              required
              min={1}
              value={price}
              onChange={e => setPrice(Number(e.target.value))}
              className="w-full px-4 py-3.5 bg-black/40 rounded-xl border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-[#C5C9F8] transition-colors" 
            />
          </div>
        </div>

        {/* Detailed Brief */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-[10px] uppercase font-bold tracking-wider text-[#8A8FA9]">DETAILED BRIEF</label>
            <span className="text-[10px] font-bold text-emerald-400 font-mono">{description.length} chars</span>
          </div>
          <textarea 
            rows={4} 
            required
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="I am looking for a full-body cyberpunk character..."
            className="w-full px-4 py-3.5 bg-black/40 rounded-xl border border-white/10 text-white text-xs font-medium leading-relaxed focus:outline-none focus:border-[#C5C9F8] transition-colors"
          />
        </div>

        {/* Continue Action Button */}
        <div className="pt-4 flex justify-end">
          <button 
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 bg-white hover:bg-[#C5C9F8] text-[#0d0e15] font-extrabold rounded-xl text-xs transition-all shadow-xl flex items-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Submitting...' : 'Continue'}</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </form>
    </div>
  );
}
