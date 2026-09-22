'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCreators } from '@/features/admin/hooks/use-creators';
import { CreatorApplicationDetail } from './creator-application-detail';
import { CreatorApplicationItem } from './creator-application-item';

export function CreatorApplicationManagement() {
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
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {state.applications.error}
        </div>
      ) : null}

      {state.applications.loading && applications.length === 0 ? (
        <div className="glass-container flex h-48 items-center justify-center rounded-[28px] text-sm text-[#A7ACD9]">
          Loading creator applications...
        </div>
      ) : applications.length === 0 ? (
        <div className="glass-container flex h-48 flex-col items-center justify-center rounded-[28px] text-center p-6">
          <p className="font-h1 text-lg font-medium text-white">No applications found</p>
          <p className="mt-1 text-xs text-[#919099]">There are currently no creator applications to review.</p>
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
            className="p-1.5 rounded-lg border border-white/10 bg-black/40 text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 text-xs font-semibold text-white">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage(page + 1)}
            disabled={isLast}
            className="p-1.5 rounded-lg border border-white/10 bg-black/40 text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : null}

      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#161926] border border-white/15 rounded-[28px] max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-5 right-5 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[#8A8FA9] hover:text-white transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="font-h1 text-xl font-bold text-white">Creator Application Detail</h2>
            {state.application.loading ? (
              <div className="flex h-48 items-center justify-center text-sm text-[#A7ACD9]">
                Loading application details...
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
