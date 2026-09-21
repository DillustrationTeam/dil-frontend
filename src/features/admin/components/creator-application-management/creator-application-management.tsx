'use client';

import { useState } from 'react';
import { useCreators } from '@/features/admin/hooks/use-creators';
import { CreatorApplicationDetail } from './creator-application-detail';
import { CreatorApplicationItem } from './creator-application-item';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';

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
        <div className="pt-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            isFirst={isFirst}
            isLast={isLast}
            onPageChange={setPage}
          />
        </div>
      ) : null}

      <Modal open={showDetail} onClose={handleClose} title="Creator Application Detail">
        {state.application.loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-[#A7ACD9]">
            Loading application details...
          </div>
        ) : (
          <CreatorApplicationDetail application={state.application.data} />
        )}
      </Modal>
    </div>
  );
}

export default CreatorApplicationManagement;
