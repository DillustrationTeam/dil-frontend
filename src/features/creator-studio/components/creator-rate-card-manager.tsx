'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, Layers } from 'lucide-react';
import { CreatorAddonManager } from './creator-addon-manager';
import { creatorProfileService } from '@/features/creator-studio/services/creator-profile.service';
import { creatorRateCardService, RateCardPackage } from '@/features/creator-studio/services/creator-rate-card.service';

const money = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const fieldClass =
  'w-full rounded-2xl border border-white/10 bg-[#171a2a] px-4 py-3 text-sm text-white outline-none focus:border-[#A7ACD9]';
const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-[#A7ACD9] mb-1.5';

export function CreatorRateCardManager() {
  const [packages, setPackages] = useState<RateCardPackage[]>([]);
  const [slots, setSlots] = useState<number>(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const profile = await creatorProfileService.getMyProfile();
        setHasProfile(true);
        setSlots(profile.availableSlots ?? 3);
        const cardPackages = await creatorRateCardService.get(profile.id);
        setPackages(cardPackages);
      } catch (cause) {
        if (axios.isAxiosError(cause) && cause.response?.status === 400) {
          setError('Tài khoản này chưa có hồ sơ Creator. Hãy tạo hồ sơ trước khi lưu bảng giá.');
        }
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const updateSlots = async (nextSlots: number) => {
    try {
      await creatorProfileService.updateMyProfile({ availableSlots: nextSlots });
      setSlots(nextSlots);
      toast.success('Đã cập nhật số slot nhận đơn.');
    } catch {
      toast.error('Không thể cập nhật số slot.');
    }
  };

  const updatePackage = (id: string, patch: Partial<RateCardPackage>) => {
    setPackages((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const updateMilestone = (
    id: string,
    index: number,
    patch: Partial<RateCardPackage['milestones'][number]>
  ) => {
    setPackages((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              milestones: item.milestones.map((stage, i) =>
                i === index ? { ...stage, ...patch } : stage
              ),
            }
          : item
      )
    );
  };

  const addPackage = () => {
    setPackages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: 'Gói mới',
        description: 'Mô tả phạm vi và quyền sử dụng...',
        price: 300000,
        milestones: [
          { sequence: 1, title: 'Phác thảo', price: 100000 },
          { sequence: 2, title: 'Hoàn thiện', price: 200000 },
        ],
      },
    ]);
  };

  const removePackage = (id: string) => {
    setPackages((current) => current.filter((item) => item.id !== id));
  };

  const addMilestone = (id: string) => {
    setPackages((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              milestones: [
                ...item.milestones,
                { sequence: item.milestones.length + 1, title: 'Cột mốc mới', price: 100000 },
              ],
            }
          : item
      )
    );
  };

  const removeMilestone = (id: string, index: number) => {
    setPackages((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              milestones: item.milestones
                .filter((_, i) => i !== index)
                .map((stage, i) => ({ ...stage, sequence: i + 1 })),
            }
          : item
      )
    );
  };

  const save = async () => {
    setError('');
    setMessage('');
    const normalized = packages.map((item) => ({
      ...item,
      name: item.name.trim(),
      description: item.description?.trim(),
      milestones: item.milestones.map((stage) => ({ ...stage, title: stage.title.trim() })),
    }));

    if (
      normalized.length > 10 ||
      normalized.some(
        (item) =>
          !item.name ||
          item.name.length > 100 ||
          (item.description?.length ?? 0) > 2000 ||
          item.milestones.length < 1 ||
          item.milestones.length > 10 ||
          item.milestones.some(
            (stage) =>
              !stage.title ||
              stage.title.length > 200 ||
              !Number.isSafeInteger(stage.price) ||
              stage.price <= 0 ||
              stage.price > 1_000_000_000_000
          )
      )
    ) {
      setError(
        'Mỗi gói cần tên và 1–10 cột mốc có tên, giá nguyên dương (tối đa 1.000 tỷ VND). Tối đa 10 gói.'
      );
      toast.error('Vui lòng kiểm tra lại thông tin các gói giá.');
      return;
    }

    setSaving(true);
    try {
      const saved = await creatorRateCardService.save(
        normalized.map((item) => ({
          ...item,
          price: item.milestones.reduce((sum, stage) => sum + stage.price, 0),
        }))
      );
      setPackages(saved);
      setMessage('Đã lưu bảng giá thành công.');
      toast.success('Đã lưu bảng giá & dịch vụ thành công!');
    } catch (cause) {
      const details = axios.isAxiosError(cause)
        ? cause.response?.data?.error?.details
        : undefined;
      const errMsg =
        Array.isArray(details) && details.length > 0
          ? details.join(' ')
          : 'Không lưu được bảng giá. Vui lòng thử lại.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-[#C7C5CF]">Đang tải bảng giá dịch vụ...</div>;
  }

  return (
    <div className="w-full space-y-6 text-[#E4E1E5]">
      
      {/* Top Header & Slot Manager Bar */}
      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="glass-container rounded-3xl p-6">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#A7ACD9]">Creator studio</p>
          <h1 className="mt-2 font-h1 text-2xl font-bold text-white sm:text-3xl">Bảng giá & Dịch vụ</h1>
          <p className="mt-2 text-sm text-[#C7C5CF]">
            Thiết lập gói commission, chia nhỏ thanh toán theo cột mốc và cài đặt số slot nhận đơn khả dụng.
          </p>
        </div>

        <div className="glass-container flex flex-col justify-between rounded-3xl p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#A7ACD9]">Slot Manager</p>
            <h2 className="mt-1 font-h1 text-lg font-bold text-white">Số slot đang nhận đơn</h2>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-[#171a2a] p-2.5">
            <button
              type="button"
              onClick={() => updateSlots(Math.max(1, slots - 1))}
              className="rounded-xl bg-white/5 px-3 py-1.5 font-bold text-white hover:bg-white/10"
            >
              −
            </button>
            <span className="text-lg font-bold text-white">{slots} slots</span>
            <button
              type="button"
              onClick={() => updateSlots(slots + 1)}
              className="rounded-xl bg-white/5 px-3 py-1.5 font-bold text-white hover:bg-white/10"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {!hasProfile && (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-xs text-yellow-200">
          Tài khoản này chưa tạo hồ sơ Creator Profile. Hãy{' '}
          <Link href="/creator-setup" className="font-bold underline text-white">
            tạo hồ sơ Creator
          </Link>{' '}
          trước khi thiết lập bảng giá.
        </div>
      )}

      {hasProfile && <CreatorAddonManager packages={packages} />}

      {/* Package List */}
      <div className="space-y-6">
        {packages.map((item, packageIndex) => (
          <section
            key={item.id}
            className="glass-container space-y-5 rounded-[28px] p-6 sm:p-7"
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-[#A7ACD9]/20 p-2 text-[#A7ACD9]">
                  <Layers className="h-5 w-5" />
                </span>
                <h2 className="font-h1 text-lg font-bold text-white">Gói dịch vụ {packageIndex + 1}</h2>
              </div>
              <button
                type="button"
                onClick={() => removePackage(item.id)}
                className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" /> Xóa gói
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor={`package-name-${item.id}`}>
                  Tên gói dịch vụ
                </label>
                <input
                  id={`package-name-${item.id}`}
                  className={fieldClass}
                  value={item.name}
                  onChange={(event) => updatePackage(item.id, { name: event.target.value })}
                  placeholder="Ví dụ: Minh hoạ chân dung (Headshot)"
                />
              </div>

              <div>
                <label className={labelClass} htmlFor={`package-description-${item.id}`}>
                  Mô tả & Phạm vi quyền hạn
                </label>
                <input
                  id={`package-description-${item.id}`}
                  className={fieldClass}
                  value={item.description ?? ''}
                  onChange={(event) => updatePackage(item.id, { description: event.target.value })}
                  placeholder="Ví dụ: 1 nhân vật, file PNG chất lượng cao, dùng cá nhân"
                />
              </div>
            </div>

            {/* Milestones Breakdown */}
            <div className="space-y-3 border-t border-white/10 pt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#A7ACD9]">
                  Kế hoạch cột mốc (Milestone Breakdown)
                </h3>
                <span className="text-xs text-[#919099]">Tổng giá các mốc = Giá gói</span>
              </div>

              <div className="space-y-2.5">
                {item.milestones.map((stage, index) => (
                  <div
                    key={index}
                    className="grid gap-3 rounded-2xl border border-white/10 bg-[#141724] p-3 sm:grid-cols-[60px_1fr_200px_auto] sm:items-center"
                  >
                    <span className="text-center text-xs font-bold text-[#A7ACD9]">
                      Mốc {index + 1}
                    </span>
                    <input
                      aria-label={`Tên cột mốc ${index + 1}`}
                      className="rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2 text-xs text-white outline-none focus:border-[#A7ACD9]"
                      value={stage.title}
                      onChange={(event) =>
                        updateMilestone(item.id, index, { title: event.target.value })
                      }
                      placeholder="Tên cột mốc (Sketch, Lineart...)"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        aria-label={`Giá cột mốc ${index + 1}`}
                        type="number"
                        min={1000}
                        step={1000}
                        className="w-full rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2 text-xs text-white outline-none focus:border-[#A7ACD9]"
                        value={stage.price}
                        onChange={(event) =>
                          updateMilestone(item.id, index, { price: Number(event.target.value) })
                        }
                      />
                      <span className="text-xs text-[#919099]">đ</span>
                    </div>
                    <button
                      type="button"
                      disabled={item.milestones.length === 1}
                      onClick={() => removeMilestone(item.id, index)}
                      className="rounded-xl border border-white/10 p-2 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                disabled={item.milestones.length >= 10}
                onClick={() => addMilestone(item.id)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" /> Thêm cột mốc
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-xs text-[#919099]">Tổng giá gói tính theo cột mốc</span>
              <strong className="text-lg font-bold text-[#A7ACD9]">
                {money(item.milestones.reduce((sum, stage) => sum + stage.price, 0))}
              </strong>
            </div>
          </section>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
        <button
          type="button"
          disabled={!hasProfile || packages.length >= 10}
          onClick={addPackage}
          className="inline-flex items-center gap-2 rounded-2xl border border-[#A7ACD9]/40 bg-[#A7ACD9]/10 px-5 py-3 text-sm font-bold text-white hover:bg-[#A7ACD9]/20 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> Thêm gói giá mới
        </button>

        <button
          type="button"
          disabled={!hasProfile || saving}
          onClick={save}
          className="rounded-2xl bg-[#A7ACD9] px-8 py-3.5 text-sm font-bold text-[#1F2335] transition hover:bg-[#b8bdf3] disabled:opacity-50"
        >
          {saving ? 'Đang lưu...' : 'Lưu bảng giá'}
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-200">
          {error}
        </div>
      )}
      {message && <div role="status" className="text-xs text-emerald-300">{message}</div>}
    </div>
  );
}
