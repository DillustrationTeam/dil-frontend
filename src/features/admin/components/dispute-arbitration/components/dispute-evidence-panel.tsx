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
import { useLanguage } from '@/context/language-context';

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
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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

  return (
    <div className="glass-container bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-[28px] p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-[#221E1A]/10 pb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#B24A26]" />
          <h3 className="font-h1 font-bold text-[#241F1A] text-base">
            Dispute Investigation & Evidence Snapshot
          </h3>
        </div>
        <span className="text-[11px] text-[#6E6459] font-mono">
          Case ID: #{dispute.disputeId.substring(0, 8).toUpperCase()}
        </span>
      </div>

      {/* AI Dispute Summarizer (AI-UC56) */}
      <div className="rounded-2xl border border-brand-periwinkle/25 bg-[#FFFCF6]/80 backdrop-blur-md p-5 space-y-3.5 shadow-lg shadow-black/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-periwinkle/15 border border-brand-periwinkle/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-brand-periwinkle" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#241F1A] uppercase tracking-wider"> Trợ lý phân tích tranh chấp AI (Arbitration Assistant) </h4>
              <p className="text-[11px] text-outline font-body"> Tự động tổng hợp hồ sơ, trích dẫn mốc tiến độ và lịch sử trao đổi giữa hai bên </p>
            </div>
          </div>
          <button
            type="button"
            disabled={loadingAi}
            onClick={handleFetchAiSummary}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
              aiSummary
                ? 'border border-brand-periwinkle/30 bg-brand-periwinkle/10 text-brand-periwinkle hover:bg-brand-periwinkle/20'
                : 'bg-brand-periwinkle text-[#FFFCF6] shadow-md hover:brightness-110'
            }`}
          >
            {loadingAi ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{loadingAi ? 'Đang phân tích hồ sơ…' : aiSummary ? 'Phân tích lại' : 'Tóm tắt tranh chấp bằng AI'}</span>
          </button>
        </div>

        {aiError && (
          <div className="text-xs text-[#A8321C] bg-[#A8321C]/10 p-3 rounded-xl border border-[#A8321C]/30 font-body">
            {aiError}
          </div>
        )}

        {aiSummary ? (
          <div className="rounded-xl border border-[#221E1A]/10 bg-[#E5D8C2] p-4 font-body text-xs leading-relaxed text-[#241F1A] whitespace-pre-line selection:bg-brand-periwinkle/30">
            {aiSummary}
          </div>
        ) : !loadingAi ? (
          <div className="flex items-center gap-2 rounded-xl bg-[#FFFCF6] border border-[#221E1A]/10 p-3 text-xs text-[#6E6459] font-body">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-periwinkle shrink-0" />
            <span>Bấm nút phía trên để AI tiến hành trích xuất bằng chứng khách quan, hỗ trợ kiểm duyệt viên ra phán quyết nhanh chóng.</span>
          </div>
        ) : null}
      </div>

      {/* 1. Client Claim & Creator Claim Statement Boxes */}
      <div className="space-y-3.5">
        {/* Client Claim */}
        <div className="p-4 rounded-2xl bg-[#2F6B63]/10 border border-[#2F6B63]/40 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#2F6B63]/20 text-[#2F6B63] flex items-center justify-center font-bold text-[10px]">
                CL
              </div>
              <span className="font-bold text-[#2F6B63] text-xs">
                {isVie ? `Khiếu nại của Khách (@${dispute.client.userName}):` : `Client Claim (@${dispute.client.userName}):`}
              </span>
              {isClientRaiser && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#2F6B63]/20 text-[#2F6B63] font-bold uppercase">
                  {isVie ? 'Người nộp' : 'Filer'}
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#2F6B63] font-mono">
              {dispute.client.email}
            </span>
          </div>
          <p className="text-xs text-[#2F6B63] leading-relaxed font-body">
            &ldquo;{dispute.reason}&rdquo;
          </p>
        </div>

        {/* Creator Claim */}
        <div className="p-4 rounded-2xl bg-[#8A6A1F]/10 border border-[#8A6A1F]/40 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#8A6A1F]/20 text-[#8A6A1F] flex items-center justify-center font-bold text-[10px]">
                CR
              </div>
              <span className="font-bold text-[#8A6A1F] text-xs">
                {isVie ? `Phản hồi của Họa sĩ (@${creatorUserDisplay}):` : `Creator Claim (@${creatorUserDisplay}):`}
              </span>
              {!isClientRaiser && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#8A6A1F]/20 text-[#8A6A1F] font-bold uppercase">
                  {isVie ? 'Người nộp' : 'Filer'}
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#8A6A1F] font-mono">
              {creatorEmailDisplay}
            </span>
          </div>
          <p className="text-xs text-[#8A6A1F] leading-relaxed font-body">
            {!isClientRaiser
              ? `\u201C${dispute.reason}\u201D`
              : 'Chưa có văn bản khiếu nại riêng từ họa sĩ. Xem trao đổi công việc trong lịch sử trò chuyện phòng làm việc bên dưới.'}
          </p>
        </div>
      </div>

      {/* 2. Workroom Chat History Transcript Snapshot */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#241F1A] flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#B24A26]" />
            {isVie ? 'Bản lưu lịch sử trao đổi phòng làm việc' : 'Workroom Chat History Snapshot'}
          </label>
          <span className="text-[10px] text-[#6E6459]">
            {isVie ? `${dispute.chatSnapshot.length} tin nhắn đã lưu` : `${dispute.chatSnapshot.length} captured messages`}
          </span>
        </div>

        <div className="p-4 bg-[#F0E7D8] rounded-2xl border border-[#221E1A]/10 h-48 overflow-y-auto space-y-2.5 scrollbar-thin">
          {dispute.chatSnapshot.length > 0 ? (
            dispute.chatSnapshot.map((msg) => {
              const isClient = msg.senderRole === 'Client';
              const isSystem = msg.senderRole === 'System';

              return (
                <div
                  key={msg.messageId}
                  className={`p-2.5 rounded-xl text-xs space-y-1 ${
                    isSystem
                      ? 'bg-[#FFFCF6] border border-[#221E1A]/10 text-[#6E6459]'
                      : isClient
                      ? 'bg-[#2F6B63]/5 border border-[#2F6B63]/30'
                      : 'bg-[#8A6A1F]/5 border border-[#8A6A1F]/30'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={`font-bold ${
                        isSystem
                          ? 'text-[#241F1A]/70'
                          : isClient
                          ? 'text-[#2F6B63]'
                          : 'text-[#8A6A1F]'
                      }`}
                    >
                      @{msg.senderName}{' '}
                      <span className="text-[9px] font-normal text-[#6E6459]">
                        ({msg.senderRole})
                      </span>
                    </span>
                    <span className="text-[10px] text-[#6E6459] font-mono">
                      {new Date(msg.sentAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-[#241F1A]/90 text-[11px] leading-relaxed font-body">
                    {msg.body}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-[#6E6459] italic">
              No chat history snapshot attached to this dispute.
            </div>
          )}
        </div>
      </div>

      {/* 3. Commission Milestones Breakdown */}
      {dispute.milestones.length > 0 && (
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-[#241F1A] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#B24A26]" />
            Commission Milestones & Deliverables
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {dispute.milestones.map((ms) => (
              <div
                key={ms.id}
                className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                  ms.status === 'InDispute'
                    ? 'bg-[#A8321C]/10 border-[#A8321C]/40'
                    : ms.status === 'Approved'
                    ? 'bg-[#2F6B63]/5 border-[#2F6B63]/30'
                    : 'bg-[#F0E7D8] border-[#221E1A]/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#241F1A] text-[11px]">
                    Stage {ms.sequence}
                  </span>
                  <span className="font-mono text-[11px] text-[#241F1A]">
                    {formatCurrency(ms.price)}
                  </span>
                </div>
                <div className="text-[10px] text-[#6E6459] line-clamp-1">
                  {ms.title}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      ms.status === 'InDispute'
                        ? 'bg-[#A8321C]/20 text-[#A8321C]'
                        : ms.status === 'Approved'
                        ? 'bg-[#2F6B63]/20 text-[#2F6B63]'
                        : 'bg-[#F0E7D8] text-[#241F1A]/70'
                    }`}
                  >
                    {ms.status === 'InDispute' ? 'Disputed Stage' : ms.status}
                  </span>
                  <span className="text-[9px] text-[#6E6459]">
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
          <label className="text-xs font-bold text-[#241F1A] flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-[#B24A26]" />
            Submitted Evidence Screenshots & Deliverables
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {dispute.evidenceUrls.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="group relative block aspect-video rounded-xl overflow-hidden border border-[#221E1A]/10 bg-[#F0E7D8] hover:border-[#A8321C]/40 transition-all"
              >
                <Image
                  src={url}
                  alt={`Evidence item ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-[#F0E7D8] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <ExternalLink className="w-4 h-4 text-[#241F1A]" />
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
