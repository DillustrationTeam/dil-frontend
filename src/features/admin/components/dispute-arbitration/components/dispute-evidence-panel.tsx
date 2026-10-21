'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  FileText,
  MessageSquare,
  Layers,
  Image as ImageIcon,
  ExternalLink,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { DisputeArbitrationDetailDto } from '@/features/admin/types/dispute-arbitration.types';
import { aiService } from '@/features/ai-assistant/services/ai.service';

export interface DisputeEvidencePanelProps {
  dispute: DisputeArbitrationDetailDto;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DisputeEvidencePanel({ dispute }: DisputeEvidencePanelProps) {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const isClientRaiser = dispute.raisedBy?.role === 'Client';
  const creatorDisplay =
    dispute.creator.fullName !== 'Unknown' && dispute.creator.fullName
      ? dispute.creator.fullName
      : dispute.chatSnapshot.find((m) => m.senderRole === 'Creator')?.senderName ||
        (dispute.raisedBy?.role === 'Creator' ? dispute.raisedBy.fullName : 'Creator');
  const creatorUserDisplay =
    dispute.creator.userName || creatorDisplay.toLowerCase().replace(/\s+/g, '');
  const creatorEmailDisplay =
    dispute.creator.email || (creatorUserDisplay ? `${creatorUserDisplay}@dillustration.vn` : 'N/A');

  const handleFetchAiSummary = async () => {
    setLoadingAi(true);
    setAiError(null);
    try {
      const res = await aiService.disputeSummary(dispute.disputeId);
      if (res?.summary) {
        setAiSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to get dispute summary', err);
      setAiError('Không thể tạo bản tóm tắt tranh chấp lúc này. Vui lòng thử lại sau.');
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#A7ACD9]" />
          <h3 className="font-h1 font-bold text-white text-base">
            Dispute Investigation & Evidence Snapshot
          </h3>
        </div>
        <span className="text-[11px] text-[#8A8FA9] font-mono">
          Case ID: #{dispute.disputeId.substring(0, 8).toUpperCase()}
        </span>
      </div>

      {/* AI Dispute Summarizer (AI-UC56) */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              AI Dispute Arbitration Assistant
            </h4>
          </div>
          <button
            type="button"
            disabled={loadingAi}
            onClick={handleFetchAiSummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/20 text-purple-200 border border-purple-500/30 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
          >
            {loadingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{loadingAi ? 'Đang tóm tắt…' : aiSummary ? 'Tóm tắt lại' : '✨ Tóm tắt tranh chấp bằng AI'}</span>
          </button>
        </div>

        {aiError && (
          <p className="text-xs text-red-300 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{aiError}</p>
        )}

        {aiSummary ? (
          <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line bg-black/40 p-4 rounded-xl border border-white/5 font-body">
            {aiSummary}
          </div>
        ) : !loadingAi ? (
          <p className="text-[11px] text-[#8A8FA9]">
            Bấm nút để AI tự động đọc và phân tích toàn bộ mốc vẽ, trao đổi chat và khiếu nại giữa 2 bên.
          </p>
        ) : null}
      </div>

      {/* 1. Client Claim & Creator Claim Statement Boxes */}
      <div className="space-y-3.5">
        {/* Client Claim */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-[10px]">
                CL
              </div>
              <span className="font-bold text-emerald-400 text-xs">
                Client {isClientRaiser ? 'Claim (Filer)' : 'Response'}:
              </span>
              <span className="text-xs text-white">@{dispute.client.userName}</span>
              {isClientRaiser ? (
                dispute.claimantRefundPercent != null && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 font-bold font-mono">
                    Đề xuất hoàn: {dispute.claimantRefundPercent}%
                  </span>
                )
              ) : (
                dispute.respondentRefundPercent != null && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 font-bold font-mono">
                    Đề xuất phản hồi: {dispute.respondentRefundPercent}%
                  </span>
                )
              )}
            </div>
            <span className="text-[10px] text-emerald-300/80 font-mono">
              {dispute.client.email}
            </span>
          </div>
          <p className="text-xs text-emerald-100/90 leading-relaxed font-body whitespace-pre-wrap">
            {isClientRaiser
              ? dispute.reason
              : dispute.respondentResponse || 'Chưa gửi văn bản phản hồi riêng. Xem trao đổi công việc trong lịch sử chat Workroom bên dưới.'}
          </p>
        </div>

        {/* Creator Claim */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[10px]">
                CR
              </div>
              <span className="font-bold text-amber-300 text-xs">
                Creator {!isClientRaiser ? 'Claim (Filer)' : 'Response'}:
              </span>
              <span className="text-xs text-white">@{creatorUserDisplay}</span>
              {!isClientRaiser ? (
                dispute.claimantRefundPercent != null && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 font-bold font-mono">
                    Đề xuất hoàn khách: {dispute.claimantRefundPercent}%
                  </span>
                )
              ) : (
                dispute.respondentRefundPercent != null && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 font-bold font-mono">
                    Đề xuất hoàn khách: {dispute.respondentRefundPercent}%
                  </span>
                )
              )}
            </div>
            <span className="text-[10px] text-amber-300/80 font-mono">
              {creatorEmailDisplay}
            </span>
          </div>
          <p className="text-xs text-amber-100/90 leading-relaxed font-body whitespace-pre-wrap">
            {!isClientRaiser
              ? dispute.reason
              : dispute.respondentResponse || 'Chưa gửi văn bản phản hồi riêng. Xem trao đổi công việc trong lịch sử chat Workroom bên dưới.'}
          </p>
        </div>
      </div>

      {/* 2. Workroom Chat History Transcript Snapshot */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#A7ACD9]" />
            Workroom Chat History Snapshot
          </label>
          <span className="text-[10px] text-[#8A8FA9]">
            {dispute.chatSnapshot.length} captured messages
          </span>
        </div>

        <div className="p-4 bg-black/40 rounded-2xl border border-white/10 h-48 overflow-y-auto space-y-2.5 scrollbar-thin">
          {dispute.chatSnapshot.length > 0 ? (
            dispute.chatSnapshot.map((msg) => {
              const isClient = msg.senderRole === 'Client';
              const isSystem = msg.senderRole === 'System';

              return (
                <div
                  key={msg.messageId}
                  className={`p-2.5 rounded-xl text-xs space-y-1 ${
                    isSystem
                      ? 'bg-white/5 border border-white/10 text-[#8A8FA9]'
                      : isClient
                      ? 'bg-emerald-500/5 border border-emerald-500/20'
                      : 'bg-amber-500/5 border border-amber-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={`font-bold ${
                        isSystem
                          ? 'text-white/70'
                          : isClient
                          ? 'text-emerald-400'
                          : 'text-amber-300'
                      }`}
                    >
                      @{msg.senderName}{' '}
                      <span className="text-[9px] font-normal text-[#8A8FA9]">
                        ({msg.senderRole})
                      </span>
                    </span>
                    <span className="text-[10px] text-[#8A8FA9] font-mono">
                      {new Date(msg.sentAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-white/90 text-[11px] leading-relaxed font-body">
                    {msg.body}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-[#8A8FA9] italic">
              No chat history snapshot attached to this dispute.
            </div>
          )}
        </div>
      </div>

      {/* 3. Commission Milestones Breakdown */}
      {dispute.milestones.length > 0 && (
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#A7ACD9]" />
            Commission Milestones & Deliverables
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {dispute.milestones.map((ms) => (
              <div
                key={ms.id}
                className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                  ms.status === 'InDispute'
                    ? 'bg-red-500/10 border-red-500/30'
                    : ms.status === 'Approved'
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-black/30 border-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-[11px]">
                    Stage {ms.sequence}
                  </span>
                  <span className="font-mono text-[11px] text-white">
                    {formatCurrency(ms.price)}
                  </span>
                </div>
                <div className="text-[10px] text-[#8A8FA9] line-clamp-1">
                  {ms.title}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      ms.status === 'InDispute'
                        ? 'bg-red-500/20 text-red-300'
                        : ms.status === 'Approved'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-white/10 text-white/70'
                    }`}
                  >
                    {ms.status === 'InDispute' ? 'Disputed Stage' : ms.status}
                  </span>
                  <span className="text-[9px] text-[#8A8FA9]">
                    {ms.revisionCount} revisions
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Evidence Attachments Gallery */}
      {dispute.evidenceUrls.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            Bằng chứng từ Bên khiếu nại (Claimant Evidence)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {dispute.evidenceUrls.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="group relative block aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/40 hover:border-emerald-400/50 transition-all"
              >
                <Image
                  src={url}
                  alt={`Evidence item ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <ExternalLink className="w-4 h-4 text-white" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 5. Respondent Evidence Attachments Gallery */}
      {dispute.respondentEvidenceUrls && dispute.respondentEvidenceUrls.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            Bằng chứng đối ứng từ Bên phản hồi (Respondent Evidence)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {dispute.respondentEvidenceUrls.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="group relative block aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/40 hover:border-cyan-400/50 transition-all"
              >
                <Image
                  src={url}
                  alt={`Respondent evidence item ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <ExternalLink className="w-4 h-4 text-white" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DisputeEvidencePanel;
