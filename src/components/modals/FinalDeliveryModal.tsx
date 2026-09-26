'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, FileArchive, CheckCircle2, ShieldAlert, AlertCircle, Download } from 'lucide-react';
import { commissionService } from '@/services/commission.service';
import { extractErrorMessage } from '@/lib/api-client';

interface FinalDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  commissionId: string;
  isCreator?: boolean;
  commissionStatus?: string;
  onSuccess?: () => void;
  onOpenReviewModal?: () => void;
}

const MAX_FINAL_FILE_SIZE = 250 * 1024 * 1024; // 250MB
const ALLOWED_EXTENSIONS = ['.zip', '.rar', '.psd', '.ai', '.png', '.jpg', '.jpeg'];

export default function FinalDeliveryModal({
  isOpen,
  onClose,
  commissionId,
  isCreator = true,
  commissionStatus,
  onSuccess,
  onOpenReviewModal,
}: FinalDeliveryModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validateAndSetFile = (selectedFile: File) => {
    setFileError(null);
    setSubmitError(null);

    const ext = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError('Định dạng file không hỗ trợ. Vui lòng chọn file ZIP, RAR, PSD, AI, PNG hoặc JPG.');
      setFile(null);
      return;
    }

    if (selectedFile.size > MAX_FINAL_FILE_SIZE) {
      setFileError(`File quá lớn (${(selectedFile.size / 1024 / 1024).toFixed(1)}MB). Dung lượng tối đa cho phép là 250MB.`);
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
      setFileError('Vui lòng chọn hoặc kéo thả 1 file gốc HD (.ZIP, .PSD).');
      return;
    }

    setIsUploading(true);
    try {
      await commissionService.deliverFinal(commissionId, file);
      setUploaded(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (error: unknown) {
      console.error(error);
      let msg = 'Bàn giao file gốc thất bại.';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosErr = error as { response?: { data?: { error?: { title?: string; detail?: string; details?: string[] }; message?: string } } };
        const errObj = axiosErr.response?.data?.error;
        const details = errObj?.detail || (Array.isArray(errObj?.details) ? errObj.details.join(' · ') : errObj?.details);
        const title = errObj?.title || axiosErr.response?.data?.message;
        if (details) msg = details;
        else if (title) msg = title;
      } else if (error instanceof Error) {
        msg = error.message;
      }
      setSubmitError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClientAction = async () => {
    setSubmitError(null);
    setIsUploading(true);
    try {
      if (commissionStatus !== 'Completed') {
        await commissionService.complete(commissionId);
      }
      const downloadUrl = await commissionService.getFinalDownloadUrl(commissionId);
      if (downloadUrl) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5075/api/v1';
        const origin = baseUrl.replace(/\/api\/v1\/?$/, '');
        const fullUrl = downloadUrl.startsWith('http') || downloadUrl.startsWith('blob:')
          ? downloadUrl
          : `${origin}${downloadUrl.startsWith('/') ? '' : '/'}${downloadUrl}`;
        window.open(fullUrl, '_blank');
      }
      if (onSuccess) onSuccess();
      onClose();
      if (onOpenReviewModal) {
        setTimeout(() => {
          onOpenReviewModal();
        }, 300);
      }
    } catch (error: unknown) {
      console.error(error);
      setSubmitError(extractErrorMessage(error, 'Không thể nghiệm thu hoặc tải file gốc.'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C0D14]/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#1F2335] border border-white/10 shadow-2xl overflow-hidden rounded-3xl">

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#161926]/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#A7ACD9]/20 text-[#A7ACD9] flex items-center justify-center border border-[#A7ACD9]/30">
              {isCreator ? <Upload className="w-5 h-5 text-[#A7ACD9]" /> : <FileArchive className="w-5 h-5 text-emerald-400" />}
            </div>
            <div>
              <h3 className="text-sm font-space-grotesk font-bold text-white">
                {isCreator ? 'Bàn giao File Gốc HD' : 'Nghiệm Thu & Tải File Gốc HD'}
              </h3>
              <p className="text-[11px] text-[#919099]">
                {isCreator ? 'Upload gói sản phẩm gốc hoàn chỉnh (.PSD, .ZIP)' : 'Kiểm tra sản phẩm hoàn chỉnh và tải file chất lượng cao'}
              </p>
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
        {isCreator ? (
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
                        : 'border-white/20 hover:border-[#A7ACD9]/50 bg-[#1b1b1e]'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept=".zip,.rar,.psd,.ai,.png,.jpg,.jpeg"
                    />
                    {file ? (
                      <div className="text-emerald-400">
                        <FileArchive className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-xs font-semibold">{file.name}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mx-auto text-[#A7ACD9] mb-2 animate-bounce" />
                        <p className="text-xs font-semibold text-white">Kéo và thả file gốc HD tại đây</p>
                        <p className="text-[11px] text-[#919099] mt-1">Hỗ trợ ZIP, RAR, PSD, AI, PNG (Tối đa 250MB)</p>
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

                <div className="p-3 bg-[#A7ACD9]/10 border border-[#A7ACD9]/20 rounded-xl flex items-center gap-2.5 text-[#A7ACD9] text-[11px]">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-[#A7ACD9]" />
                  <span>File này sẽ được lưu trữ bảo mật trên AWS S3 Private và chỉ mở link tải khi Client hoàn tất nghiệm thu.</span>
                </div>

                {/* Inline API Error Banner */}
                {submitError && (
                  <div role="alert" className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-red-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <div>
                      <p className="font-bold text-red-200">Không thể bàn giao file gốc</p>
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
                <h4 className="text-sm font-bold text-white">Đã bàn giao File Gốc HD!</h4>
                <p className="text-xs text-slate-400">Khách hàng đã nhận được thông báo để kiểm tra và nghiệm thu đơn hàng.</p>
              </div>
            )}
          </div>
        ) : (
          /* GIAO DIỆN KHÁCH HÀNG (CLIENT) */
          <div className="p-6 space-y-4">
            <div className="p-6 border border-emerald-500/30 bg-emerald-500/10 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <FileArchive className="w-6 h-6 text-emerald-400" />
              </div>
              <h4 className="text-base font-bold text-white">Creator đã bàn giao Gói File Gốc HD!</h4>
              <p className="text-xs text-emerald-200/80 max-w-sm mx-auto leading-relaxed">
                {commissionStatus === 'Completed'
                  ? 'Đơn hàng đã hoàn tất nghiệm thu. Bạn có thể tải lại gói file gốc HD bất kỳ lúc nào.'
                  : 'Hãy bấm nghiệm thu để chuyển đơn sang hoàn thành và nhận đường link tải bảo mật.'}
              </p>
            </div>

            <div className="p-3 bg-[#A7ACD9]/10 border border-[#A7ACD9]/20 rounded-xl flex items-center gap-2.5 text-[#A7ACD9] text-[11px]">
              <ShieldAlert className="w-4 h-4 shrink-0 text-[#A7ACD9]" />
              <span>Link tải file gốc được tạo bảo mật trực tiếp từ AWS S3 Private, có hiệu lực trong 15 phút.</span>
            </div>

            {submitError && (
              <div role="alert" className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <div>
                  <p className="font-bold text-red-200">Xử lý thất bại</p>
                  <p className="mt-0.5 text-[11px] text-red-300/90">{submitError}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#161926]/90 flex justify-end gap-2.5 items-center">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-full text-xs font-semibold border border-white/10 text-slate-300 hover:bg-white/5 transition-all"
          >
            {isCreator ? (uploaded ? 'Đóng' : 'Hủy') : 'Đóng'}
          </button>

          {!isCreator ? (
            <>
              {commissionStatus === 'Completed' && onOpenReviewModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenReviewModal();
                  }}
                  className="px-4 py-2.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all flex items-center gap-1.5"
                >
                  ⭐ Viết đánh giá
                </button>
              )}
              <button
                onClick={handleClientAction}
                disabled={isUploading}
                className="px-5 py-2.5 rounded-full text-xs font-bold bg-emerald-500 text-black shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <span>Đang xử lý...</span>
                ) : commissionStatus === 'Completed' ? (
                  <>
                    <Download className="w-4 h-4" /> Tải File Gốc HD
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Hoàn tất Nghiệm thu & Tải File HD
                  </>
                )}
              </button>
            </>
          ) : (
            !uploaded && (
              <button
                onClick={handleUpload}
                disabled={isUploading || !file}
                className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#A7ACD9] hover:bg-[#b8bde8] text-[#131316] shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <span>Đang tải lên...</span>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Bàn giao File
                  </>
                )}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
