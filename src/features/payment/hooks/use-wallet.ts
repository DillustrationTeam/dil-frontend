'use client';

import { useCallback, useEffect, useState } from 'react';
import { getWalletErrorMessage, walletService } from '../services/wallet.service';
import type { WalletTransactionFilters } from '../types/wallet.types';

function useWalletRequest<T>(key: string, enabled: boolean, request: (signal: AbortSignal) => Promise<T>) {
  const [result, setResult] = useState<{ key: string; data: T | null; error: string | null } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    request(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ key, data, error: null });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setResult({ key, data: null, error: getWalletErrorMessage(error) });
      },
    );
    return () => controller.abort();
  }, [enabled, key, request]);

  const current = enabled && result?.key === key ? result : null;
  return { data: current?.data ?? null, error: current?.error ?? null, loading: enabled && !current };
}

export function useWallet(userId: string | null) {
  const [filters, setFilters] = useState<WalletTransactionFilters>({});
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const cursor = cursors[cursors.length - 1];
  const overviewKey = JSON.stringify([userId, refreshVersion]);
  const transactionKey = JSON.stringify([userId, filters, cursor, refreshVersion]);
  const requestTransactions = useCallback(
    (signal: AbortSignal) => walletService.getTransactions(filters, cursor, signal),
    [filters, cursor],
  );
  const overview = useWalletRequest(overviewKey, Boolean(userId), walletService.getOverview);
  const transactions = useWalletRequest(transactionKey, Boolean(userId), requestTransactions);

  function applyFilters(next: WalletTransactionFilters) {
    setFilters(next);
    setCursors([undefined]);
    setRefreshVersion((value) => value + 1);
  }

  function refresh() {
    setCursors([undefined]);
    setRefreshVersion((value) => value + 1);
  }

  function next() {
    const nextCursor = transactions.data?.nextCursor;
    if (nextCursor && !transactions.loading) {
      setCursors((current) => [...current, nextCursor]);
    }
  }

  function previous() {
    setCursors((current) => current.length > 1 ? current.slice(0, -1) : current);
  }

  return { overview, transactions, filters, applyFilters, refresh, next, previous, hasPrevious: cursors.length > 1 };
}
