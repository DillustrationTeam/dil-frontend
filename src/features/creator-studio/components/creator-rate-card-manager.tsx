'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import toast from 'react-hot-toast';
import { z } from 'zod';
import {
  Plus,
  Trash2,
  Package,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Upload,
  Image as ImageIcon,
  Layers,
  X,
  Loader2,
  Check,
} from 'lucide-react';
import { CreatorAddonManager } from './creator-addon-manager';
import { creatorProfileService } from '@/features/creator-studio/services/creator-profile.service';
import type { ArtworkDto } from '@/features/creator-studio/types/creator-profile.types';
import { extractErrorMessage } from '@/lib/api-client';
import {
  creatorRateCardService,
  RateCardPackage,
} from '@/features/creator-studio/services/creator-rate-card.service';

const rateCardSchema = z
  .array(
    z.object({
      id: z.string(),
      name: z.string().trim().min(1).max(100),
      description: z.string().trim().max(2000).nullable().optional(),
      price: z.number(),
      maxRevisions: z.number().int().min(0).max(20).optional(),
      extraRevisionPrice: z.number().int().min(0).max(100_000_000).optional(),
      sampleUrls: z.array(z.string().min(1)).max(10).optional(),
      milestones: z
        .array(
          z.object({
            sequence: z.number().int().positive(),
            title: z.string().trim().min(1).max(200),
            price: z.number().int().positive().max(1_000_000_000_000),
            maxRevisions: z.number().int().min(0).max(20),
          })
        )
        .min(1)
        .max(10),
    })
  )
  .max(10);

const money = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const inputBase =
  'w-full rounded-xl border border-white/10 bg-[#141724] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[#A7ACD9] transition';
const labelBase = 'block text-[11px] font-medium text-slate-300 mb-1';

export function CreatorRateCardManager() {
  const [tab, setTab] = useState<'packages' | 'addons'>('packages');
  const [packages, setPackages] = useState<RateCardPackage[]>([]);
  const [slots, setSlots] = useState<number>(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [error, setError] = useState('');
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});

  // Sample Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadPkgId, setActiveUploadPkgId] = useState<string | null>(null);
  const [uploadingPkgId, setUploadingPkgId] = useState<string | null>(null);

  // Portfolio Picker State
  const [pickerPkgId, setPickerPkgId] = useState<string | null>(null);
  const [portfolioArtworks, setPortfolioArtworks] = useState<ArtworkDto[]>([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [selectedArtworkUrls, setSelectedArtworkUrls] = useState<string[]>([]);

  const handleTriggerUpload = (pkgId: string) => {
    setActiveUploadPkgId(pkgId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadPkgId) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dung lượng ảnh tối đa 10MB.');
      return;
    }

    setUploadingPkgId(activeUploadPkgId);
    try {
      const url = await creatorProfileService.uploadArtworkImage(file);
      const targetPkg = packages.find((p) => p.id === activeUploadPkgId);
      const current = targetPkg?.sampleUrls ?? [];
      if (current.length >= 10) {
        toast.error('Tối đa 10 ảnh mẫu cho mỗi gói.');
        return;
      }
      updatePackage(activeUploadPkgId, { sampleUrls: [...current, url] });
      toast.success('Đã tải ảnh mẫu lên!');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Không tải được ảnh lên.'));
    } finally {
      setUploadingPkgId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeSample = (pkgId: string, sampleIndex: number) => {
    const targetPkg = packages.find((p) => p.id === pkgId);
    const current = targetPkg?.sampleUrls ?? [];
    updatePackage(pkgId, { sampleUrls: current.filter((_, idx) => idx !== sampleIndex) });
  };

  const openPortfolioPicker = async (pkgId: string) => {
    setPickerPkgId(pkgId);
    setSelectedArtworkUrls([]);
    if (portfolioArtworks.length === 0) {
      setLoadingPortfolio(true);
      try {
        const arts = await creatorProfileService.getMyArtworks();
        setPortfolioArtworks(arts);
      } catch {
        toast.error('Không tải được danh sách tác phẩm.');
      } finally {
        setLoadingPortfolio(false);
      }
    }
  };

  const toggleSelectArtwork = (url: string) => {
    setSelectedArtworkUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const confirmPortfolioSelection = () => {
    if (!pickerPkgId) return;
    const targetPkg = packages.find((p) => p.id === pickerPkgId);
    const current = targetPkg?.sampleUrls ?? [];
    const newUrls = selectedArtworkUrls.filter((url) => !current.includes(url));
    const combined = [...current, ...newUrls].slice(0, 10);
    updatePackage(pickerPkgId, { sampleUrls: combined });
    setPickerPkgId(null);
    toast.success(`Đã gắn ${newUrls.length} ảnh mẫu vào gói.`);
  };

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const allCollapsed = packages.length > 0 && packages.every((p) => collapsedIds[p.id]);

  const toggleAllCollapse = () => {
    if (allCollapsed) {
      setCollapsedIds({});
    } else {
      const next: Record<string, boolean> = {};
      packages.forEach((p) => {
        next[p.id] = true;
      });
      setCollapsedIds(next);
    }
  };

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
        } else {
          setError('Không tải được bảng giá. Vui lòng tải lại trang.');
        }
        setHasProfile(false);
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
              milestones: (item.milestones ?? []).map((stage, i) =>
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
        name: `Gói dịch vụ ${current.length + 1}`,
        description: '',
        price: 300000,
        maxRevisions: 2,
        extraRevisionPrice: 50000,
        milestones: [
          { sequence: 1, title: 'Phác thảo (Sketch)', price: 100000, maxRevisions: 2 },
          { sequence: 2, title: 'Hoàn thiện (Final)', price: 200000, maxRevisions: 2 },
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
                ...(item.milestones ?? []),
                {
                  sequence: (item.milestones?.length ?? 0) + 1,
                  title: `Cột mốc ${item.milestones.length + 1}`,
                  price: 100000,
                  maxRevisions: item.maxRevisions ?? 2,
                },
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
              milestones: (item.milestones ?? [])
                .filter((_, i) => i !== index)
                .map((stage, i) => ({ ...stage, sequence: i + 1 })),
            }
          : item
      )
    );
  };

  const save = async () => {
    setError('');
    const normalized = packages.map((item) => ({
      ...item,
      name: item.name.trim(),
      description: item.description?.trim(),
      sampleUrls: item.sampleUrls ?? [],
      milestones: (item.milestones ?? []).map((stage) => ({
        ...stage,
        title: stage.title.trim(),
        maxRevisions: stage.maxRevisions ?? item.maxRevisions ?? 2,
      })),
    }));

    if (!rateCardSchema.safeParse(normalized).success) {
      const msg = 'Mỗi gói cần tên và 1–10 cột mốc có tên, giá hợp lệ. Tối đa 10 gói.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setSaving(true);
    try {
      const saved = await creatorRateCardService.save(
        normalized.map((item) => ({
          ...item,
          price: (item.milestones ?? []).reduce((sum, stage) => sum + stage.price, 0),
        }))
      );
      setPackages(saved);
      toast.success('Đã lưu bảng giá thành công!');
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
    return <div className="p-12 text-center text-xs text-slate-400">Đang tải bảng giá...</div>;
  }

  return (
    <div className="w-full space-y-6 text-[#E4E1E5]">
      {/* Top Header & Slot Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="font-h1 text-2xl font-bold text-white">Bảng giá & Dịch vụ</h1>
          <p className="mt-1 text-xs text-slate-400">
            Thiết lập gói commission, số lần sửa, và phụ phí nhận đơn.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#141724] px-3.5 py-2 text-xs">
            <span className="text-slate-400">Slot nhận đơn:</span>
            <button
              type="button"
              onClick={() => updateSlots(Math.max(0, slots - 1))}
              className="h-6 w-6 rounded-lg bg-white/5 font-bold text-white hover:bg-white/10 flex items-center justify-center transition"
            >
              −
            </button>
            <span className="min-w-[20px] text-center font-bold text-white">{slots}</span>
            <button
              type="button"
              onClick={() => updateSlots(slots + 1)}
              className="h-6 w-6 rounded-lg bg-white/5 font-bold text-white hover:bg-white/10 flex items-center justify-center transition"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {!hasProfile && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3.5 text-xs text-yellow-200">
          Chưa có hồ sơ Creator. Hãy{' '}
          <Link href="/creator-setup" className="font-bold underline text-white">
            tạo hồ sơ
          </Link>{' '}
          trước khi thiết lập bảng giá.
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setTab('packages')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            tab === 'packages'
              ? 'bg-[#A7ACD9] text-[#1F2335] shadow'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Package className="h-3.5 w-3.5" />
          Gói dịch vụ chính ({packages.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('addons')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            tab === 'addons'
              ? 'bg-[#A7ACD9] text-[#1F2335] shadow'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Phụ phí Add-ons
        </button>
      </div>

      {/* Tab: Add-ons */}
      {tab === 'addons' && hasProfile && <CreatorAddonManager packages={packages} />}

      {/* Tab: Packages */}
      {tab === 'packages' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Danh sách gói ({packages.length})</span>
            {packages.length > 1 && (
              <button
                type="button"
                onClick={toggleAllCollapse}
                className="text-xs text-[#A7ACD9] hover:underline transition"
              >
                {allCollapsed ? 'Mở rộng tất cả' : 'Thu gọn tất cả'}
              </button>
            )}
          </div>

          <div className="space-y-4">
            {packages.map((item, index) => {
              const packageTotal = (item.milestones ?? []).reduce((sum, m) => sum + m.price, 0);
              const isCollapsed = Boolean(collapsedIds[item.id]);
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-[#141724]/60 p-4 sm:p-5 space-y-4 transition"
                >
                  {/* Card Header (Collapsible) */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <button
                      type="button"
                      onClick={() => toggleCollapse(item.id)}
                      className="flex items-center gap-3 text-left flex-1 group min-w-0"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#A7ACD9]/15 text-xs font-bold text-[#A7ACD9] group-hover:bg-[#A7ACD9]/25 transition">
                        #{index + 1}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <h2 className="font-semibold text-sm text-white group-hover:text-[#A7ACD9] transition truncate">
                          {item.name || `Gói dịch vụ ${index + 1}`}
                        </h2>
                        <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs font-mono font-bold text-[#A7ACD9] shrink-0">
                          {money(packageTotal)}
                        </span>
                        {isCollapsed && (
                          <span className="text-[11px] text-slate-400">
                            · {item.milestones?.length ?? 0} mốc · {item.maxRevisions ?? 2} lần sửa
                          </span>
                        )}
                      </div>
                      <span className="ml-auto mr-3 text-slate-400 group-hover:text-white transition shrink-0">
                        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => removePackage(item.id)}
                      className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Xóa gói
                    </button>
                  </div>

                  {!isCollapsed && (
                    <>

                  {/* Main Info */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelBase} htmlFor={`pkg-name-${item.id}`}>
                        Tên gói
                      </label>
                      <input
                        id={`pkg-name-${item.id}`}
                        className={inputBase}
                        value={item.name}
                        onChange={(e) => updatePackage(item.id, { name: e.target.value })}
                        placeholder="Ví dụ: Chân dung (Headshot)"
                      />
                    </div>

                    <div>
                      <label className={labelBase} htmlFor={`pkg-desc-${item.id}`}>
                        Mô tả phạm vi
                      </label>
                      <input
                        id={`pkg-desc-${item.id}`}
                        className={inputBase}
                        value={item.description ?? ''}
                        onChange={(e) => updatePackage(item.id, { description: e.target.value })}
                        placeholder="Ví dụ: 1 nhân vật, PNG 300DPI, dùng cá nhân"
                      />
                    </div>

                    <div>
                      <label className={labelBase} htmlFor={`pkg-rev-${item.id}`}>
                        Số lần sửa miễn phí / mốc
                      </label>
                      <div className="relative">
                        <input
                          id={`pkg-rev-${item.id}`}
                          type="number"
                          min={0}
                          max={20}
                          className={inputBase}
                          value={item.maxRevisions ?? 2}
                          onChange={(e) =>
                            updatePackage(item.id, {
                              maxRevisions: Math.max(0, Number(e.target.value)),
                            })
                          }
                          placeholder="2"
                        />
                        <span className="absolute right-3.5 top-2.5 text-[11px] text-slate-500">
                          lần/mốc
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className={labelBase} htmlFor={`pkg-extra-${item.id}`}>
                        Phí sửa thêm khi vượt quá
                      </label>
                      <div className="relative">
                        <input
                          id={`pkg-extra-${item.id}`}
                          type="number"
                          min={0}
                          step={10000}
                          className={inputBase}
                          value={item.extraRevisionPrice ?? 50000}
                          onChange={(e) =>
                            updatePackage(item.id, {
                              extraRevisionPrice: Math.max(0, Number(e.target.value)),
                            })
                          }
                          placeholder="50000"
                        />
                        <span className="absolute right-3.5 top-2.5 text-[11px] text-slate-500">
                          đ/lần
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Milestones Breakdown */}
                  <div className="space-y-2.5 pt-3 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">Cột mốc thanh toán</span>
                      <span className="text-slate-500 text-[11px]">
                        Giá chia theo mốc (tổng = giá gói)
                      </span>
                    </div>

                    <div className="space-y-2">
                      {(item.milestones ?? []).map((stage, mIndex) => (
                        <div
                          key={mIndex}
                          className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 rounded-xl bg-white/[0.02] border border-white/5 p-2"
                        >
                          <span className="min-w-[48px] text-center text-xs font-bold text-slate-400">
                            Mốc {mIndex + 1}
                          </span>
                          <input
                            aria-label={`Tên mốc ${mIndex + 1}`}
                            className="flex-1 rounded-lg border border-white/10 bg-[#171a2a] px-3 py-1.5 text-xs text-white outline-none focus:border-[#A7ACD9]"
                            value={stage.title}
                            onChange={(e) =>
                              updateMilestone(item.id, mIndex, { title: e.target.value })
                            }
                            placeholder="Tên mốc (Sketch, Lineart...)"
                          />
                          <div className="flex items-center gap-1.5 w-36">
                            <input
                              aria-label={`Giá mốc ${mIndex + 1}`}
                              type="number"
                              min={1}
                              step={1000}
                              className="w-full rounded-lg border border-white/10 bg-[#171a2a] px-3 py-1.5 text-xs text-white outline-none focus:border-[#A7ACD9]"
                              value={stage.price}
                              onChange={(e) =>
                                updateMilestone(item.id, mIndex, { price: Number(e.target.value) })
                              }
                            />
                            <span className="text-[11px] text-slate-500">đ</span>
                          </div>
                          <button
                            type="button"
                            disabled={(item.milestones?.length ?? 0) <= 1}
                            onClick={() => removeMilestone(item.id, mIndex)}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400 disabled:opacity-30 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={(item.milestones?.length ?? 0) >= 10}
                      onClick={() => addMilestone(item.id)}
                      className="inline-flex items-center gap-1 text-xs text-[#A7ACD9] hover:underline pt-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Thêm cột mốc
                    </button>
                  </div>

                  {/* Sample Artworks Section */}
                  <div className="space-y-2.5 pt-3 border-t border-white/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-[#A7ACD9]" />
                        <span className="font-semibold text-slate-300">
                          Ảnh mẫu minh họa ({item.sampleUrls?.length || 0}/10)
                        </span>
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        Ảnh mẫu giúp khách hàng hình dung rõ phong cách của gói này
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      {item.sampleUrls?.map((url, sIdx) => (
                        <div
                          key={sIdx}
                          className="relative group h-20 w-20 rounded-xl overflow-hidden border border-white/10 bg-black/40 shrink-0"
                        >
                          <Image
                            src={url}
                            alt={`${item.name} sample ${sIdx + 1}`}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeSample(item.id, sIdx)}
                            className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/80 text-rose-400 hover:text-white hover:bg-rose-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
                            title="Xóa ảnh mẫu này"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}

                      {(item.sampleUrls?.length || 0) < 10 && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTriggerUpload(item.id)}
                            disabled={uploadingPkgId === item.id}
                            className="h-20 px-3.5 rounded-xl border border-dashed border-white/20 bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#A7ACD9] flex flex-col items-center justify-center gap-1.5 text-[11px] text-slate-300 transition"
                          >
                            {uploadingPkgId === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-[#A7ACD9]" />
                            ) : (
                              <Upload className="h-4 w-4 text-[#A7ACD9]" />
                            )}
                            <span>{uploadingPkgId === item.id ? 'Đang tải…' : '+ Tải ảnh'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openPortfolioPicker(item.id)}
                            className="h-20 px-3.5 rounded-xl border border-dashed border-white/20 bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#A7ACD9] flex flex-col items-center justify-center gap-1.5 text-[11px] text-slate-300 transition"
                          >
                            <Layers className="h-4 w-4 text-[#A7ACD9]" />
                            <span>+ Từ Portfolio</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <button
              type="button"
              disabled={!hasProfile || packages.length >= 10}
              onClick={addPackage}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-40 transition"
            >
              <Plus className="h-4 w-4" /> Thêm gói mới
            </button>

            <button
              type="button"
              disabled={!hasProfile || saving}
              onClick={save}
              className="rounded-xl bg-[#A7ACD9] px-7 py-2.5 text-xs font-bold text-[#1F2335] shadow-lg hover:bg-[#b8bde4] disabled:opacity-50 transition"
            >
              {saving ? 'Đang lưu…' : 'Lưu bảng giá'}
            </button>
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-xs text-red-200">
              {error}
            </p>
          )}
        </div>
      )}

      {/* Hidden File Input for Sample Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />

      {/* Portfolio Artwork Picker Modal */}
      {pickerPkgId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#141724] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#A7ACD9]" />
                <div>
                  <h3 className="font-bold text-sm text-white">Chọn tranh mẫu từ Portfolio</h3>
                  <p className="text-[11px] text-slate-400">
                    Chọn các tác phẩm bạn đã đăng để gắn làm ảnh mẫu cho gói dịch vụ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPickerPkgId(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingPortfolio ? (
              <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-[#A7ACD9]" />
                <span>Đang tải danh sách tác phẩm của bạn...</span>
              </div>
            ) : portfolioArtworks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <p>Bạn chưa đăng tác phẩm nào lên portfolio.</p>
                <p className="text-[11px] text-slate-500">
                  Bạn có thể dùng nút &quot;+ Tải ảnh&quot; để tải trực tiếp từ máy tính.
                </p>
              </div>
            ) : (
              <div className="max-h-[50vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {portfolioArtworks.map((art) => {
                    const url = art.thumbnailUrl || art.imageUrl;
                    const isSelected = selectedArtworkUrls.includes(url);
                    const alreadyAttached =
                      packages.find((p) => p.id === pickerPkgId)?.sampleUrls?.includes(url) ?? false;

                    return (
                      <button
                        key={art.id}
                        type="button"
                        disabled={alreadyAttached}
                        onClick={() => toggleSelectArtwork(url)}
                        className={`group relative aspect-square rounded-xl overflow-hidden border transition text-left ${
                          alreadyAttached
                            ? 'border-white/5 opacity-40 cursor-not-allowed'
                            : isSelected
                            ? 'border-[#A7ACD9] ring-2 ring-[#A7ACD9]'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <Image src={url} alt={art.title} fill unoptimized className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                          <span className="text-[10px] text-white font-medium truncate w-full">
                            {art.title}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-[#A7ACD9] text-[#1F2335] flex items-center justify-center font-bold shadow">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}
                        {alreadyAttached && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-slate-300 px-1.5 py-0.5 rounded bg-black/70">
                              Đã gắn
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-xs text-slate-400">
                Đã chọn: <strong className="text-white">{selectedArtworkUrls.length}</strong> ảnh
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPickerPkgId(null)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={selectedArtworkUrls.length === 0}
                  onClick={confirmPortfolioSelection}
                  className="rounded-xl bg-[#A7ACD9] px-5 py-2 text-xs font-bold text-[#1F2335] shadow hover:bg-[#b8bde4] disabled:opacity-50 transition"
                >
                  Gắn vào gói ({selectedArtworkUrls.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
