import axios, { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import { getApiErrorMessage } from '@/lib/api-error';
import { CloudinaryUploadSignature } from '@/features/creator-studio/types/upload.types';

export const uploadService = {
  async getUploadSignature(folder: string, transformation?: string): Promise<CloudinaryUploadSignature> {
    let signature: CloudinaryUploadSignature;
    try {
      const response = await apiClient.post<ApiResponse<CloudinaryUploadSignature>>('/uploads/signature', {
        folder,
        transformation,
      });
      if (response.data.error || !response.data.data) {
        throw new Error(response.data.error?.detail || 'Failed to get upload signature.');
      }
      signature = response.data.data;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Failed to get upload signature.'));
    }
    // Backend chưa cấu hình Cloudinary thật (appsettings vẫn để placeholder) — báo lỗi rõ ràng
    // ngay tại đây thay vì để request lên Cloudinary thất bại với lỗi khó hiểu.
    if (!signature.cloudName || signature.cloudName.startsWith('REPLACE_WITH')) {
      throw new Error(
        'Cloudinary chưa được cấu hình trên server (CloudName/ApiKey/ApiSecret vẫn là placeholder trong appsettings.Development.json). Liên hệ backend để cập nhật thông tin Cloudinary thật.'
      );
    }

    return signature;
  },

  async uploadToCloudinary(file: File, signature: CloudinaryUploadSignature): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signature.apiKey);
    formData.append('timestamp', String(signature.timestamp));
    formData.append('signature', signature.signature);
    formData.append('folder', signature.folder);
    formData.append('allowed_formats', signature.allowedFormats);
    if (signature.transformation) {
      formData.append('transformation', signature.transformation);
    }

    try {
      // Gọi thẳng Cloudinary (domain khác, không qua apiClient — không cần JWT).
      const response = await axios.post<{ secure_url: string }>(
        `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
        formData
      );

      return response.data.secure_url;
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: { message?: string } }>;
      const cloudinaryMessage = axiosError.response?.data?.error?.message;
      throw new Error(cloudinaryMessage ? `Cloudinary: ${cloudinaryMessage}` : 'Upload lên Cloudinary thất bại.');
    }
  },

  async uploadFile(file: File, folder: string, transformation?: string): Promise<string> {
    if (folder === 'profile-avatars') {
      const avatarData = new FormData();
      avatarData.append('file', file);
      const response = await apiClient.post<ApiResponse<{ url: string }>>('/uploads/profile-avatar', avatarData);
      if (response.data.error || !response.data.data?.url) throw new Error(response.data.error?.detail || 'Không thể tải ảnh đại diện.');
      return response.data.data.url;
    }
    const signature = await this.getUploadSignature(folder, transformation);
    return this.uploadToCloudinary(file, signature);
  },
};
