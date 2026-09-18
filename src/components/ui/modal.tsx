'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function Modal({ open, onClose, title, children, actions }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close modal overlay"
        className="absolute inset-0 bg-[#131316]/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="glass-container relative z-10 w-full max-w-xl rounded-[32px] p-6 md:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          {title ? (
            <h2 className="font-h1 text-2xl font-bold text-white">{title}</h2>
          ) : (
            <span />
          )}
          <Button variant="ghost" onClick={onClose} className="h-9 w-9 rounded-full p-0 text-lg">
            ×
          </Button>
        </div>
        <div className="font-body text-sm text-[#C7C5CF]">{children}</div>
        {actions ? <div className="mt-6 flex justify-end gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}
