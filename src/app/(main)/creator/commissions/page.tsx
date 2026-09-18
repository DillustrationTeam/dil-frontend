'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { commissionService } from '@/services/commission.service';
import { Commission } from '@/types/commission.types';
import { Palette, Wallet, Clock, ArrowRight, ShieldCheck, Upload, Award } from 'lucide-react';
import FileUploadModal from '@/components/modals/FileUploadModal';

export default function CreatorDashboardPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    commissionService.getByCreator()
      .then(setCommissions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl w-full mx-auto space-y-6">
      {/* Dashboard Top Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-sora text-[11px] font-bold border border-purple-500/30 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5" /> Creator Studio Workspace
            </span>
          </div>
          <h1 className="text-2xl font-space-grotesk font-bold text-white">Creator Studio Dashboard</h1>
          <p className="text-xs text-slate-400">Manage incoming requests, upload deliverables, and track escrow payouts.</p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-sora font-semibold text-xs rounded-xl shadow-lg shadow-purple-500/25 flex items-center gap-2 transition-all hover:scale-[1.02]"
        >
          <Upload className="w-4 h-4" /> Upload Deliverable
        </button>
      </div>

      {/* METRIC STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[24px] p-5 space-y-2 border-l-4 border-l-purple-500 shadow-lg">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ACTIVE CREATIONS</span>
          <h3 className="font-space-grotesk text-2xl font-bold text-white">4 Orders</h3>
        </div>

        <div className="bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[24px] p-5 space-y-2 border-l-4 border-l-emerald-400 shadow-lg">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ESCROW BALANCE</span>
          <h3 className="font-space-grotesk text-2xl font-bold text-emerald-400">$3,850.00</h3>
        </div>

        <div className="bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[24px] p-5 space-y-2 border-l-4 border-l-amber-400 shadow-lg">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">PENDING REQUESTS</span>
          <h3 className="font-space-grotesk text-2xl font-bold text-amber-300">2 Requests</h3>
        </div>

        <div className="bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[24px] p-5 space-y-2 border-l-4 border-l-indigo-400 shadow-lg">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">SATISFACTION RATING</span>
          <h3 className="font-space-grotesk text-2xl font-bold text-indigo-300 flex items-center gap-1.5">
            4.9 <Award className="w-5 h-5 text-amber-400" />
          </h3>
        </div>
      </div>

      {/* ACTIVE CREATOR WORKROOMS */}
      <div className="bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="font-space-grotesk font-bold text-white text-base flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-400" /> Studio Workrooms
          </h3>
        </div>
        
        {loading ? (
          <div className="py-8 text-center text-slate-400 font-mono text-xs">Loading studio workrooms...</div>
        ) : (
          <div className="grid gap-4">
            {/* Active Order Item 1 */}
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4 hover:border-purple-500/40 transition-all">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400 font-space-grotesk text-xs font-bold">#CMD-8842</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Awaiting Client Review (Stage 1)
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm">Cyberpunk Character Fullbody Artwork</h4>
                  <p className="text-xs text-slate-400">Client: @AlexMorgan • Locked Escrow: $450 USD</p>
                </div>
                
                <Link
                  href="/workroom/1"
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-sora font-bold text-xs rounded-xl shadow-lg shadow-purple-500/20 flex items-center gap-1.5 transition-all"
                >
                  Open Workroom <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Milestone Tracker */}
              <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-bold">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">1. Sketch (Uploaded)</div>
                <div className="p-2.5 rounded-xl bg-white/5 text-slate-500 border border-white/5">2. Lineart</div>
                <div className="p-2.5 rounded-xl bg-white/5 text-slate-500 border border-white/5">3. Color</div>
                <div className="p-2.5 rounded-xl bg-white/5 text-slate-500 border border-white/5">4. Delivery</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        milestoneTitle="Studio Workroom Deliverable"
      />
    </div>
  );
}
