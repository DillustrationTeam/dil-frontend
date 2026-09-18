'use client';

import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  isFirst,
  isLast,
  onPageChange,
}: PaginationProps) {
  const getPageNumbers = (): Array<number | '...'> => {
    const currentPage = page + 1;

    if (totalPages <= 5) {
      return Array.from({ length: Math.max(totalPages, 1) }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, '...', totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const handlePageChange = (pageNumber: number | '...') => {
    if (pageNumber === '...') return;
    onPageChange(pageNumber - 1);
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button variant="ghost" onClick={() => onPageChange(page - 1)} disabled={isFirst}>
        ‹
      </Button>

      {getPageNumbers().map((pageNumber, index) =>
        pageNumber === '...' ? (
          <span key={`ellipsis-${index}`} className="px-2 text-[#919099]">
            ...
          </span>
        ) : (
          <Button
            key={pageNumber}
            variant={pageNumber === page + 1 ? 'secondary' : 'ghost'}
            onClick={() => handlePageChange(pageNumber)}
          >
            {pageNumber}
          </Button>
        )
      )}

      <Button variant="ghost" onClick={() => onPageChange(page + 1)} disabled={isLast}>
        ›
      </Button>
    </div>
  );
}
