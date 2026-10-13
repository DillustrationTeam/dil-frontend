'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  ShieldAlert,
  X,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Maximize2,
  Scale,
  FileText,
} from 'lucide-react';
import type { SubmissionDisputeDto } from '@/features/admin/types/dispute-arbitration.types';
import { formatDisputeCode } from './dispute-queue-table';
import { createPortal } from 'react-dom';

interface DisputeInspectionPanelProps {
  dispute: SubmissionDisputeDto | null;
  isLoading: boolean;
  isSubmitting: boolean;
  onExecuteRuling: (
    disputeId: string,
    resolution: 'Dismiss' | 'Disqualify' | 'RequestReEvaluation',
    note: string
  ) => Promise<void>;
  onClose?: () => void;
}

export function DisputeInspectionPanel({
  dispute,
  isLoading,
  isSubmitting,
  onExecuteRuling,
  onClose,
}: DisputeInspectionPanelProps) {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [selectedResolution, setSelectedResolution] = useState<
    'Dismiss' | 'Disqualify' | 'RequestReEvaluation'
  >('Dismiss');
  const [moderatorNote, setModeratorNote] = useState(
    'Based on cross-referenced telemetry data, metadata inspection, and jury feedback, the committee confirms the official ruling.'
  );

  if (isLoading && !dispute) {
    return (
      <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-12 flex flex-col items-center justify-center min-h-[300px] text-center space-y-3">
        <div className="w-8 h-8 border-2 border-brand-periwinkle border-t-transparent rounded-full animate-spin" />
        <p className="font-h1 font-bold text-white text-sm">
          Loading Dispute Dossier...
        </p>
        <p className="text-xs text-[#8A8FA9]">
          Retrieving evidence files, telemetry logs, and submission records.
        </p>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-10 flex flex-col items-center justify-center text-center space-y-3">
        <Scale className="w-10 h-10 text-[#8A8FA9]/40" />
        <p className="font-h1 font-bold text-white text-base">
          No Dispute Selected for Review
        </p>
        <p className="text-xs text-[#8A8FA9] max-w-md">
          Select any dispute case from the queue above to inspect reported evidence, evaluate claims, and execute moderator rulings.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onExecuteRuling(dispute.id, selectedResolution, moderatorNote);
  };

  return (
    <div className="space-y-4">
      {/* 1. Panel Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-h1 font-bold text-lg text-white flex items-center gap-2">
          <span>Dispute Dossier & Ruling Console</span>
          <span className="text-xs font-mono text-brand-periwinkle px-2 py-0.5 rounded bg-brand-periwinkle/15 border border-brand-periwinkle/30">
            [{formatDisputeCode(dispute.id)}]
          </span>
        </h2>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 text-xs text-[#8A8FA9] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Collapse Panel</span>
          </button>
        )}
      </div>

      {/* 2. Split 2-Column Inspection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Artwork Preview & Dispute Details */}
        <div className="md:col-span-6 glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#8A8FA9] uppercase font-bold tracking-wider block">
              Contest Artwork Evidence
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                dispute.priority === 'High'
                  ? 'bg-red-500/20 text-red-300 border-red-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}
            >
              {dispute.priority} Priority Claim
            </span>
          </div>

          {/* Artwork Image Container */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black/60 group">
            {dispute.artworkImageUrl ? (
              <>
                <Image
                  src={dispute.artworkImageUrl}
                  alt={dispute.submissionTitle || 'Artwork'}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  type="button"
                  onClick={() => setPreviewImageUrl(dispute.artworkImageUrl || null)}
                  className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/70 hover:bg-black text-white text-xs backdrop-blur-md border border-white/20 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1.5 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>View Fullsize</span>
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                <FileText className="w-10 h-10" />
                <span className="text-xs">No artwork image available</span>
              </div>
            )}
          </div>

          {/* Submission & Event Info */}
          <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8A8FA9]">Submission Title:</span>
              <strong className="text-white font-medium">{dispute.submissionTitle || 'Untitled Artwork'}</strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8A8FA9]">Target Contest:</span>
              <span className="text-brand-periwinkle font-medium">{dispute.eventTitle || 'Contest Event'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8A8FA9]">Reported By:</span>
              <span className="text-slate-300 font-medium">{dispute.raisedByName || 'Participant'}</span>
            </div>
          </div>

          {/* Reported Violation Rationale */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Claim Justification:
            </span>
            <p className="text-xs text-slate-300 bg-black/40 p-3.5 rounded-xl border border-white/10 leading-relaxed font-body">
              {dispute.reason}
            </p>
          </div>

          {/* Attached Evidence Gallery & References */}
          {(() => {
            const evidenceList =
              dispute.evidenceUrlList && dispute.evidenceUrlList.length > 0
                ? dispute.evidenceUrlList
                : dispute.evidenceUrls
                ? [dispute.evidenceUrls]
                : [];
            if (evidenceList.length === 0) return null;

            const isImage = (url: string) =>
              /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(url) ||
              url.includes('images.unsplash.com') ||
              url.includes('cloudinary') ||
              url.includes('imgur') ||
              url.startsWith('data:image') ||
              url.startsWith('blob:');

            const imageEvidence = evidenceList.filter(isImage);
            const otherEvidence = evidenceList.filter((url) => !isImage(url));

            return (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#8A8FA9] uppercase tracking-wider block">
                    Attached Evidence:
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {evidenceList.length} item{evidenceList.length > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Evidence Image Gallery */}
                {imageEvidence.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {imageEvidence.map((url, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPreviewImageUrl(url)}
                        className="group relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/40 cursor-pointer hover:border-brand-periwinkle/60 transition-all shadow-md"
                        title="Click to view fullsize evidence"
                      >
                        <Image
                          src={url}
                          alt={`Evidence reference ${idx + 1}`}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 backdrop-blur-[2px]">
                          <span className="text-[10px] text-white font-medium flex items-center gap-1 bg-black/60 px-2 py-1 rounded-md border border-white/20">
                            <Maximize2 className="w-3 h-3 text-brand-periwinkle" />
                            Zoom
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Non-Image Document / URL Links */}
                {otherEvidence.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {otherEvidence.map((url: string, idx: number) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-brand-periwinkle border border-white/10 transition-colors"
                      >
                        <span className="truncate pr-2 font-mono text-[11px]">{url}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Right Column: Moderator Ruling Form */}
        <div className="md:col-span-6 glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 space-y-6 flex flex-col justify-between">
          {(() => {
            const isResolved = dispute.status === 'Resolved' || dispute.status === 'Rejected';
            const effectiveResolution = dispute.resolution || selectedResolution;

            return (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#8A8FA9] uppercase font-bold tracking-wider block">
                      Arbitration Judgment
                    </span>
                    {isResolved && (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          dispute.status === 'Rejected'
                            ? 'border-slate-500/30 bg-slate-500/15 text-slate-300'
                            : 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                        }`}
                      >
                        {dispute.resolution === 'Dismiss'
                          ? 'Dismissed (Report Rejected)'
                          : dispute.resolution === 'Disqualify'
                          ? 'Disqualified (Ruling Applied)'
                          : dispute.resolution === 'RequestReEvaluation'
                          ? 'Re-evaluation Requested'
                          : `${dispute.status} · ${dispute.resolution || 'Concluded'}`}
                      </span>
                    )}
                  </div>
                  <h3 className="font-h1 font-bold text-white text-base mt-1">
                    Select Resolution Action
                  </h3>
                  <p className="text-xs text-[#8A8FA9] mt-0.5">
                    {isResolved
                      ? 'This dispute case has already been resolved and its ruling executed.'
                      : 'Choose the official resolution term to apply to this dispute case.'}
                  </p>
                </div>

                {/* Already Resolved Notice Banner */}
                {isResolved && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                      dispute.status === 'Rejected'
                        ? 'border-slate-500/30 bg-slate-500/10'
                        : 'border-emerald-500/30 bg-emerald-500/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      {dispute.status === 'Rejected' ? (
                        <>
                          <XCircle className="w-4 h-4 shrink-0 text-slate-400" />
                          <span className="text-slate-200">Dispute Dismissed (Report Rejected)</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                          <span className="text-emerald-300">
                            Dispute Upheld: {dispute.resolution || 'Resolved'}
                          </span>
                        </>
                      )}
                    </div>
                    {dispute.note && (
                      <p className="text-[#D6D9FF] text-[11px] leading-relaxed pl-6">
                        <strong>Official Note:</strong> {dispute.note}
                      </p>
                    )}
                    {dispute.resolvedAt && (
                      <p className="text-[#8A8FA9] text-[10px] pl-6 font-mono">
                        Resolved on {new Date(dispute.resolvedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* 3 Ruling Actions Grid */}
                <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2.5 ${isResolved ? 'opacity-60 pointer-events-none cursor-not-allowed' : ''}`}>
                  {/* Option 1: Dismiss Appeal */}
                  <button
                    type="button"
                    disabled={isResolved}
                    onClick={() => !isResolved && setSelectedResolution('Dismiss')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                      effectiveResolution === 'Dismiss'
                        ? 'border-emerald-500 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    } ${isResolved ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs text-emerald-300">Dismiss Appeal</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-[10px] text-slate-300">
                      Reject the report and retain submission eligibility.
                    </p>
                  </button>

                  {/* Option 2: Disqualify Artwork */}
                  <button
                    type="button"
                    disabled={isResolved}
                    onClick={() => !isResolved && setSelectedResolution('Disqualify')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                      effectiveResolution === 'Disqualify'
                        ? 'border-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    } ${isResolved ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs text-red-300">Disqualify Artwork</span>
                      <XCircle className="w-4 h-4 text-red-400" />
                    </div>
                    <p className="text-[10px] text-slate-300">
                      Strip submission eligibility for verified rules violation.
                    </p>
                  </button>

                  {/* Option 3: Request Panel Re-evaluation */}
                  <button
                    type="button"
                    disabled={isResolved}
                    onClick={() => !isResolved && setSelectedResolution('RequestReEvaluation')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                      effectiveResolution === 'RequestReEvaluation'
                        ? 'border-blue-500 bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    } ${isResolved ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs text-blue-300">Request Re-evaluation</span>
                      <Scale className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-[10px] text-slate-300">
                      Instruct Jury Panel to unlock scoresheet & re-evaluate.
                    </p>
                  </button>
                </div>

                {/* Decision Notes Textarea */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white uppercase tracking-wider block">
                    Ruling Rationale & Audit Evidence Notes:
                  </label>
                  <textarea
                    rows={5}
                    disabled={isResolved}
                    value={isResolved ? dispute.note || '' : moderatorNote}
                    onChange={(e) => setModeratorNote(e.target.value)}
                    placeholder="Enter verified findings, citation of rules, and official justification..."
                    className={`w-full rounded-xl border border-white/10 bg-[#090b12]/80 text-white p-3.5 text-xs focus:outline-none focus:border-brand-periwinkle focus:ring-1 focus:ring-brand-periwinkle/30 transition-all resize-y leading-relaxed ${
                      isResolved ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                    required={!isResolved}
                  />
                </div>

                {/* Audit Compliance Disclaimer Badge */}
                <div className="p-3 rounded-xl border-l-4 border-brand-periwinkle bg-brand-periwinkle/10 text-xs text-slate-300 flex items-start gap-2.5 leading-relaxed">
                  <ShieldAlert className="w-4 h-4 text-brand-periwinkle shrink-0 mt-0.5" />
                  <span>
                    All rulings are permanently recorded in the immutable contest audit ledger with handler identity and timestamp.
                  </span>
                </div>

                {/* Submit Action Controls */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  {onClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/5 transition-all cursor-pointer"
                    >
                      {isResolved ? 'Close Dossier' : 'Cancel'}
                    </button>
                  )}
                  {!isResolved && (
                    <button
                      type="submit"
                      disabled={isSubmitting || !moderatorNote.trim()}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#a7acd9] to-[#7fd5e8] text-brand-navy font-bold text-xs hover:brightness-110 transition-all shadow-[0_0_20px_rgba(167,172,217,0.3)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
                          <span>Executing Ruling...</span>
                        </>
                      ) : (
                        <span>
                          Execute Ruling · {selectedResolution === 'RequestReEvaluation' ? 'Re-evaluate' : selectedResolution}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </form>
            );
          })()}
        </div>
      </div>

      {/* Lightbox Modal (Portaled) */}
      {previewImageUrl &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setPreviewImageUrl(null)}
          >
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
              title="Close fullsize preview"
            >
              <X className="w-6 h-6" />
            </button>
            <div
              className="relative max-w-4xl max-h-[85vh] w-full h-[75vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={previewImageUrl}
                alt={dispute.submissionTitle || 'Evidence Preview'}
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
