'use client';

import { ForensicWatermarkChecker } from '@/features/forensic/components/forensic-watermark-checker';

export default function AdminForensicPage() {
  return (
    <div className="min-h-screen px-2 sm:px-4">
      <ForensicWatermarkChecker mode="admin" />
    </div>
  );
}
