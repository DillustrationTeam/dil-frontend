'use client';

import { useState } from 'react';
import { uploadService } from '@/features/creator-studio/services/upload.service';

export function useCloudinaryUpload(folder: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File, transformation?: string): Promise<string | null> => {
    setIsUploading(true);
    setError(null);
    try {
      return await uploadService.uploadFile(file, folder, transformation);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Upload failed.';
      setError(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading, error };
}