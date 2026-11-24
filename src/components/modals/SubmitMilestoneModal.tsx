'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, FileImage, CheckCircle2, ShieldAlert } from 'lucide-react';
import { commissionService } from '@/services/commission.service';
import { extractErrorMessage } from '@/lib/api-client';

interface SubmitMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  commissionId: string;
  milestoneId: string;
  milestoneTitle: string;
  isRevision?: boolean;
  onSuccess?: (action: 'submitted' | 'resubmitted') => void;
}

export default function SubmitMilestoneModal({
  isOpen,
  onClose,
  commissionId,
  milestoneId,
  milestoneTitle,
  isRevision = false,
  onSuccess,


}: SubmitMilestoneModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [creatorNote, setCreatorNote] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError('');
    try {
      await commissionService.submitMilestone(commissionId, milestoneId, file, creatorNote);
      setUploaded(true);
      setTimeout(() => {
        if (onSuccess) onSuccess(isRevision ? 'resubmitted' : 'submitted');
      }, 1500);
    } catch (cause) {
      setError(extractErrorMessage(cause, 'Không thể tải bản phác thảo lên. Vui lòng thử lại.'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#E5D8C2] backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#FFFCF6]/95 border border-[#221E1A]/10 rounded-[32px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#221E1A]/10 flex items-center justify-between bg-[#FFFCF6]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5F3F86]/20 text-[#5F3F86] flex items-center justify-center border border-[#5F3F86]/40">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-space-grotesk font-bold text-[#241F1A]">Submit Milestone / Draft</h3>
              <p className="text-[11px] text-[#746A5F]">{milestoneTitle}</p>
            </div>
          </div>
          {error && <p role="alert" className="text-xs text-[#A8321C]">{error}</p>}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FFFCF6] border border-[#221E1A]/10 text-[#746A5F] hover:text-[#241F1A] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {!uploaded ? (
            <>
              {/* Drag Drop Area */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#221E1A]/20 hover:border-[#3B4C86]/40 bg-[#FFFCF6] rounded-2xl p-6 text-center transition-all cursor-pointer"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/jpeg,image/png"
                />
                {file ? (
                  <div className="text-[#2F6B63]">
                    <FileImage className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs font-semibold">{file.name}</p>
                    <p className="text-[11px] text-[#746A5F] mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto text-[#3B4C86] mb-2 animate-bounce" />
                    <p className="text-xs font-semibold text-[#241F1A]">Drag and drop sketch/demo file here</p>
                    <p className="text-[11px] text-[#746A5F] mt-1">JPEG, PNG. System will automatically apply Watermark.</p>
                  </>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-space-grotesk font-bold text-[#746A5F] uppercase tracking-wider mb-1.5">
                  Creator Note for Client
                </label>
                <textarea
                  rows={3}
                  value={creatorNote}
                  onChange={(e) => setCreatorNote(e.target.value)}
                  placeholder="Explain your approach, ask questions, or detail changes..."
                  className="w-full p-3 bg-[#FFFCF6] border border-[#221E1A]/10 rounded-xl text-xs text-[#241F1A] text-[#746A5F] focus:outline-none focus:ring-2 focus:ring-[#3B4C86]/40"
                />
              </div>

              <div className="p-3 bg-[#2C5A86]/10 border border-[#2C5A86]/30 rounded-xl flex items-center gap-2.5 text-[#2C5A86] text-[11px]">
                <ShieldAlert className="w-4 h-4 shrink-0 text-[#2C5A86]" />
                <span>Watermark will be automatically applied over this image. The original file is kept safe in private storage.</span>
              </div>
            </>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#2F6B63]/20 text-[#2F6B63] flex items-center justify-center border border-[#2F6B63]/40">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#241F1A]">Draft Submitted Successfully!</h4>
              <p className="text-xs text-[#746A5F]">Client has been notified to review your work.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#221E1A]/10 bg-[#FFFCF6]/80 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#221E1A]/10 text-[#746A5F] hover:bg-[#FFFCF6]"
          >
            {uploaded ? 'Close' : 'Cancel'}
          </button>
          {!uploaded && (
            <button
              onClick={handleUpload}
              disabled={isUploading || !file}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#3B4C86] to-[#5F3F86] text-[#241F1A] shadow-lg shadow-[#3B4C86] hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <span>Uploading...</span>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Submit Milestone
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
