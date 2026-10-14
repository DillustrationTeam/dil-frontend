export interface CloudinaryUploadSignature {
  cloudName: string;
  apiKey: string;
  signature: string;
  timestamp: number;
  folder: string;
  allowedFormats: string;
  transformation?: string | null;
}