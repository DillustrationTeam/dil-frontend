'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  Upload,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  Send,
  Eye,
  Download,
  Star,
  FileCode2,
} from 'lucide-react';
import FileUploadModal from '@/components/modals/FileUploadModal';
import ReviewRatingModal from '@/components/modals/ReviewRatingModal';
import EscrowPaymentModal from '@/components/modals/EscrowPaymentModal';

export default function WorkroomPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'preview' | 'files' | 'escrow'>('preview');

  // Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isEscrowModalOpen, setIsEscrowModalOpen] = useState(false);

  // Chat messages state
  const [messages, setMessages] = useState([
    { id: 1, sender: 'System', text: 'Workroom #CMD-8842 created with 100% Escrow Protection.', time: '10:00 AM', isSystem: true },
    { id: 2, sender: 'Alex (Client)', text: 'Hi Kaelen! Super excited for this Cyberpunk Artwork. Let me know when Stage 1 sketch is ready!', time: '10:15 AM' },
    { id: 3, sender: 'Kaelen (Artist)', text: 'Uploaded Stage 1 draft sketch! Please review the pose and lighting angle below.', time: '11:30 AM' },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages([
      ...messages,
      { id: Date.now(), sender: 'You', text: newMessage, time: 'Just now' },
    ]);
    setNewMessage('');
  };

  return (
    <div className="max-w-7xl w-full mx-auto space-y-6">
      {/* Top Header Card: Minimalist Title + Icon Badges */}
      <div className="bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-space-grotesk text-xs font-bold border border-indigo-500/30">
                #CMD-8842
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-sora text-xs font-semibold border border-amber-500/30 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Action Required: Review Stage 1
              </span>
            </div>
            <h1 className="text-xl lg:text-2xl font-space-grotesk font-bold text-white">
              Cyberpunk Character Fullbody Artwork
            </h1>
            <p className="text-xs text-slate-400">Client: @AlexMorgan • Creator: @KaelenVoss</p>
          </div>

          {/* Icon-Driven Status Badges Bar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold" title="Total Escrow Deposited">
              <ShieldCheck className="w-4 h-4" />
              <span>$450 USD</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-medium" title="Remaining Revisions">
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
              <span>2/3 Revisions Left</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-medium" title="Deadline">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>3 Days Remaining</span>
            </div>
          </div>
        </div>

        {/* Icon-Driven 4-Milestone Progress Tracker */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Milestone 1 - Active Review (Action Required Glowing Card) */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Stage 1: Sketch</p>
                <p className="text-[10px] text-amber-300 font-medium">$135 • Pending Review</p>
              </div>
            </div>
          </div>

          {/* Milestone 2 - Locked */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5 text-slate-400 opacity-60">
            <div className="w-8 h-8 rounded-xl bg-white/5 text-slate-500 flex items-center justify-center shrink-0 border border-white/10">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-300">Stage 2: Lineart</p>
              <p className="text-[10px] text-slate-500">$135 • Locked</p>
            </div>
          </div>

          {/* Milestone 3 - Locked */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5 text-slate-400 opacity-60">
            <div className="w-8 h-8 rounded-xl bg-white/5 text-slate-500 flex items-center justify-center shrink-0 border border-white/10">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-300">Stage 3: Color</p>
              <p className="text-[10px] text-slate-500">$180 • Locked</p>
            </div>
          </div>

          {/* Milestone 4 - Final */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5 text-slate-400 opacity-60">
            <div className="w-8 h-8 rounded-xl bg-white/5 text-slate-500 flex items-center justify-center shrink-0 border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-300">Stage 4: Deliver</p>
              <p className="text-[10px] text-slate-500">Master PSD/PNG</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workroom Layout: Left 5-col Chat & Right 7-col Artwork Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Real-time SignalR Workroom Chat (5 cols) */}
        <div className="lg:col-span-5 bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-5 flex flex-col justify-between h-[580px] shadow-xl">
          <div className="border-b border-white/10 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h3 className="font-space-grotesk text-sm font-bold text-white">Workroom Chat</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-medium border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> SignalR Live
            </span>
          </div>

          {/* Chat Messages Log */}
          <div className="space-y-3 overflow-y-auto my-3 pr-1 text-xs flex-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3.5 rounded-2xl space-y-1 transition-all ${
                  msg.isSystem
                    ? 'bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-center'
                    : msg.sender.includes('You')
                    ? 'bg-indigo-600/30 border border-indigo-500/40 text-white ml-6'
                    : 'bg-white/5 border border-white/10 text-slate-200 mr-6'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                  <span>{msg.sender}</span>
                  <span>{msg.time}</span>
                </div>
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            ))}
          </div>

          {/* Chat Input Box */}
          <div className="pt-2 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type workroom message..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center transition-all shadow-md shadow-indigo-500/20"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Work Canvas Review & Grouped Action Buttons (7 cols) */}
        <div className="lg:col-span-7 bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 space-y-5 flex flex-col justify-between shadow-xl">
          {/* Header & Tabs */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-space-grotesk text-sm font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-400" /> Deliverable Canvas Review
            </h3>
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'preview' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Canvas
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'files' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Files (2)
              </button>
            </div>
          </div>

          {/* Main Artwork Preview Canvas */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="aspect-[16/10] rounded-2xl overflow-hidden relative border border-white/10 bg-black/60 group">
                <img
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"
                  alt="Draft Artwork"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white">
                  <span className="font-space-grotesk font-bold">Stage 1 Sketch Draft v1.2.png</span>
                  <a
                    href="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"
                    target="_blank"
                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Action Required Banner Notification */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 text-amber-300">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
                  <span>
                    <strong>Creator Kaelen Voss</strong> submitted Stage 1 Sketch. Please review & approve to release <strong>$135.00 Escrow</strong>.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Files List Tab View */}
          {activeTab === 'files' && (
            <div className="space-y-3 py-2">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-white">
                <div className="flex items-center gap-3">
                  <FileCode2 className="w-5 h-5 text-indigo-400" />
                  <div>
                    <p className="font-bold">Stage1_Sketch_v1.2.psd</p>
                    <p className="text-[10px] text-slate-400">45.8 MB • Uploaded Today</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-semibold hover:bg-indigo-500/30">
                  Download
                </button>
              </div>
            </div>
          )}

          {/* Grouped Action Buttons Bar directly under Preview */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-2 transition-all"
            >
              <Upload className="w-4 h-4 text-purple-400" /> Upload Deliverable
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 flex items-center gap-1.5 transition-all"
              >
                <Star className="w-4 h-4 text-amber-400" /> Review & Rate
              </button>

              <button
                onClick={() => setIsEscrowModalOpen(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all hover:scale-[1.02]"
              >
                <ShieldCheck className="w-4 h-4" /> Approve Stage 1 ($135)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pop-up Modals Integration */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        milestoneTitle="Stage 1: Sketch & Concept"
      />

      <ReviewRatingModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        creatorName="Kaelen Voss"
      />

      <EscrowPaymentModal
        isOpen={isEscrowModalOpen}
        onClose={() => setIsEscrowModalOpen(false)}
        amountUSD={135}
        milestoneName="Stage 1 Escrow Release"
      />
    </div>
  );
}
