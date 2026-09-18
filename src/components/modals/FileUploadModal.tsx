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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#131522]/95 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#161926]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-space-grotesk font-bold text-white">Upload Deliverable File</h3>
              <p className="text-[11px] text-slate-400">{milestoneTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {!uploaded ? (
            <>
              {/* Drag Drop Area */}
              <div className="border-2 border-dashed border-white/20 hover:border-indigo-500/50 bg-white/5 rounded-2xl p-6 text-center transition-all cursor-pointer">
                <Upload className="w-8 h-8 mx-auto text-indigo-400 mb-2 animate-bounce" />
                <p className="text-xs font-semibold text-white">Drag and drop artwork files here</p>
                <p className="text-[11px] text-slate-400 mt-1">PNG, PSD, ZIP up to 250MB</p>
              </div>

              <div>
                <label className="block text-[11px] font-space-grotesk font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Creator Note for Client
                </label>
                <textarea
                  rows={3}
                  value={fileNote}
                  onChange={(e) => setFileNote(e.target.value)}
                  placeholder="Explain what changes were made in this draft..."
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2.5 text-amber-300 text-[11px]">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Submitting this deliverable will notify the client to review & release milestone funds.</span>
              </div>
            </>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">File Uploaded Successfully!</h4>
              <p className="text-xs text-slate-400">Client has been notified to review Stage 2 deliverables.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#161926]/80 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 text-slate-300 hover:bg-white/5"
          >
            {uploaded ? 'Close' : 'Cancel'}
          </button>
          {!uploaded && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:scale-[1.02] transition-all flex items-center gap-2"
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
