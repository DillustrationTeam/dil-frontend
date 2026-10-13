'use client';

import React, { useState } from 'react';
import { Send, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

interface InviteJuryCardProps {
  onInviteSent?: (email: string) => void;
  isJudgingPhaseActive?: boolean;
}

export function InviteJuryCard({ onInviteSent, isJudgingPhaseActive = false }: InviteJuryCardProps) {
  const [email, setEmail] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isJudgingPhaseActive) {
      toast.error('Cannot send jury invitation once the judging phase has started.');
      return;
    }
    if (!email) {
      toast.error('Please enter an email address!');
      return;
    }

    setIsSubmitting(true);
    try {
      if (onInviteSent) {
        await onInviteSent(email);
      }
      setEmail('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="glass-container rounded-2xl p-6 h-fit border border-white/10 bg-[#161926]/90 backdrop-blur-xl">
      <div className="flex items-center gap-2 mb-1">
        <Mail className="w-5 h-5 text-brand-periwinkle" />
        <h2 className="text-xl font-bold font-h1 text-on-surface">Invite Member</h2>
      </div>
      <p className="text-xs text-outline mb-5 leading-relaxed">
        Send invitation to potential jury members via email.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5 font-medium">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#090b12]/70 text-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-periwinkle focus:ring-1 focus:ring-brand-periwinkle/30 transition-all placeholder:text-slate-500"
            placeholder="enter.email@dillustration.vn"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#a7acd9] to-[#7fd5e8] text-brand-navy font-bold text-xs sm:text-sm hover:brightness-110 transition-all shadow-[0_0_20px_rgba(167,172,217,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          <Send className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
          {isSubmitting ? 'Sending...' : 'Send Invitation'}
        </button>
      </form>
    </aside>
  );
}

