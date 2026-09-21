import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import type {
  WalletOverviewDto,
  WalletTransactionDto,
  WalletTransactionFilters,
  WalletTransactionPage,
} from '../types/wallet.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readError(value: unknown): string | null {
  if (!isRecord(value)) return null;
  for (const field of ['detail', 'message']) {
    if (typeof value[field] === 'string' && value[field].trim()) return value[field];
  }
  if (Array.isArray(value.details)) {
    const details = value.details.filter((item): item is string => typeof item === 'string');
    if (details.length) return details.join(' · ');
  }
  return typeof value.title === 'string' ? value.title : null;
}

export function getWalletErrorMessage(error: unknown): string {
  if (isRecord(error) && isRecord(error.response)) {
    const body: unknown = error.response.data;
    const message = readError(isRecord(body) ? body.error : null) ?? readError(body);
    if (message) return message;
  }
  if (error instanceof Error && error.message !== 'Network Error') return error.message;
  return 'Không kết nối được với máy chủ. Kiểm tra kết nối rồi thử lại.';
}

function payload<T>(response: ApiResponse<T>): T {
  if (response.error) throw new Error(readError(response.error) ?? 'Không tải được dữ liệu ví.');
  if (response.data === null) throw new Error('Máy chủ chưa trả dữ liệu ví. Vui lòng thử lại.');
  return response.data;
}

export const walletService = {
  async getOverview(signal?: AbortSignal): Promise<WalletOverviewDto> {
    const response = await apiClient.get<ApiResponse<WalletOverviewDto>>('/wallets/me', { signal, timeout: 15000 });
    return payload(response.data);
  },

  async getTransactions(
    filters: WalletTransactionFilters,
    cursor: string | undefined,
    signal?: AbortSignal,
  ): Promise<WalletTransactionPage> {
    const response = await apiClient.get<ApiResponse<WalletTransactionDto[]>>('/wallets/me/transactions', {
      params: { ...filters, cursor, limit: 10 },
      signal,
      timeout: 15000,
    });
    const raw = payload(response.data);
    const items = Array.isArray(raw) ? raw : (Array.isArray((raw as any)?.items) ? (raw as any).items : []);
    const meta = response.data.meta;
    return {
      items,
      nextCursor: typeof meta?.nextCursor === 'string' && meta.nextCursor ? meta.nextCursor : null,
      total: typeof meta?.total === 'number' ? meta.total : null,
    };
  },
};
