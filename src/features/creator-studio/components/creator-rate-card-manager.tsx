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
import { categoriesService, type CategoryDto } from '@/features/marketplace/services/categories.service';
import type { ArtworkDto } from '@/features/creator-studio/types/creator-profile.types';
import { extractErrorMessage } from '@/lib/api-client';
import {
  creatorRateCardService,
  RateCardPackage,
  getPackageSlotInfo,
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
      maxSlots: z.number().int().min(0).max(100).nullable().optional(),
      categoryId: z.string().nullable().optional(),
      categoryName: z.string().nullable().optional(),
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
  'w-full rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8] px-3.5 py-2.5 text-xs text-[#241F1A] text-[#746A5F] outline-none focus:border-[#B24A26] transition';
const labelBase = 'block text-[11px] font-medium text-[#746A5F] mb-1';

export function CreatorRateCardManager() {
  const [tab, setTab] = useState<'packages' | 'addons'>('packages');
  const [packages, setPackages] = useState<RateCardPackage[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [slotLimitEnabled, setSlotLimitEnabled] = useState(false);
  const [togglingSlotLimit, setTogglingSlotLimit] = useState(false);
  const savedSlotLimitsRef = useRef<Record<string, number | null>>({});
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
      toast.error('Vui lòng chọn tệp hình ảnh (PNG, JPG, WEBP).');
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
        const cardPackages = await creatorRateCardService.get(profile.id);
        setPackages(cardPackages);
        setSlotLimitEnabled(cardPackages.some((pkg) => pkg.maxSlots !== null && pkg.maxSlots !== undefined));
      } catch (cause) {
        if (axios.isAxiosError(cause) && cause.response?.status === 400) {
          setError('Tài khoản này chưa có hồ sơ họa sĩ. Hãy tạo hồ sơ trước khi lưu bảng giá.');
        } else {
          setError('Không tải được bảng giá. Vui lòng tải lại trang.');
        }
        setHasProfile(false);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
    categoriesService.getCategories().then(setCategories).catch(() => undefined);
  }, []);

  const toggleSlotLimit = async () => {
    const nextEnabled = !slotLimitEnabled;
    if (!nextEnabled) {
      const snapshot: Record<string, number | null> = {};
      for (const pkg of packages) snapshot[pkg.id] = pkg.maxSlots ?? null;
      savedSlotLimitsRef.current = snapshot;
    }

    const updatedPackages = packages.map((pkg) => {
      const price = (pkg.milestones ?? []).reduce((sum, stage) => sum + stage.price, 0);
      if (!nextEnabled) {
        return { ...pkg, price, maxSlots: null };
      }
      const restored = savedSlotLimitsRef.current[pkg.id];
      const nextMaxSlots = restored !== undefined && restored !== null ? restored : (pkg.maxSlots ?? 3);
      return { ...pkg, price, maxSlots: nextMaxSlots };
    });

    setSlotLimitEnabled(nextEnabled);
    setPackages(updatedPackages);

    if (!hasProfile || updatedPackages.length === 0) {
      toast.success(nextEnabled ? 'Đã bật giới hạn số lượt nhận đơn.' : 'Đã tắt giới hạn số lượt nhận đơn.');
      return;
    }

    const validation = rateCardSchema.safeParse(updatedPackages);
    if (!validation.success) {
      toast.success(nextEnabled ? 'Đã bật giới hạn lượt — bấm Lưu bảng giá sau khi hoàn tất chỉnh sửa.' : 'Đã tắt giới hạn lượt — bấm Lưu bảng giá để áp dụng.');
      return;
    }

    setTogglingSlotLimit(true);
    try {
      const saved = await creatorRateCardService.save(updatedPackages);
      setPackages(saved);
      toast.success(nextEnabled ? 'Đã bật giới hạn số lượt nhận đơn.' : 'Đã chuyển toàn bộ gói sang Không giới hạn lượt.');
    } catch {
      toast.error('Không thể lưu trạng thái giới hạn lượt. Vui lòng thử bấm Lưu bảng giá.');
    } finally {
      setTogglingSlotLimit(false);
    }
  };

  const updatePackage = (id: string, patch: Partial<RateCardPackage>) => {
    setPackages((current) => {
      const next = current.map((item) => (item.id === id ? { ...item, ...patch } : item));
      if (patch.maxSlots !== undefined) {
        setSlotLimitEnabled(next.some((item) => item.maxSlots !== null && item.maxSlots !== undefined));
      }
      return next;
    });
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
          { sequence: 1, title: 'Phác thảo', price: 100000, maxRevisions: 2 },
          { sequence: 2, title: 'Hoàn thiện', price: 200000, maxRevisions: 2 },
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
    return <div className="p-12 text-center text-xs text-[#746A5F]">Đang tải bảng giá...</div>;
  }

  return (
    <div className="w-full space-y-6 text-[#241F1A]">
      {/* Top Header & Slot Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#221E1A]/10 pb-5">
        <div>
          <h1 className="font-h1 text-2xl font-bold text-[#241F1A]">Bảng giá & Dịch vụ</h1>
          <p className="mt-1 text-xs text-[#746A5F]"> Thiết lập gói đặt vẽ, số lần sửa, và phụ phí nhận đơn. </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={slotLimitEnabled}
            disabled={togglingSlotLimit}
            onClick={toggleSlotLimit}
            className="flex items-center gap-3 rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8] px-3.5 py-2 text-xs hover:border-[#B24A26]/40 transition disabled:opacity-50"
          >
            <span className="text-[#746A5F] font-medium">Giới hạn số lượt nhận đơn</span>
            <span
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                slotLimitEnabled ? 'bg-[#B24A26]' : 'bg-[#F0E7D8]'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-[#FFFCF6] transition-transform ${
                  slotLimitEnabled ? 'translate-x-4.5' : 'translate-x-1'
                }`}
              />
            </span>
            <span className={`text-[11px] font-semibold ${slotLimitEnabled ? 'text-[#8C3718]' : 'text-[#2C6A86]'}`}>
              {slotLimitEnabled ? 'Đang bật' : 'Không giới hạn'}
            </span>
          </button>
        </div>
      </div>

      {!hasProfile && (
        <div className="rounded-xl border border-[#8A6A1F]/40 bg-[#8A6A1F]/10 p-3.5 text-xs text-[#8A6A1F]">
          Chưa có hồ sơ họa sĩ. Hãy{' '}
          <Link href="/creator-setup" className="font-bold underline text-[#241F1A]"> tạo hồ sơ </Link>{' '}
          trước khi thiết lập bảng giá.
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#221E1A]/10 pb-3">
        <button
          type="button"
          onClick={() => setTab('packages')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            tab === 'packages'
              ? 'bg-[#B24A26] text-[#F7F2E9] shadow'
              : 'text-[#746A5F] hover:text-[#241F1A] hover:bg-[#FFFCF6]'
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
              ? 'bg-[#B24A26] text-[#F7F2E9] shadow'
              : 'text-[#746A5F] hover:text-[#241F1A] hover:bg-[#FFFCF6]'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" /> Phụ phí Add-ons </button>
      </div>

      {/* Tab: Add-ons */}
      {tab === 'addons' && hasProfile && <CreatorAddonManager packages={packages} />}

      {/* Tab: Packages */}
      {tab === 'packages' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-[#746A5F]">
            <span>Danh sách gói ({packages.length})</span>
            {packages.length > 1 && (
              <button
                type="button"
                onClick={toggleAllCollapse}
                className="text-xs text-[#B24A26] hover:underline transition"
              >
                {allCollapsed ? 'Mở rộng tất cả' : 'Thu gọn tất cả'}
              </button>
            )}
          </div>

          <div className="space-y-4">
            {packages.map((item, index) => {
              const packageTotal = (item.milestones ?? []).reduce((sum, m) => sum + m.price, 0);
              const isCollapsed = Boolean(collapsedIds[item.id]);
              const slotInfo = getPackageSlotInfo(item);
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#221E1A]/10 bg-[#F0E7D8]/60 p-4 sm:p-5 space-y-4 transition"
                >
                  {/* Card Header (Collapsible) */}
                  <div className="flex items-center justify-between border-b border-[#221E1A]/10 pb-3">
                    <button
                      type="button"
                      onClick={() => toggleCollapse(item.id)}
                      className="flex items-center gap-3 text-left flex-1 group min-w-0"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#B24A26]/15 text-xs font-bold text-[#B24A26] group-hover:bg-[#B24A26]/25 transition">
                        #{index + 1}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <h2 className="font-semibold text-sm text-[#241F1A] group-hover:text-[#B24A26] transition truncate">
                          {item.name || `Gói dịch vụ ${index + 1}`}
                        </h2>
                        {(item.categoryName || categories.find((c) => c.id === item.categoryId)?.name) && (
                          <span className="rounded-lg bg-[#B24A26]/15 border border-[#B24A26]/30 px-2 py-0.5 text-[10px] font-semibold text-[#8C3718] shrink-0">
                            {item.categoryName || categories.find((c) => c.id === item.categoryId)?.name}
                          </span>
                        )}
                        <span className="rounded-lg bg-[#FFFCF6] border border-[#221E1A]/10 px-2.5 py-0.5 text-xs font-mono font-bold text-[#B24A26] shrink-0">
                          {money(packageTotal)}
                        </span>
                        <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold shrink-0 ${
                          !slotInfo.isLimited
                            ? 'border-[#2C6A86]/35 bg-[#2C6A86]/10 text-[#2C6A86]'
                            : slotInfo.isFull
                              ? 'border-[#A8321C]/40 bg-[#A8321C]/10 text-[#A8321C]'
                              : 'border-[#2F6B63]/35 bg-[#2F6B63]/10 text-[#2F6B63]'
                        }`}>
                          {slotInfo.isLimited ? slotInfo.label : '∞ Không giới hạn'}
                        </span>
                        {isCollapsed && (
                          <span className="text-[11px] text-[#746A5F]">
                            · {item.milestones?.length ?? 0} mốc · {item.maxRevisions ?? 2} lần sửa
                          </span>
                        )}
                      </div>
                      <span className="ml-auto mr-3 text-[#746A5F] group-hover:text-[#241F1A] transition shrink-0">
                        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => removePackage(item.id)}
                      className="flex items-center gap-1 text-xs text-[#A8321C] hover:text-[#A8321C] transition shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Xóa gói </button>
                  </div>

                  {!isCollapsed && (
                    <>

                  {/* Main Info */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelBase} htmlFor={`pkg-name-${item.id}`}> Tên gói </label>
                      <input
                        id={`pkg-name-${item.id}`}
                        className={inputBase}
                        value={item.name}
                        onChange={(e) => updatePackage(item.id, { name: e.target.value })}
                        placeholder="Ví dụ: Chân dung"
                      />
                    </div>

                    <div>
                      <label className={labelBase} htmlFor={`pkg-desc-${item.id}`}> Mô tả phạm vi </label>
                      <input
                        id={`pkg-desc-${item.id}`}
                        className={inputBase}
                        value={item.description ?? ''}
                        onChange={(e) => updatePackage(item.id, { description: e.target.value })}
                        placeholder="Ví dụ: 1 nhân vật, PNG 300DPI, dùng cá nhân"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className={labelBase} htmlFor={`pkg-cat-${item.id}`}> Danh mục lớn chuyên môn của gói (Category) </label>
                      <select
                        id={`pkg-cat-${item.id}`}
                        className={inputBase}
                        value={item.categoryId ?? ''}
                        onChange={(e) => {
                          const nextId = e.target.value || null;
                          const matched = categories.find((c) => c.id === nextId);
                          updatePackage(item.id, {
                            categoryId: nextId,
                            categoryName: matched?.name ?? null,
                          });
                        }}
                      >
                        <option value="">-- Không gắn danh mục cụ thể --</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelBase} htmlFor={`pkg-rev-${item.id}`}> Số lần sửa miễn phí / mốc </label>
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
                        <span className="absolute right-3.5 top-2.5 text-[11px] text-[#746A5F]"> lần/mốc </span>
                      </div>
                    </div>

                    <div>
                      <label className={labelBase} htmlFor={`pkg-extra-${item.id}`}> Phí sửa thêm khi vượt quá </label>
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
                        <span className="absolute right-3.5 top-2.5 text-[11px] text-[#746A5F]"> đ/lần </span>
                      </div>
                    </div>

                    <div className="sm:col-span-2 rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8]/25 p-3.5 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-[#746A5F]"> Tùy biến lượt nhận đơn cho riêng gói này </span>
                        <div className="inline-flex rounded-lg border border-[#221E1A]/10 bg-[#F0E7D8] p-0.5 text-[11px]">
                          <button
                            type="button"
                            onClick={() => updatePackage(item.id, { maxSlots: null })}
                            className={`rounded-md px-2.5 py-1 font-semibold transition ${
                              !slotInfo.isLimited
                                ? 'bg-[#B24A26] text-[#F7F2E9]'
                                : 'text-[#746A5F] hover:text-[#241F1A]'
                            }`}
                          > Không giới hạn lượt </button>
                          <button
                            type="button"
                            onClick={() => updatePackage(item.id, { maxSlots: slotInfo.maxSlots ?? 3 })}
                            className={`rounded-md px-2.5 py-1 font-semibold transition ${
                              slotInfo.isLimited
                                ? 'bg-[#B24A26] text-[#F7F2E9]'
                                : 'text-[#746A5F] hover:text-[#241F1A]'
                            }`}
                          > Giới hạn theo gói </button>
                        </div>
                      </div>

                      {slotInfo.isLimited ? (
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] text-[#746A5F]" htmlFor={`pkg-slots-${item.id}`}> Số đơn tối đa đang mở: </label>
                            <input
                              id={`pkg-slots-${item.id}`}
                              type="number"
                              min={0}
                              max={100}
                              className="w-20 rounded-lg border border-[#221E1A]/10 bg-[#E5D8C2] px-2.5 py-1.5 text-xs text-[#241F1A] focus:border-[#B24A26] focus:outline-none"
                              value={slotInfo.maxSlots ?? 0}
                              onChange={(e) =>
                                updatePackage(item.id, {
                                  maxSlots: Math.min(100, Math.max(0, Math.trunc(Number(e.target.value) || 0))),
                                })
                              }
                            />
                          </div>
                          <span className={`text-[11px] font-medium ${slotInfo.isFull ? 'text-[#A8321C]' : 'text-[#2F6B63]'}`}>
                            Đang thực hiện: {slotInfo.activeCount} đơn • {slotInfo.label} (tự hoàn lại khi xong hoặc hủy đơn)
                          </span>
                        </div>
                      ) : (
                        <p className="text-[11px] text-[#746A5F]"> Gói này không giới hạn số lượng đơn đồng thời (chỉ tắt khi bạn tắt nhận đơn toàn xưởng vẽ). </p>
                      )}
                    </div>
                  </div>

                  {/* Milestones Breakdown */}
                  <div className="space-y-2.5 pt-3 border-t border-[#221E1A]/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#746A5F]">Cột mốc thanh toán</span>
                      <span className="text-[#746A5F] text-[11px]">
                        Giá chia theo mốc (tổng = giá gói)
                      </span>
                    </div>

                    <div className="space-y-2">
                      {(item.milestones ?? []).map((stage, mIndex) => (
                        <div
                          key={mIndex}
                          className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 rounded-xl bg-[#FFFCF6] border border-[#221E1A]/10 p-2"
                        >
                          <span className="min-w-[48px] text-center text-xs font-bold text-[#746A5F]">
                            Mốc {mIndex + 1}
                          </span>
                          <input
                            aria-label={`Tên mốc ${mIndex + 1}`}
                            className="flex-1 rounded-lg border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-1.5 text-xs text-[#241F1A] outline-none focus:border-[#B24A26]"
                            value={stage.title}
                            onChange={(e) =>
                              updateMilestone(item.id, mIndex, { title: e.target.value })
                            }
                            placeholder="Tên mốc"
                          />
                          <div className="flex items-center gap-1.5 w-36">
                            <input
                              aria-label={`Giá mốc ${mIndex + 1}`}
                              type="number"
                              min={1}
                              step={1000}
                              className="w-full rounded-lg border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-1.5 text-xs text-[#241F1A] outline-none focus:border-[#B24A26]"
                              value={stage.price}
                              onChange={(e) =>
                                updateMilestone(item.id, mIndex, { price: Number(e.target.value) })
                              }
                            />
                            <span className="text-[11px] text-[#746A5F]">đ</span>
                          </div>
                          <button
                            type="button"
                            disabled={(item.milestones?.length ?? 0) <= 1}
                            onClick={() => removeMilestone(item.id, mIndex)}
                            className="rounded-lg p-1.5 text-[#746A5F] hover:text-[#A8321C] disabled:opacity-30 transition"
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
                      className="inline-flex items-center gap-1 text-xs text-[#B24A26] hover:underline pt-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Thêm cột mốc </button>
                  </div>

                  {/* Sample Artworks Section */}
                  <div className="space-y-2.5 pt-3 border-t border-[#221E1A]/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-[#B24A26]" />
                        <span className="font-semibold text-[#746A5F]">
                          Ảnh mẫu minh họa ({item.sampleUrls?.length || 0}/10)
                        </span>
                      </div>
                      <span className="text-[#746A5F] text-[11px]"> Ảnh mẫu giúp khách hàng hình dung rõ phong cách của gói này </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      {item.sampleUrls?.map((url, sIdx) => (
                        <div
                          key={sIdx}
                          className="relative group h-20 w-20 rounded-xl overflow-hidden border border-[#221E1A]/10 bg-[#F0E7D8] shrink-0"
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
                            className="absolute top-1 right-1 h-5 w-5 rounded-full bg-[#E5D8C2] text-[#A8321C] hover:text-[#241F1A] hover:bg-[#A8321C]/12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
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
                            className="h-20 px-3.5 rounded-xl border border-dashed border-[#221E1A]/20 bg-[#FFFCF6] hover:bg-[#FFFCF6] hover:border-[#B24A26] flex flex-col items-center justify-center gap-1.5 text-[11px] text-[#746A5F] transition"
                          >
                            {uploadingPkgId === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-[#B24A26]" />
                            ) : (
                              <Upload className="h-4 w-4 text-[#B24A26]" />
                            )}
                            <span>{uploadingPkgId === item.id ? 'Đang tải…' : '+ Tải ảnh'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openPortfolioPicker(item.id)}
                            className="h-20 px-3.5 rounded-xl border border-dashed border-[#221E1A]/20 bg-[#FFFCF6] hover:bg-[#FFFCF6] hover:border-[#B24A26] flex flex-col items-center justify-center gap-1.5 text-[11px] text-[#746A5F] transition"
                          >
                            <Layers className="h-4 w-4 text-[#B24A26]" />
                            <span>+ Từ hồ sơ tác phẩm</span>
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-2.5 text-xs font-semibold text-[#241F1A] hover:bg-[#F0E7D8] disabled:opacity-40 transition"
            >
              <Plus className="h-4 w-4" /> Thêm gói mới </button>

            <button
              type="button"
              disabled={!hasProfile || saving}
              onClick={save}
              className="rounded-xl bg-[#B24A26] px-7 py-2.5 text-xs font-bold text-[#F7F2E9] shadow-lg hover:bg-[#8C3718] disabled:opacity-50 transition"
            >
              {saving ? 'Đang lưu…' : 'Lưu bảng giá'}
            </button>
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-[#A8321C]/40 bg-[#A8321C]/10 p-3 text-xs text-[#A8321C]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#E5D8C2] backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-[#221E1A]/10 bg-[#F0E7D8] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#221E1A]/10 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#B24A26]" />
                <div>
                  <h3 className="font-bold text-sm text-[#241F1A]">Chọn tranh mẫu từ hồ sơ tác phẩm</h3>
                  <p className="text-[11px] text-[#746A5F]"> Chọn các tác phẩm bạn đã đăng để gắn làm ảnh mẫu cho gói dịch vụ </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPickerPkgId(null)}
                className="rounded-lg p-1.5 text-[#746A5F] hover:text-[#241F1A] hover:bg-[#FFFCF6] transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingPortfolio ? (
              <div className="p-12 text-center text-xs text-[#746A5F] flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-[#B24A26]" />
                <span>Đang tải danh sách tác phẩm của bạn...</span>
              </div>
            ) : portfolioArtworks.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#746A5F] space-y-2">
                <p>Bạn chưa đăng tác phẩm nào lên hồ sơ tác phẩm.</p>
                <p className="text-[11px] text-[#746A5F]">
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
                            ? 'border-[#221E1A]/10 opacity-40 cursor-not-allowed'
                            : isSelected
                            ? 'border-[#B24A26] ring-2 ring-[#B24A26]'
                            : 'border-[#221E1A]/10 hover:border-[#221E1A]/20'
                        }`}
                      >
                        <Image src={url} alt={art.title} fill unoptimized className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#F7F2E9]/80 via-transparent to-transparent flex items-end p-2">
                          <span className="text-[10px] text-[#241F1A] font-medium truncate w-full">
                            {art.title}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-[#B24A26] text-[#F7F2E9] flex items-center justify-center font-bold shadow">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}
                        {alreadyAttached && (
                          <div className="absolute inset-0 bg-[#E5D8C2] flex items-center justify-center">
                            <span className="text-[9px] font-bold text-[#746A5F] px-1.5 py-0.5 rounded bg-[#E5D8C2]"> Đã gắn </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-[#221E1A]/10 pt-3">
              <span className="text-xs text-[#746A5F]"> Đã chọn: <strong className="text-[#241F1A]">{selectedArtworkUrls.length}</strong> ảnh </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPickerPkgId(null)}
                  className="rounded-xl border border-[#221E1A]/10 px-4 py-2 text-xs font-semibold text-[#746A5F] hover:text-[#241F1A] hover:bg-[#FFFCF6] transition"
                > Hủy </button>
                <button
                  type="button"
                  disabled={selectedArtworkUrls.length === 0}
                  onClick={confirmPortfolioSelection}
                  className="rounded-xl bg-[#B24A26] px-5 py-2 text-xs font-bold text-[#F7F2E9] shadow hover:bg-[#8C3718] disabled:opacity-50 transition"
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
