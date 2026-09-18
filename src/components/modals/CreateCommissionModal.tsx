'use client';

import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Upload, CheckCircle2, ShieldCheck, DollarSign, Calendar } from 'lucide-react';
import CommissionStepper from '../commission/CommissionStepper';

import { commissionService } from '@/services/commission.service';

interface CreateCommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
  creatorId?: string;
  creatorName?: string;
}

export default function CreateCommissionModal({
  isOpen,
  onClose,
  onSubmitSuccess,
  creatorId,
  creatorName,
}: CreateCommissionModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Illustration',
    usageType: 'Personal',
    description: '',
    deadline: '',
    budget: 0,
    referenceFiles: [] as string[],
    agreedTerms: false,
  });

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const m1Price = formData.budget * 0.3;
      const m2Price = formData.budget * 0.3;
      const m3Price = formData.budget * 0.4;

      await commissionService.create({
        creatorId: creatorId!,
        title: formData.title,
        description: formData.description,
        deadlineAt: formData.deadline || undefined,
        totalPrice: formData.budget,
        milestones: [
          { sequence: 1, title: 'Sketch', price: m1Price },
          { sequence: 2, title: 'Lineart', price: m2Price },
          { sequence: 3, title: 'Final', price: m3Price },
        ]
      });
      
      if (onSubmitSuccess) onSubmitSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create commission:', error);
      alert('Failed to create commission. Please check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      {/* Modal Container */}
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1a1d2b] shadow-2xl shadow-black/20">
        {/* Header with Title & Close Button */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#1F2335]/70 px-8 pb-4 pt-6">
          <div>
            <div>
              <h2 className="text-lg font-space-grotesk font-bold text-white">{creatorName ? `Request for ${creatorName}` : 'Choose a creator first'}</h2>
              {!creatorName && <p className="text-xs text-slate-400">Open a creator profile and select Commission this artist.</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close commission request"
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Bar Header */}
        <div className="border-b border-white/10 bg-[#1F2335]/70 px-6 py-2">
          <CommissionStepper currentStep={step} onStepClick={(s) => setStep(s)} />
        </div>

        {/* Modal Form Body */}
        <div className="p-8 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: PROJECT DETAILS */}
          {step === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <label className="block text-xs font-space-grotesk font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Commission Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Cyberpunk Character Fullbody Artwork"
                  className="commission-input h-12 w-full rounded-2xl px-4 text-sm placeholder-slate-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-space-grotesk font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Artwork Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="commission-input h-12 w-full rounded-2xl px-4 text-sm"
                  >
                    <option value="Illustration">Digital Illustration</option>
                    <option value="Character Design">Character Concept Art</option>
                    <option value="Vtuber Model">Live2D Vtuber Model</option>
                    <option value="3D Avatar">3D Asset / Avatar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-space-grotesk font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Usage Rights
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, usageType: 'Personal' })}
                      className={`h-12 rounded-2xl text-xs font-sora font-semibold border transition-all ${
                        formData.usageType === 'Personal'
                          ? 'bg-[#A7ACD9]/20 border-[#A7ACD9]/60 text-white'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      Personal Use
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, usageType: 'Commercial' })}
                      className={`h-12 rounded-2xl text-xs font-sora font-semibold border transition-all ${
                        formData.usageType === 'Commercial'
                          ? 'bg-[#A7ACD9]/20 border-[#A7ACD9]/60 text-white'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      Commercial (+50%)
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-space-grotesk font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Detailed Brief Description *
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your vision, character details, color palette, mood, and references..."
                  className="commission-input w-full rounded-2xl p-4 text-sm placeholder-slate-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* STEP 2: TIMELINE & BUDGET */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-space-grotesk font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Target Completion Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-4 top-4 pointer-events-none" />
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      className="commission-input h-12 w-full rounded-2xl py-0 pl-11 pr-4 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-space-grotesk font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Total Estimated Budget ($ USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-4 top-4 pointer-events-none" />
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                      className="commission-input h-12 w-full rounded-2xl py-0 pl-11 pr-4 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Milestone Breakdown Preview */}
              <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                <h4 className="text-xs font-space-grotesk font-bold uppercase tracking-wider text-[#A7ACD9]">
                  Automated Milestone Escrow Schedule
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-300 p-2.5 rounded-xl bg-black/20 border border-white/5">
                    <span>Stage 1: Rough Sketch & Concept (30%)</span>
                    <span className="font-bold text-emerald-400">${(formData.budget * 0.3).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-300 p-2.5 rounded-xl bg-black/20 border border-white/5">
                    <span>Stage 2: Lineart & Base Colors (30%)</span>
                    <span className="font-bold text-emerald-400">${(formData.budget * 0.3).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-300 p-2.5 rounded-xl bg-black/20 border border-white/5">
                    <span>Stage 3: High-Res Render & Deliverables (40%)</span>
                    <span className="font-bold text-emerald-400">${(formData.budget * 0.4).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ASSETS & REFERENCES */}
          {step === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <label className="block text-xs font-space-grotesk font-bold text-slate-300 uppercase tracking-wider">
                Upload Reference Files / Character Sheets
              </label>
              <div className="group cursor-pointer rounded-3xl border-2 border-dashed border-white/20 bg-white/5 p-8 text-center transition-all hover:border-[#A7ACD9]/60">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A7ACD9]/15 text-[#A7ACD9] transition-transform group-hover:scale-110">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-white">Click or Drag & Drop reference images</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG, PSD up to 50MB per file</p>
              </div>

            </div>
          )}

          {/* STEP 4: REVIEW & SUBMIT */}
          {step === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-4 rounded-2xl bg-white/[0.04] p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">{formData.title || 'Untitled Request'}</h3>
                    <p className="text-xs text-slate-400">{formData.category} • {formData.usageType} Use</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Total Escrow Budget</p>
                    <p className="text-xl font-bold font-space-grotesk text-emerald-400">${formData.budget} USD</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-[#A7ACD9]" />
                  <span>100% Escrow Protection: Funds will be safely locked in DIL Escrow Vault until you approve each milestone.</span>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreedTerms}
                    onChange={(e) => setFormData({ ...formData, agreedTerms: e.target.checked })}
                    className="h-4 w-4 rounded border-white/20 bg-white/10 text-[#A7ACD9] focus:ring-[#A7ACD9]"
                  />
                  <span className="text-xs text-slate-300">
                    I agree to the DIL Artist Commission Terms & Escrow Guarantee Policy.
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between border-t border-white/10 bg-[#1F2335]/70 px-8 py-5">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 1}
            className={`px-5 py-2.5 rounded-xl text-xs font-sora font-semibold flex items-center gap-2 border transition-all ${
              step === 1
                ? 'opacity-40 border-white/5 text-slate-500 cursor-not-allowed'
                : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="commission-primary flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-sora font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!creatorId || !formData.agreedTerms || isSubmitting}
              className={`px-6 py-2.5 rounded-xl text-xs font-sora font-semibold flex items-center gap-2 transition-all ${
                creatorId && formData.agreedTerms && !isSubmitting
                  ? 'commission-primary hover:scale-[1.02]'
                  : 'bg-white/10 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" /> {!creatorId ? 'Select a creator first' : isSubmitting ? 'Submitting...' : 'Submit & Deposit Escrow'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
