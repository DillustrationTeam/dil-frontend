'use client';

import Link from 'next/link';
import { ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, CircleAlert, Clock3, Landmark, LockKeyhole, ReceiptText, RefreshCw, ShieldCheck, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useWallet } from '../hooks/use-wallet';
import { walletTransactionLabels, type WalletTransactionDto, type WalletTransactionType } from '../types/wallet.types';
import { AccountPageFooter, AccountPageHeading, AccountShell } from './account-shell';
import { WalletFilters } from './wallet-filters';

const focusClass = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-periwinkle';
const dateFormat = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency, maximumFractionDigits: currency === 'VND' ? 0 : 2 }).format(value);
}

function Metric({ title, value, description, icon: Icon, primary, loading }: {
  title: string; value: string | null; description: string; icon: LucideIcon; primary?: boolean; loading: boolean;
}) {
  return (
    <article className={`glass-container relative overflow-hidden rounded-3xl p-6 ${primary ? 'border border-brand-periwinkle/35' : 'border border-white/5'}`}>
      <div className="mb-7 flex items-center justify-between gap-3">
        <h2 className="font-body text-sm text-on-surface-variant">{title}</h2>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${primary ? 'bg-brand-periwinkle text-brand-navy' : 'bg-white/5 text-brand-periwinkle'}`}><Icon size={19} aria-hidden="true" /></span>
      </div>
      {loading ? <div className="mb-4 h-10 w-3/4 rounded-lg bg-white/10 motion-safe:animate-pulse" aria-label="Đang tải số liệu" /> : <p className={`mb-3 break-words font-h1 text-[clamp(1.5rem,2.5vw,2.4rem)] font-semibold tracking-tight tabular-nums ${primary ? 'text-brand-periwinkle' : 'text-on-surface'}`}>{value ?? '—'}</p>}
      <p className="text-xs leading-5 text-outline">{description}</p>
      {primary && <div aria-hidden="true" className="absolute bottom-0 left-6 right-6 h-px bg-brand-periwinkle/60" />}
    </article>
  );
}

function ErrorNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-periwinkle/30 bg-brand-periwinkle/10 p-4 text-sm">
    <CircleAlert className="shrink-0 text-brand-periwinkle" size={19} aria-hidden="true" />
    <p className="min-w-0 flex-1 break-words">{message}</p>
    <button type="button" onClick={onRetry} className={`rounded-lg px-3 py-2 font-semibold text-brand-periwinkle hover:bg-white/5 ${focusClass}`}>Thử lại</button>
  </div>;
}

function TransactionRow({ transaction, currency }: { transaction: WalletTransactionDto; currency: string }) {
  const incoming = transaction.direction === 'In';
  const DirectionIcon = incoming ? ArrowDownLeft : ArrowUpRight;
  const refLabels: Record<string, string> = { Auction: 'Đấu giá', Commission: 'Đơn đặt vẽ', PaymentOrder: 'Đơn nạp tiền', Deposit: 'Nạp tiền', PayoutRequest: 'Yêu cầu rút tiền', Payout: 'Rút tiền' };
  return <tr className="border-t border-white/5 text-sm hover:bg-white/[0.025]">
    <th scope="row" className="px-5 py-5 text-left font-normal md:pl-7">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-brand-periwinkle"><DirectionIcon size={18} aria-hidden="true" /></span>
        <div>
          <p className="font-medium">{walletTransactionLabels[transaction.walletTxType as WalletTransactionType] ?? transaction.walletTxType}</p>
          <span className="mt-1 block font-mono text-[11px] text-outline" title={transaction.walletTransactionId}>#{transaction.walletTransactionId.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>
    </th>
    <td className="px-4 py-5 text-on-surface-variant"><time dateTime={transaction.createdAt}>{dateFormat.format(new Date(transaction.createdAt))}</time></td>
    <td className="max-w-64 px-4 py-5"><p className="break-words text-on-surface-variant">{transaction.note || (transaction.refType ? refLabels[transaction.refType] ?? transaction.refType : '—')}</p>{transaction.refId && <p title={transaction.refId} className="mt-1 font-mono text-[11px] text-outline">#{transaction.refId.slice(0, 8).toUpperCase()}</p>}</td>
    <td className="px-4 py-5"><span className="whitespace-nowrap rounded-full border border-white/10 px-2.5 py-1 text-xs text-on-surface-variant">{incoming ? 'Tiền vào' : 'Tiền ra'}</span></td>
    <td className={`whitespace-nowrap px-4 py-5 text-right font-semibold tabular-nums ${incoming ? 'text-brand-periwinkle' : 'text-on-surface'}`}>{incoming ? '+' : '−'}{formatMoney(transaction.amount, currency)}</td>
    <td className="whitespace-nowrap px-5 py-5 text-right tabular-nums text-on-surface-variant md:pr-7">{formatMoney(transaction.balanceAfter, currency)}</td>
  </tr>;
}

export function WalletScreen({ userId, fullName, ready }: { userId: string | null; fullName: string | null; ready: boolean }) {
  const { overview, transactions, filters, applyFilters, refresh, next, previous, hasPrevious } = useWallet(userId);
  const authenticated = Boolean(userId);
  const busy = !ready || overview.loading || transactions.loading;
  const currency = overview.data?.wallet.currency ?? 'VND';
  const hasFilters = Object.values(filters).some(Boolean);
  const status = overview.data?.wallet.walletStatus;
  const statusLabels: Record<string, string> = { Active: 'Đang hoạt động', Frozen: 'Đang tạm khóa', Suspended: 'Đang tạm khóa', Closed: 'Đã đóng', Locked: 'Đang khóa' };

  return (
    <AccountShell active="wallet">
      <AccountPageHeading
        breadcrumb="Ví của tôi"
        title="Ví của tôi"
        description="Mọi chuyển động của dòng tiền, trong một nơi."
        actions={
          authenticated ? (
            <button
              type="button"
              disabled={busy}
              onClick={refresh}
              className={`flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm hover:border-brand-periwinkle/50 hover:bg-white/5 disabled:opacity-50 ${focusClass}`}
            >
              <RefreshCw size={15} className={busy ? 'motion-safe:animate-spin' : ''} aria-hidden />
              Làm mới
            </button>
          ) : undefined
        }
      />

      {ready && !authenticated ? <section className="glass-container rounded-3xl px-6 py-16 text-center">
        <span className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-brand-periwinkle/10 text-brand-periwinkle"><LockKeyhole size={28} aria-hidden="true" /></span>
        <h2 className="font-h1 text-xl font-semibold">Đăng nhập để xem ví của bạn</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-on-surface-variant">Số dư và lịch sử giao dịch chỉ hiển thị cho chủ tài khoản.</p>
        <Link href="/login" className={`mt-7 inline-flex items-center gap-2 rounded-full bg-brand-periwinkle px-6 py-3 text-sm font-semibold text-brand-navy ${focusClass}`}>Đăng nhập<ArrowRight size={16} aria-hidden="true" /></Link>
      </section> : <>
            {overview.error && <div className="mb-5"><ErrorNotice message={overview.error} onRetry={refresh} /></div>}
            <section aria-label="Tổng quan ví" aria-busy={!ready || overview.loading} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Metric title="Số dư khả dụng" value={overview.data ? formatMoney(overview.data.wallet.balance, currency) : null} description="Sẵn sàng cho giao dịch của bạn" icon={Wallet} primary loading={!ready || overview.loading} />
              <Metric title="Tiền đang tạm giữ" value={overview.data ? formatMoney(overview.data.summary.escrowHeldAmount, currency) : null} description="Đang giữ cho các giao dịch" icon={LockKeyhole} loading={!ready || overview.loading} />
              <Metric title="Đang chờ rút" value={overview.data ? formatMoney(overview.data.summary.pendingPayoutAmount, currency) : null} description="Đã gửi yêu cầu, chờ Admin xử lý" icon={Clock3} loading={!ready || overview.loading} />
              <Metric title="Tổng tiền đã rút" value={overview.data ? formatMoney(overview.data.summary.totalWithdrawn, currency) : null} description="Các yêu cầu rút đã được xử lý" icon={Landmark} loading={!ready || overview.loading} />
            </section>
            <div className="mb-8 mt-4 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-outline">
              <span className="flex items-center gap-2"><ShieldCheck size={14} aria-hidden="true" />{status ? `Trạng thái ví: ${statusLabels[status] ?? status}` : 'Tổng quan số dư của tài khoản'}</span>
              <span>Đơn vị tiền tệ: {overview.data ? currency : '—'}</span>
            </div>

            <section id="wallet-history" aria-labelledby="wallet-history-title" className="glass-container scroll-mt-6 overflow-hidden rounded-3xl">
              <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-6 md:px-7">
                <div><h2 id="wallet-history-title" className="font-h1 text-lg font-semibold">Lịch sử giao dịch</h2><p className="mt-1.5 text-xs text-outline">Tra cứu và đối chiếu biến động số dư.</p></div>
                <span className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-xs text-on-surface-variant"><Clock3 size={14} aria-hidden="true" />Mới nhất trước</span>
              </div>
              <WalletFilters disabled={!ready || !authenticated || transactions.loading} onApply={applyFilters} />
              <div aria-busy={!ready || transactions.loading}>
                {!ready || transactions.loading ? <div role="status" className="space-y-5 px-7 py-8"><span className="sr-only">Đang tải lịch sử giao dịch</span>{[0, 1, 2].map((index) => <div key={index} className="flex gap-4"><div className="size-10 rounded-xl bg-white/5 motion-safe:animate-pulse" /><div className="h-10 flex-1 rounded-xl bg-white/5 motion-safe:animate-pulse" /></div>)}</div> : transactions.error ? <div className="p-5 md:p-7"><ErrorNotice message={transactions.error} onRetry={refresh} /></div> : transactions.data?.items.length === 0 ? <div role="status" className="px-6 py-14 text-center">
                  <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-brand-periwinkle"><ReceiptText size={25} aria-hidden="true" /></span>
                  <h3 className="font-h1 text-base font-semibold">{hasFilters ? 'Không tìm thấy giao dịch phù hợp' : 'Ví của bạn chưa có giao dịch'}</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-outline">{hasFilters ? 'Thử đổi khoảng thời gian hoặc xóa bộ lọc để xem thêm.' : 'Các khoản tiền vào và tiền ra sẽ xuất hiện tại đây khi bạn bắt đầu giao dịch.'}</p>
                </div> : transactions.data ? <div className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-brand-periwinkle" tabIndex={0} role="region" aria-label="Bảng giao dịch, có thể cuộn ngang">
                  <table className="w-full min-w-[880px] border-collapse"><caption className="sr-only">Lịch sử giao dịch ví theo giờ Việt Nam</caption>
                    <thead className="bg-white/[0.025] text-left text-[11px] font-medium text-outline"><tr><th scope="col" className="px-5 py-4 font-medium md:pl-7">Giao dịch</th><th scope="col" className="px-4 py-4 font-medium">Thời gian</th><th scope="col" className="px-4 py-4 font-medium">Nội dung</th><th scope="col" className="px-4 py-4 font-medium">Chiều</th><th scope="col" className="px-4 py-4 text-right font-medium">Số tiền</th><th scope="col" className="px-5 py-4 text-right font-medium md:pr-7">Số dư sau giao dịch</th></tr></thead>
                    <tbody>{transactions.data.items.map((transaction) => <TransactionRow key={transaction.walletTransactionId} transaction={transaction} currency={currency} />)}</tbody>
                  </table>
                </div> : null}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-5 py-5 md:px-7">
                <p aria-live="polite" className="text-xs text-outline">{transactions.data ? `${transactions.data.items.length} giao dịch đang hiển thị${transactions.data.total !== null ? ` · ${transactions.data.total} giao dịch${hasFilters ? ' phù hợp' : ''}` : ''}` : transactions.error ? 'Chưa tải được lịch sử' : 'Đang tải giao dịch…'}</p>
                <nav aria-label="Phân trang giao dịch" className="flex gap-2">
                  <button type="button" disabled={!hasPrevious || busy} onClick={previous} className={`flex h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30 ${focusClass}`}><ArrowLeft size={14} aria-hidden="true" />Mới hơn</button>
                  <button type="button" disabled={!transactions.data?.nextCursor || busy} onClick={next} className={`flex h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30 ${focusClass}`}>Cũ hơn<ArrowRight size={14} aria-hidden="true" /></button>
                </nav>
              </div>
            </section>
          </>}
      <AccountPageFooter right="Ví & lịch sử giao dịch" />
    </AccountShell>
  );
}
