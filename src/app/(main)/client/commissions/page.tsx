'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { commissionService } from '@/services/commission.service';
import { Commission } from '@/types/commission.types';
import { FolderKanban, PlusCircle, ShieldCheck, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import CreateCommissionModal from '@/components/modals/CreateCommissionModal';

export default function ClientDashboardPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    commissionService.getByClient()
      .then(setCommissions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl w-full mx-auto space-y-6">
      {/* Dashboard Top Header Banner */}


      {/* METRIC STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[24px] p-5 space-y-2 border-l-4 border-l-emerald-400 shadow-lg">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ACTIVE COMMISSIONS</span>
          <h3 className="font-space-grotesk text-2xl font-bold text-white">{commissions.length || 3} Orders</h3>
        </div>

        <div className="bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[24px] p-5 space-y-2 border-l-4 border-l-indigo-500 shadow-lg">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">TOTAL ESCROW HELD</span>
          <h3 className="font-space-grotesk text-2xl font-bold text-indigo-300">$1,450.00</h3>
        </div>

        <div className="bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[24px] p-5 space-y-2 border-l-4 border-l-amber-400 shadow-lg">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">PENDING REVIEWS</span>
          <h3 className="font-space-grotesk text-2xl font-bold text-amber-300">1 Milestone</h3>
        </div>

        <div className="bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[24px] p-5 space-y-2 border-l-4 border-l-purple-500 shadow-lg">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">COMPLETED PROJECTS</span>
          <h3 className="font-space-grotesk text-2xl font-bold text-purple-300">12 Works</h3>
        </div>
      </div>

      {/* ACTIVE COMMISSIONS LIST */}
      <div className="bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="font-space-grotesk font-bold text-white text-base flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-400" /> Active Commission Workrooms
          </h3>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 font-mono text-xs">Loading active commissions...</div>
        ) : (
          <div className="grid gap-4">
            {/* Demo Active Order 1 */}
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4 hover:border-indigo-500/40 transition-all">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400 font-space-grotesk text-xs font-bold">#CMD-8842</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Action Required: Review Stage 1
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm">Cyberpunk Character Fullbody Artwork</h4>
                  <p className="text-xs text-slate-400">Creator: @KaelenVoss • Escrow Budget: $450 USD</p>
                </div>

                <Link
                  href="/workroom/1"
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-sora font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
                >
                  Enter Workroom <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Milestone Mini Tracker */}
              <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-bold">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">1. Sketch (Review)</div>
                <div className="p-2.5 rounded-xl bg-white/5 text-slate-500 border border-white/5">2. Lineart</div>
                <div className="p-2.5 rounded-xl bg-white/5 text-slate-500 border border-white/5">3. Color</div>
                <div className="p-2.5 rounded-xl bg-white/5 text-slate-500 border border-white/5">4. Delivery</div>
              </div>
            </div>

            {/* Demo Active Order 2 */}
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4 hover:border-indigo-500/40 transition-all">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400 font-space-grotesk text-xs font-bold">#CMD-7731</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> In Progress (Stage 3)
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm">Live2D Vtuber Chibi Avatar Rigging</h4>
                  <p className="text-xs text-slate-400">Creator: @SoraArt • Escrow Budget: $800 USD</p>
                </div>

                <Link
                  href="/workroom/1"
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-sora font-semibold text-xs rounded-xl border border-white/10 flex items-center gap-1.5 transition-all"
                >
                  Enter Workroom <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Milestone Mini Tracker */}
              <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-bold">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">1. Concept ✓</div>
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">2. Layers ✓</div>
                <div className="p-2.5 rounded-xl bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">3. Rigging ⏳</div>
                <div className="p-2.5 rounded-xl bg-white/5 text-slate-500 border border-white/5">4. Package</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trigger Modal */}
      <CreateCommissionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
