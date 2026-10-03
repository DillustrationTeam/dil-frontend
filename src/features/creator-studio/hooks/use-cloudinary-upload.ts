'use client';

import { useState } from 'react';
import { uploadService } from '@/features/creator-studio/services/upload.service';

export function useCloudinaryUpload(folder: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setError(null);

    try {
      const url = await uploadService.uploadFile(file, folder);
      return url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload file.';
      setError(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading, error };
}
