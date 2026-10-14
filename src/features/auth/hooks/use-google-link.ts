'use client';

import toast from 'react-hot-toast';
import { securitySettingsService } from '@/features/profile-settings/services/security-settings.service';

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
}

interface GoogleTokenClient {
  requestAccessToken: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (options: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
          }) => GoogleTokenClient;
        };
      };
    };
  }
}

function loadGoogleIdentity(): Promise<void> {
  if (window.google?.accounts.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.querySelector<HTMLScriptElement>('script[data-google-identity]') ?? document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Không tải được Google Identity Services.'));
    if (!script.isConnected) document.head.appendChild(script);
  });
}

export function useGoogleLink(onLinked: () => void) {
  return () => {
    if (!clientId) {
      toast.error('Google Sign-In chưa được cấu hình.');
      return;
    }
    void loadGoogleIdentity().then(() => {
      const tokenClient = window.google?.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: (response) => {
          if (!response.access_token) {
            toast.error('Không nhận được access token từ Google.');
            return;
          }
          void securitySettingsService.linkGoogleAccount(response.access_token)
            .then(() => { toast.success('Đã liên kết tài khoản Google.'); onLinked(); })
            .catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Không thể liên kết Google.'));
        },
      });
      tokenClient?.requestAccessToken();
    }).catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Không thể tải Google Identity Services.'));
  };
}