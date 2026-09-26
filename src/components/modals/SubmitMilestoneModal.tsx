'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, FileImage, CheckCircle2, ShieldAlert, AlertCircle } from 'lucide-react';
import { commissionService } from '@/services/commission.service';

interface SubmitMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  commissionId: string;
  milestoneId: string;
  milestoneTitle: string;
  onSuccess?: () => void;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function SubmitMilestoneModal({
  isOpen,
  onClose,
  commissionId,
  milestoneId,
  milestoneTitle,
  onSuccess,
}: SubmitMilestoneModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [creatorNote, setCreatorNote] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validateAndSetFile = (selectedFile: File) => {
    setFileError(null);
    setSubmitError(null);

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setFileError('Định dạng file không hỗ trợ. Vui lòng chọn ảnh JPG, PNG hoặc WEBP.');
      setFile(null);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFileError(`File quá lớn (${(selectedFile.size / 1024 / 1024).toFixed(1)}MB). Dung lượng tối đa là 25MB.`);
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    setSubmitError(null);
    setFileError(null);

    if (!file) {
      setFileError('Vui lòng chọn hoặc kéo thả 1 hình ảnh phác thảo (WIP).');
      return;
    }

    if (!milestoneId) {
      setSubmitError('Chưa xác định được cột mốc cần nộp. Vui lòng kiểm tra lại tiến độ đơn hàng.');
      return;
    }

    setIsUploading(true);
    try {
      await commissionService.submitMilestone(commissionId, milestoneId, file, creatorNote);
      setUploaded(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (error: unknown) {
      console.error(error);
      let msg = 'Không thể nộp bản phác thảo.';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosErr = error as { response?: { data?: { error?: { title?: string; details?: string[] }; message?: string } } };
        const details = axiosErr.response?.data?.error?.details;
        const title = axiosErr.response?.data?.error?.title || axiosErr.response?.data?.message;
        if (details && details.length > 0) {
          msg = details.join(' · ');
        } else if (title) {
          msg = title;
        }
      } else if (error instanceof Error) {
        msg = error.message;
      }
      setSubmitError(msg);
    } finally {
      setIsUploading(false);
    }
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
              <h3 className="text-sm font-space-grotesk font-bold text-white">Nộp bản vẽ phác thảo (WIP)</h3>
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
              <div>
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                    fileError
                      ? 'border-red-500/60 bg-red-500/10'
                      : file
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-white/20 hover:border-indigo-500/50 bg-white/5'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/jpeg,image/png,image/webp"
                  />
                  {file ? (
                    <div className="text-emerald-400">
                      <FileImage className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-xs font-semibold">{file.name}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto text-indigo-400 mb-2 animate-bounce" />
                      <p className="text-xs font-semibold text-white">Kéo và thả file phác thảo / demo tại đây</p>
                      <p className="text-[11px] text-slate-400 mt-1">Hỗ trợ JPG, PNG, WEBP (Tối đa 25MB). Tự động gắn Watermark.</p>
                    </>
                  )}
                </div>

                {/* Inline error under file input */}
                {fileError && (
                  <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {fileError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-space-grotesk font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Ghi chú cho Khách hàng (Không bắt buộc)
                </label>
                <textarea
                  rows={3}
                  value={creatorNote}
                  onChange={(e) => setCreatorNote(e.target.value)}
                  placeholder="Mô tả chi tiết tiến độ, ý tưởng hoặc lưu ý cho mốc này..."
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-2.5 text-blue-300 text-[11px]">
                <ShieldAlert className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Watermark bảo vệ tác quyền sẽ tự động chèn đè lên ảnh này trước khi Client xem.</span>
              </div>

              {/* Inline API Error Banner */}
              {submitError && (
                <div role="alert" className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <div>
                    <p className="font-bold text-red-200">Không thể nộp bản phác thảo</p>
                    <p className="mt-0.5 text-[11px] text-red-300/90">{submitError}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Nộp bản phác thảo thành công!</h4>
              <p className="text-xs text-slate-400">Khách hàng đã nhận được thông báo để xem và duyệt mốc này.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#161926]/80 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 text-slate-300 hover:bg-white/5"
          >
            {uploaded ? 'Đóng' : 'Hủy'}
          </button>
          {!uploaded && (
            <button
              onClick={handleUpload}
              disabled={isUploading || !file}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <span>Đang nộp...</span>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Nộp phác thảo
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
