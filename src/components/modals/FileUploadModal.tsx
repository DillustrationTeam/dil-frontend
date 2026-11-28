'use client';

import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestoneTitle?: string;
  onUploadComplete?: () => void;
}

export default function FileUploadModal({
  isOpen,
  onClose,
  milestoneTitle = 'Stage 2: Lineart & Color Base',
  onUploadComplete,
}: FileUploadModalProps) {
  const [fileNote, setFileNote] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  if (!isOpen) return null;

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploaded(true);
      if (onUploadComplete) onUploadComplete();
    }, 1200);
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
              <h3 className="text-sm font-space-grotesk font-bold text-[#241F1A]">Upload Deliverable File</h3>
              <p className="text-[11px] text-[#746A5F]">{milestoneTitle}</p>
            </div>
          </div>
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
              <div className="border-2 border-dashed border-[#221E1A]/20 hover:border-[#3B4C86]/40 bg-[#FFFCF6] rounded-2xl p-6 text-center transition-all cursor-pointer">
                <Upload className="w-8 h-8 mx-auto text-[#3B4C86] mb-2 animate-bounce" />
                <p className="text-xs font-semibold text-[#241F1A]">Drag and drop artwork files here</p>
                <p className="text-[11px] text-[#746A5F] mt-1">PNG, PSD, ZIP up to 250MB</p>
              </div>

              <div>
                <label className="block text-[11px] font-space-grotesk font-bold text-[#746A5F] uppercase tracking-wider mb-1.5">
                  Creator Note for Client
                </label>
                <textarea
                  rows={3}
                  value={fileNote}
                  onChange={(e) => setFileNote(e.target.value)}
                  placeholder="Explain what changes were made in this draft..."
                  className="w-full p-3 bg-[#FFFCF6] border border-[#221E1A]/10 rounded-xl text-xs text-[#241F1A] text-[#746A5F] focus:outline-none focus:ring-2 focus:ring-[#3B4C86]/40"
                />
              </div>

              <div className="p-3 bg-[#8A6A1F]/10 border border-[#8A6A1F]/30 rounded-xl flex items-center gap-2.5 text-[#8A6A1F] text-[11px]">
                <ShieldAlert className="w-4 h-4 shrink-0 text-[#8A6A1F]" />
                <span>Submitting this deliverable will notify the client to review & release milestone funds.</span>
              </div>
            </>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#2F6B63]/20 text-[#2F6B63] flex items-center justify-center border border-[#2F6B63]/40">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#241F1A]">File Uploaded Successfully!</h4>
              <p className="text-xs text-[#746A5F]">Client has been notified to review Stage 2 deliverables.</p>
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
              disabled={isUploading}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#3B4C86] to-[#5F3F86] text-[#241F1A] shadow-lg shadow-[#3B4C86] hover:scale-[1.02] transition-all flex items-center gap-2"
            >
              {isUploading ? (
                <span>Uploading...</span>
              ) : (
                <>
                  <FileText className="w-4 h-4" /> Submit Deliverable
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
