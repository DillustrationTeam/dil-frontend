import axios, { type AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import { getErrorMessage } from '@/lib/api-error';
import type { ApiResponse } from '@/types/api.types';
import type { CloudinaryUploadSignature } from '@/features/creator-studio/types/upload.types';

export const uploadService = {
  async getUploadSignature(folder: string, transformation?: string): Promise<CloudinaryUploadSignature> {
    try {
      const response = await apiClient.post<ApiResponse<CloudinaryUploadSignature>>('/uploads/signature', { folder, transformation });
      if (response.data.error || !response.data.data) {
        throw new Error(response.data.error?.details?.join(', ') || response.data.error?.detail || 'Failed to get upload signature.');
      }
      const signature = response.data.data;
      if (!signature.cloudName || signature.cloudName.startsWith('REPLACE_WITH')) {
        throw new Error('Cloudinary chưa được cấu hình trên server.');
      }
      return signature;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to get upload signature.'));
    }
  },

  async uploadFile(file: File, folder: string, transformation?: string): Promise<string> {
    if (folder === 'profile-avatars') {
      const avatarData = new FormData();
      avatarData.append('file', file);
      const response = await apiClient.post<ApiResponse<{ url: string }>>('/uploads/profile-avatar', avatarData);
      if (response.data.error || !response.data.data?.url) {
        throw new Error(response.data.error?.detail || 'Không thể tải ảnh đại diện.');
      }
      return response.data.data.url;
    }
    const signature = await this.getUploadSignature(folder, transformation);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signature.apiKey);
    formData.append('timestamp', String(signature.timestamp));
    formData.append('signature', signature.signature);
    formData.append('folder', signature.folder);
    formData.append('allowed_formats', signature.allowedFormats);
    if (signature.transformation) formData.append('transformation', signature.transformation);

    try {
      const response = await axios.post<{ secure_url: string }>(
        `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
        formData,
      );
      return response.data.secure_url;
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      throw new Error(axiosError.response?.data.error?.message || 'Upload lên Cloudinary thất bại.');
    }
  },
};
