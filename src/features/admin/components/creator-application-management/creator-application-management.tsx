'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useCreators } from '@/features/admin/hooks/use-creators';
import { CreatorApplicationDetail } from './creator-application-detail';
import { CreatorApplicationItem } from './creator-application-item';

export function CreatorApplicationManagement() {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
  const { state, setPage, getCreatorApplicationById } = useCreators();
  const [showDetail, setShowDetail] = useState(false);

  const handleViewCreatorApplication = async (id: string) => {
    const success = await getCreatorApplicationById(id);
    if (success) {
      setShowDetail(true);
    }
  };

  const handleClose = () => {
    setShowDetail(false);
  };

  const applications = state.applications.data.content;
  const { page, totalPages, isFirst, isLast } = state.applications.data;

  return (
    <div className="space-y-6">
      {state.applications.error ? (
        <div className="rounded-2xl border border-[#A8321C]/40 bg-[#A8321C]/10 p-4 text-sm text-[#A8321C]">
          {state.applications.error}
        </div>
      ) : null}

      {state.applications.loading && applications.length === 0 ? (
        <div className="glass-container flex h-48 items-center justify-center rounded-[28px] text-sm text-[#B24A26]">
          {isVie ? 'Đang tải đơn đăng ký họa sĩ...' : 'Loading creator applications...'}
        </div>
      ) : applications.length === 0 ? (
        <div className="glass-container flex h-48 flex-col items-center justify-center rounded-[28px] text-center p-6">
          <p className="font-h1 text-lg font-medium text-[#241F1A]">{isVie ? 'Không tìm thấy đơn đăng ký' : 'No applications found'}</p>
          <p className="mt-1 text-xs text-[#746A5F]">{isVie ? 'Hiện tại không có đơn đăng ký họa sĩ nào cần duyệt.' : 'There are currently no creator applications to review.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((application) => (
            <CreatorApplicationItem
              key={application.id}
              application={application}
              onClick={() => handleViewCreatorApplication(application.id)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="pt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage(page - 1)}
            disabled={isFirst}
            className="p-1.5 rounded-lg border border-[#221E1A]/10 bg-[#F0E7D8] text-[#241F1A] hover:bg-[#F0E7D8] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title={isVie ? 'Trang trước' : 'Previous page'}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 text-xs font-semibold text-[#241F1A]">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage(page + 1)}
            disabled={isLast}
            className="p-1.5 rounded-lg border border-[#221E1A]/10 bg-[#F0E7D8] text-[#241F1A] hover:bg-[#F0E7D8] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title={isVie ? 'Trang sau' : 'Next page'}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : null}

      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F0E7D8]/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#FFFCF6] border border-[#221E1A]/10 rounded-[28px] max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-5 right-5 p-1.5 rounded-full bg-[#FFFCF6] hover:bg-[#F0E7D8] text-[#6E6459] hover:text-[#241F1A] transition-colors cursor-pointer"
              title={isVie ? 'Đóng cửa sổ' : 'Close modal'}
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="font-h1 text-xl font-bold text-[#241F1A]">
              {isVie ? 'Chi tiết đơn đăng ký họa sĩ' : 'Creator Application Detail'}
            </h2>
            {state.application.loading ? (
              <div className="flex h-48 items-center justify-center text-sm text-[#B24A26]">
                {isVie ? 'Đang tải chi tiết đơn đăng ký...' : 'Loading application details...'}
              </div>
            ) : (
              <CreatorApplicationDetail application={state.application.data} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CreatorApplicationManagement;
