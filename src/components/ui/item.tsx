'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ItemProps {
  header?: ReactNode;
  body?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function Item({ header, body, actions, onClick, className }: ItemProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'glass-container rounded-[28px] p-5 md:p-6 transition-all',
        onClick && 'cursor-pointer hover:border-[#A7ACD9]/40',
        className
      )}
    >
      {header ? <div className="mb-3">{header}</div> : null}
      {body ? <div className="text-sm text-[#C7C5CF]">{body}</div> : null}
      {actions ? <div className="mt-4 flex justify-end gap-2">{actions}</div> : null}
    </div>
  );
}
