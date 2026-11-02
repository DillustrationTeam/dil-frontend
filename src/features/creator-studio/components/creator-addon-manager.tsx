'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  addonService,
  addonSchema,
  type CreatorAddon,
  type AddonPreset,
} from '@/services/addon.service';
import { creatorProfileService } from '../services/creator-profile.service';
import { extractErrorMessage } from '@/lib/api-client';
import type { RateCardPackage } from '../services/creator-rate-card.service';
import {
  Edit2,
  Plus,
  RefreshCw,
  Sparkles,
  Layers,
  Clock,
  Check,
  Package,
  Search,
  AlertCircle,
  X,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  packages: RateCardPackage[];
}

type StageCategory = 'All' | 'Sketch' | 'Lineart' | 'Final' | 'Any';

export function CreatorAddonManager({ packages }: Props) {
  const [items, setItems] = useState<CreatorAddon[]>([]);
  const [presets, setPresets] = useState<AddonPreset[]>([]);
  const [profileId, setProfileId] = useState('');
  const [loading, setLoading] = useState(true);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [presetKey, setPresetKey] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [stage, setStage] = useState<string>('Sketch');
  const [days, setDays] = useState('0');
  const [packageId, setPackageId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Preset browser tab inside the creation panel
  const [presetTab, setPresetTab] = useState<'Sketch' | 'Lineart' | 'Final'>('Sketch');

  // List filter state
  const [listFilterStage, setListFilterStage] = useState<StageCategory>('All');
  const [listSearch, setListSearch] = useState('');
  const [listFilterStatus, setListFilterStatus] = useState<'All' | 'Active' | 'Inactive'>('All');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const profile = await creatorProfileService.getMyProfile();
        const [addons, catalog] = await Promise.all([
          addonService.creator(profile.id),
          addonService.presets(),
        ]);
        if (active) {
          setProfileId(profile.id);
          setItems(addons);
          setPresets(catalog);
        }
      } catch (e) {
        if (active) setError(extractErrorMessage(e, 'Không tải được danh sách phụ phí.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setPresetKey(null);
    setTitle('');
    setPrice('');
    setDays('0');
    setPackageId('');
    setStage('Sketch');
    setError('');
  };

  const handleSelectPreset = (p: AddonPreset) => {
    if (presetKey === p.key && !editingId) {
      resetForm();
    } else {
      setEditingId(null);
      setPresetKey(p.key);
      setTitle(p.title);
      setStage(p.allowedMilestone);
      setError('');
    }
  };

  const startEdit = (item: CreatorAddon) => {
    setEditingId(item.id);
    setPresetKey(item.presetKey || null);
    setTitle(item.title);
    setPrice(item.price.toString());
    setDays(item.extendDays.toString());
    setStage(item.allowedMilestone);
    setPackageId(item.packageId || '');
    setError('');

    // Smooth scroll to form on mobile or small screens
    const formElement = document.getElementById('addon-form-panel');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleItemActive = async (addon: CreatorAddon) => {
    const nextStatus = !addon.isActive;
    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) => (i.id === addon.id ? { ...i, isActive: nextStatus } : i))
    );

    try {
      await addonService.save({
        id: addon.id,
        title: addon.title,
        price: addon.price,
        allowedMilestone: addon.allowedMilestone,
        extendDays: addon.extendDays,
        packageId: addon.packageId || null,
        presetKey: addon.presetKey || null,
        isActive: nextStatus,
      });
      toast.success(nextStatus ? `Đã bật phụ phí "${addon.title}"` : `Đã tạm tắt phụ phí "${addon.title}"`);
    } catch (cause) {
      // Revert optimistic update
      setItems((prev) =>
        prev.map((i) => (i.id === addon.id ? { ...i, isActive: !nextStatus } : i))
      );
      toast.error(extractErrorMessage(cause, 'Không đổi được trạng thái phụ phí.'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsed = addonSchema.safeParse({
      title,
      price: Number(price),
      allowedMilestone: stage,
      extendDays: Number(days),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setBusy(true);
    try {
      await addonService.save({
        ...parsed.data,
        id: editingId || undefined,
        presetKey,
        packageId: packageId || null,
        isActive: items.find((item) => item.id === editingId)?.isActive ?? true,
      });

      // Refresh list
      const refreshed = await addonService.creator(profileId);
      setItems(refreshed);
      resetForm();
      toast.success(editingId ? 'Đã cập nhật phụ phí!' : 'Đã thêm phụ phí mới vào danh sách!');
    } catch (cause) {
      const msg = extractErrorMessage(cause, 'Không lưu được phụ phí.');
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // Filtered List
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Stage filter
      if (listFilterStage !== 'All') {
        const itemStages = item.allowedMilestone.split(',');
        if (listFilterStage === 'Any' && item.allowedMilestone !== 'Any') return false;
        if (listFilterStage !== 'Any' && !itemStages.includes(listFilterStage) && item.allowedMilestone !== 'Any') {
          return false;
        }
      }

      // Status filter
      if (listFilterStatus === 'Active' && !item.isActive) return false;
      if (listFilterStatus === 'Inactive' && item.isActive) return false;

      // Search keyword
      if (listSearch.trim()) {
        const term = listSearch.toLowerCase();
        return item.title.toLowerCase().includes(term);
      }

      return true;
    });
  }, [items, listFilterStage, listFilterStatus, listSearch]);

  const activeCount = items.filter((i) => i.isActive).length;

  const stageBadge = (milestone: string) => {
    if (milestone === 'Any') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/15 border border-purple-500/25 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
          Toàn bộ quy trình
        </span>
      );
    }
    const tags = milestone.split(',');
    return (
      <div className="flex flex-wrap items-center gap-1">
        {tags.map((t) => {
          if (t === 'Sketch') {
            return (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 text-[10px] font-semibold text-amber-300"
              >
                Phác thảo (Sketch)
              </span>
            );
          }
          if (t === 'Lineart') {
            return (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-md bg-sky-500/15 border border-sky-500/25 px-2 py-0.5 text-[10px] font-semibold text-sky-300"
              >
                Nét & Màu (Lineart)
              </span>
            );
          }
          if (t === 'Final') {
            return (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-semibold text-emerald-300"
              >
                Hoàn thiện (Final)
              </span>
            );
          }
          return (
            <span
              key={t}
              className="inline-flex items-center rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-300"
            >
              {t}
            </span>
          );
        })}
      </div>
    );
  };

  const presetsByStage = useMemo(() => {
    return {
      Sketch: presets.filter((p) => p.allowedMilestone === 'Sketch'),
      Lineart: presets.filter((p) => p.allowedMilestone === 'Lineart'),
      Final: presets.filter((p) => p.allowedMilestone === 'Final' || p.allowedMilestone === 'Any'),
    };
  }, [presets]);

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-[#10121d] px-3.5 py-2.5 text-xs text-white placeholder-slate-400/70 outline-none focus:ring-2 focus:ring-[#A7ACD9]/30 focus:border-[#A7ACD9] transition';
  const labelClass = 'block text-[11px] font-semibold text-slate-300 mb-1';

  return (
    <div className="space-y-6 text-[#E4E1E5]">
      {/* 1. Header Overview & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#141724]/90 p-4.5 sm:px-6">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#A7ACD9]" />
            Quản lý Phụ phí Dịch vụ (Add-ons)
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Thêm các tùy chọn vẽ thêm (thêm nhân vật, vũ khí, giao gấp, bản quyền) để khách hàng chọn khi đặt commission.
          </p>
        </div>

        {/* Stats Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#10121d] px-3.5 py-2 text-xs">
            <span className="text-slate-400">Tổng phụ phí:</span>
            <span className="font-bold text-white">{items.length}</span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              {activeCount} đang bật
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main 2-Column Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List of Add-ons (7 cols) */}
        <section className="lg:col-span-7 space-y-4">
          {/* List Toolbar & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Tìm phụ phí theo tên..."
                className="w-full rounded-xl border border-white/10 bg-[#141724] pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-[#A7ACD9] transition"
              />
              {listSearch && (
                <button
                  type="button"
                  onClick={() => setListSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Status Segmented Filter */}
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#141724] p-1 text-xs">
              {(['All', 'Active', 'Inactive'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setListFilterStatus(status)}
                  className={`rounded-lg px-2.5 py-1 font-medium transition ${
                    listFilterStatus === status
                      ? 'bg-[#A7ACD9] text-[#1F2335] font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {status === 'All' ? 'Tất cả' : status === 'Active' ? 'Đang bật' : 'Tạm tắt'}
                </button>
              ))}
            </div>
          </div>

          {/* Stage Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'All', label: 'Tất cả mốc' },
              { id: 'Sketch', label: 'Phác thảo' },
              { id: 'Lineart', label: 'Nét & Màu' },
              { id: 'Final', label: 'Hoàn thiện' },
              { id: 'Any', label: 'Toàn bộ quy trình' },
            ].map(({ id, label }) => {
              const isActive = listFilterStage === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setListFilterStage(id as StageCategory)}
                  className={`rounded-xl px-3 py-1.5 font-medium whitespace-nowrap transition ${
                    isActive
                      ? 'bg-white/15 text-white font-bold border border-white/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Items Container */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="rounded-2xl border border-white/5 bg-[#141724]/50 p-4 space-y-3 animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-40 bg-white/10 rounded-md" />
                    <div className="h-4 w-20 bg-white/10 rounded-md" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-24 bg-white/5 rounded-md" />
                    <div className="h-5 w-28 bg-white/5 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#141724]/40 p-10 text-center space-y-2">
              <Layers className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-300">
                {items.length === 0
                  ? 'Chưa có phụ phí nào trong danh sách'
                  : 'Không tìm thấy phụ phí nào phù hợp với bộ lọc'}
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                {items.length === 0
                  ? 'Chọn mẫu gợi ý bên phải hoặc điền form để tạo phụ phí đầu tiên của bạn.'
                  : 'Hãy thử xóa bộ lọc hoặc từ khóa tìm kiếm để xem toàn bộ phụ phí.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredItems.map((item) => {
                const pkg = packages.find((p) => p.id === item.packageId);
                const isCurrentEditing = editingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border transition p-4 ${
                      isCurrentEditing
                        ? 'border-[#A7ACD9] border-l-4 border-l-[#A7ACD9] bg-[#1a1e32] shadow-lg ring-1 ring-[#A7ACD9]'
                        : item.isActive
                        ? 'border-white/10 bg-[#141724]/80 hover:border-white/20'
                        : 'border-white/5 bg-[#10121d]/50 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Addon Info */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm text-white truncate">{item.title}</h3>
                          {item.presetKey && (
                            <span className="rounded bg-[#A7ACD9]/15 border border-[#A7ACD9]/25 px-1.5 py-0.5 text-[10px] font-semibold text-[#A7ACD9]">
                              Mẫu chuẩn
                            </span>
                          )}
                          {!item.isActive && (
                            <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                              Tạm tắt
                            </span>
                          )}
                        </div>

                        {/* Badges Row */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {stageBadge(item.allowedMilestone)}

                          <span className="inline-flex items-center gap-1 rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-slate-300">
                            <Package className="h-3 w-3 text-slate-400" />
                            {pkg ? pkg.name : 'Áp dụng mọi gói'}
                          </span>

                          {item.extendDays > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                              <Clock className="h-3 w-3" />
                              +{item.extendDays} ngày
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                              <Clock className="h-3 w-3 text-slate-500" />
                              Không tăng deadline
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Price & Quick Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3.5 border-t sm:border-t-0 border-white/5 pt-2.5 sm:pt-0 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider">Đơn giá</span>
                          <span className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
                            {item.price.toLocaleString('vi-VN')} ₫
                          </span>
                        </div>

                        {/* Controls: Edit & Toggle */}
                        <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            title="Chỉnh sửa phụ phí này"
                            className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-[#A7ACD9]" />
                            <span className="hidden sm:inline">Sửa</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleItemActive(item)}
                            title={item.isActive ? 'Bấm để tắt phụ phí' : 'Bấm để bật phụ phí'}
                            className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${
                              item.isActive
                                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                                : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                            }`}
                          >
                            {item.isActive ? (
                              <>
                                <ToggleRight className="h-4 w-4 text-emerald-400" />
                                <span className="text-[11px]">Đang bật</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="h-4 w-4 text-slate-400" />
                                <span className="text-[11px]">Tạm tắt</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column: Add/Edit Studio & Presets (5 cols) */}
        <aside id="addon-form-panel" className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
          <div className="rounded-2xl border border-white/10 bg-[#141724]/95 backdrop-blur-md p-5 space-y-5 shadow-xl">
            {/* Header of Form Panel */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-xl bg-[#A7ACD9]/15 flex items-center justify-center text-[#A7ACD9]">
                  {editingId ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    {editingId ? 'Chỉnh sửa phụ phí' : 'Thêm phụ phí mới'}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {editingId ? 'Cập nhật giá hoặc mốc áp dụng' : 'Tạo tùy chọn thanh toán thêm cho đơn'}
                  </span>
                </div>
              </div>

              {(editingId || presetKey || title || price) && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-1 text-[11px] text-[#A7ACD9] hover:underline"
                >
                  <RefreshCw className="h-3 w-3" /> Làm mới
                </button>
              )}
            </div>

            {/* Presets Quick Picker Accordion */}
            <div className="rounded-xl border border-white/10 bg-[#10121d] p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#A7ACD9]" /> Mẫu gợi ý theo quy trình:
                </span>
                {presetKey && (
                  <span className="text-[10px] text-amber-300 font-mono">Đã chọn mẫu</span>
                )}
              </div>

              {/* Sub-tabs for presets */}
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-white/5 p-1 text-center text-[11px]">
                <button
                  type="button"
                  onClick={() => setPresetTab('Sketch')}
                  className={`rounded-md py-1 font-semibold transition ${
                    presetTab === 'Sketch'
                      ? 'bg-[#A7ACD9] text-[#1F2335] shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Phác thảo ({presetsByStage.Sketch.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPresetTab('Lineart')}
                  className={`rounded-md py-1 font-semibold transition ${
                    presetTab === 'Lineart'
                      ? 'bg-[#A7ACD9] text-[#1F2335] shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Lineart ({presetsByStage.Lineart.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPresetTab('Final')}
                  className={`rounded-md py-1 font-semibold transition ${
                    presetTab === 'Final'
                      ? 'bg-[#A7ACD9] text-[#1F2335] shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Hoàn thiện ({presetsByStage.Final.length})
                </button>
              </div>

              {/* Preset Chips */}
              <div className="grid grid-cols-1 gap-1.5 pt-1">
                {presetsByStage[presetTab].map((p) => {
                  const isSelected = presetKey === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      disabled={busy}
                      onClick={() => handleSelectPreset(p)}
                      className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition ${
                        isSelected
                          ? 'bg-[#A7ACD9] text-[#1F2335] font-bold shadow'
                          : 'bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      <span className="truncate">{p.title}</span>
                      <span
                        className={`text-[10px] shrink-0 font-mono ${
                          isSelected ? 'text-[#1F2335] font-bold' : 'text-[#A7ACD9]'
                        }`}
                      >
                        {isSelected ? <Check className="h-3 w-3 stroke-[3]" /> : '+ Áp dụng'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tên phụ phí */}
              <div>
                <label className={labelClass}>Tên phụ phí</label>
                <input
                  className={inputClass}
                  value={title}
                  disabled={!!presetKey || busy}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Thêm nhân vật, Vũ khí lớn, Vẽ gấp..."
                  required
                  maxLength={200}
                />
                {presetKey && (
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    * Đang áp dụng tên chuẩn từ mẫu sàn.
                  </span>
                )}
              </div>

              {/* Mốc áp dụng */}
              <div>
                <label className={labelClass}>Mốc tiến độ áp dụng</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'Sketch', label: 'Phác thảo (Sketch)' },
                    { id: 'Lineart', label: 'Nét & Màu (Lineart)' },
                    { id: 'Final', label: 'Hoàn thiện (Final)' },
                    { id: 'Any', label: 'Mọi mốc (Toàn bộ)' },
                  ].map(({ id, label }) => {
                    const isChecked = stage.split(',').includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        disabled={!!presetKey || busy}
                        onClick={() => {
                          if (id === 'Any') {
                            setStage(isChecked ? '' : 'Any');
                          } else {
                            const selected = stage.split(',').filter((s) => s !== 'Any' && s !== id);
                            if (!isChecked) selected.push(id);
                            setStage(
                              ['Sketch', 'Lineart', 'Final']
                                .filter((s) => selected.includes(s))
                                .join(',')
                            );
                          }
                        }}
                        className={`rounded-xl px-2.5 py-2 text-left text-xs transition flex items-center justify-between ${
                          isChecked
                            ? 'bg-[#A7ACD9] text-[#1F2335] font-bold shadow'
                            : 'bg-[#10121d] border border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span className="truncate">{label}</span>
                        {isChecked && <Check className="h-3 w-3 stroke-[3] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price & Days Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Đơn giá */}
                <div>
                  <label className={labelClass}>Đơn giá (VND)</label>
                  <div className="relative">
                    <input
                      className={inputClass}
                      type="number"
                      min={1}
                      step={1000}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="100000"
                      required
                      disabled={busy}
                    />
                    <span className="absolute right-3 top-2.5 text-[11px] font-bold text-slate-500">₫</span>
                  </div>

                  {/* Quick price chips */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {[50000, 100000, 200000, 500000].map((quickPrice) => {
                      const isSelected = price === quickPrice.toString();
                      return (
                        <button
                          key={quickPrice}
                          type="button"
                          onClick={() => setPrice(quickPrice.toString())}
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-medium transition ${
                            isSelected
                              ? 'bg-[#A7ACD9] text-[#1F2335] font-bold shadow'
                              : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {quickPrice >= 1000000
                            ? `${quickPrice / 1000000}Tr`
                            : `${quickPrice / 1000}k`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Gia hạn deadline */}
                <div>
                  <label className={labelClass}>Gia hạn thêm</label>
                  <div className="relative">
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      max={365}
                      step={1}
                      value={days}
                      onChange={(e) => setDays(e.target.value)}
                      required
                      disabled={busy}
                    />
                    <span className="absolute right-3 top-2.5 text-[11px] text-slate-500">ngày</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">0 = Không đổi deadline</span>
                </div>
              </div>

              {/* Gói dịch vụ */}
              <div>
                <label className={labelClass}>Gắn vào gói dịch vụ</label>
                <select
                  className={inputClass}
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  disabled={busy}
                >
                  <option value="">Tất cả gói dịch vụ</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2 flex items-center gap-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition"
                  >
                    Hủy sửa
                  </button>
                )}
                <button
                  type="submit"
                  disabled={busy || !profileId}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#A7ACD9] py-2.5 text-xs font-bold text-[#1F2335] shadow hover:bg-[#b8bde4] disabled:opacity-50 transition"
                >
                  {editingId ? (
                    <>
                      <Check className="h-4 w-4 stroke-[2.5]" />
                      {busy ? 'Đang lưu…' : 'Cập nhật phụ phí'}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 stroke-[2.5]" />
                      {busy ? 'Đang lưu…' : 'Lưu vào danh sách'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
