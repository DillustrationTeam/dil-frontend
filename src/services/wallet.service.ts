import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';

type WalletOverview = { wallet: { balance: number; lockedBalance: number; currency: string } };
type PaymentOrder = {
  paymentOrderId: string;
  paymentUrl: string | null;
  paymentOrderStatus: string;
  checkoutAction?: string | null;
  checkoutFields?: { name: string; value: string }[] | null;
};

export const walletService = {
  async getMine() {
    const response = await apiClient.get<ApiResponse<WalletOverview>>('/wallets/me');
    return response.data.data as WalletOverview;
  },
  async topUp(amount: number) {
    const response = await apiClient.post<ApiResponse<PaymentOrder>>('/payments/orders', { amount, gateway: 'SePay' });
    return response.data.data as PaymentOrder;
  },
};
