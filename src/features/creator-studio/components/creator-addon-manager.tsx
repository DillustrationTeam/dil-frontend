'use client';

import { useEffect, useState } from 'react';
import { Layers, Plus, RotateCcw, Sparkles } from 'lucide-react';
import {
  addonService,
  addonSchema,
  addonMoney,
  type CreatorAddon,
  type AddonPreset,
  type AddonStage,
} from '@/services/addon.service';
import { creatorProfileService } from '../services/creator-profile.service';
import { extractErrorMessage } from '@/lib/api-client';
import type { RateCardPackage } from '../services/creator-rate-card.service';

const inputClass =
  'w-full rounded-xl border border-white/10 bg-[#171a2a] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#A7ACD9] transition';
const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-[#A7ACD9] mb-1.5';

export function CreatorAddonManager({ packages }: { packages: RateCardPackage[] }) {
  const [items, setItems] = useState<CreatorAddon[]>([]);
  const [presets, setPresets] = useState<AddonPreset[]>([]);
  const [profileId, setProfileId] = useState('');
  const [editing, setEditing] = useState<string>();
  const [presetKey, setPresetKey] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [stage, setStage] = useState<AddonStage>('Sketch');
  const [days, setDays] = useState('0');
  const [packageId, setPackageId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
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
        if (active) setError(extractErrorMessage(e, 'Không tải được phụ phí.'));
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const reset = () => {
    setEditing(undefined);
    setPresetKey(null);
    setTitle('');
    setPrice('');
    setDays('0');
    setPackageId('');
    setStage('Sketch');
  };

  const handleSelectPreset = (p: AddonPreset, checked: boolean) => {
    reset();
    if (checked) {
      setPresetKey(p.key);
      setTitle(p.title);
      setStage(p.allowedMilestone);
    }
  };

  const handleEdit = (item: CreatorAddon) => {
    setEditing(item.id);
    setPresetKey(item.presetKey ?? null);
    setTitle(item.title);
    setPrice(String(item.price));
    setStage(item.allowedMilestone);
    setDays(String(item.extendDays));
    setPackageId(item.packageId ?? '');
    setError('');
    setNotice('');
  };

  const handleToggleActive = async (item: CreatorAddon) => {
    setBusy(true);
    setError('');
    try {
      await addonService.save({
        ...item,
        presetKey: item.presetKey,
        isActive: !item.isActive,
      });
      setItems(await addonService.creator(profileId));
    } catch (cause) {
      setError(extractErrorMessage(cause, 'Không cập nhật được trạng thái phụ phí.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="glass-container space-y-6 rounded-[28px] p-6 sm:p-7 text-[#E4E1E5]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="rounded-xl bg-[#A7ACD9]/20 p-2 text-[#A7ACD9]">
              <Layers className="h-5 w-5" />
            </span>
            <h2 className="font-h1 text-lg font-bold text-white">Phụ phí theo cột mốc (Add-ons)</h2>
          </div>
          <p className="mt-1 text-xs text-[#A7ACD9]">
            Chọn mẫu gợi ý của sàn hoặc tạo phụ phí tùy chỉnh. Lưu bảng giá trước khi gắn phụ phí vào gói mới.
          </p>
        </div>
        <span className="self-start sm:self-auto text-xs text-[#919099] bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
          Ký quỹ mốc tự động
        </span>
      </div>

      {/* Preset Catalog */}
      {presets.length > 0 && (
        <div className="space-y-2.5">
          <label className={labelClass}>Gợi ý phụ phí phổ biến sàn hỗ trợ</label>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {presets.map((p) => {
              const isSelected = presetKey === p.key;
              return (
                <label
                  key={p.key}
                  className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs cursor-pointer transition ${
                    isSelected
                      ? 'border-[#A7ACD9] bg-[#A7ACD9]/10 text-white'
                      : 'border-white/10 bg-[#171a2a] text-[#C7C5CF] hover:border-white/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={busy}
                    onChange={(e) => handleSelectPreset(p, e.target.checked)}
                    className="mt-0.5 rounded text-[#A7ACD9] focus:ring-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-white truncate">{p.title}</div>
                    <div className="text-[11px] text-[#919099] mt-0.5">
                      Mốc: <span className="text-[#A7ACD9]">{p.allowedMilestone}</span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Add / Edit Form */}
      <form
        className="rounded-2xl border border-white/10 bg-[#141724]/70 p-5 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError('');
          setNotice('');
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
              id: editing,
              presetKey,
              packageId: packageId || null,
              isActive: items.find((item) => item.id === editing)?.isActive ?? true,
            });
            setItems(await addonService.creator(profileId));
            reset();
            setNotice(editing ? 'Đã cập nhật phụ phí thành công.' : 'Đã thêm phụ phí mới thành công.');
          } catch (cause) {
            setError(extractErrorMessage(cause, 'Không lưu được phụ phí.'));
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#A7ACD9]">
            {editing ? `Chỉnh sửa phụ phí: ${title}` : 'Thêm phụ phí mới'}
          </span>
          {editing && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 text-xs text-[#919099] hover:text-white"
            >
              <RotateCcw className="h-3 w-3" /> Hủy chỉnh sửa
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={labelClass}>
              Tên phụ phí <span className="text-rose-400">*</span>
            </label>
            <input
              className={inputClass}
              value={title}
              disabled={!!presetKey || busy}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Thêm nhân vật phụ"
              required
              maxLength={200}
            />
          </div>

          <div>
            <label className={labelClass}>
              Giá phụ phí (VND) <span className="text-rose-400">*</span>
            </label>
            <input
              className={inputClass}
              type="number"
              min={1000}
              step={1000}
              placeholder="Ví dụ: 150000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              disabled={busy}
            />
          </div>

          <div>
            <label className={labelClass}>Mốc áp dụng</label>
            <select
              className={inputClass}
              value={stage}
              disabled={!!presetKey || busy}
              onChange={(e) => setStage(e.target.value as AddonStage)}
            >
              <option value="Sketch">Sketch (Mốc 1: Bố cục & Phác thảo)</option>
              <option value="Lineart">Lineart (Mốc giữa: Đi nét / Màu)</option>
              <option value="Final">Final (Mốc cuối: Hoàn thiện / Bản quyền)</option>
              <option value="Sketch,Lineart">Sketch & Lineart (Mốc 1 & Mốc giữa)</option>
              <option value="Lineart,Final">Lineart & Final (Mốc giữa & Mốc cuối)</option>
              <option value="Any">Any (Bất kỳ mốc nào)</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Gia hạn thời gian (ngày)</label>
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
          </div>

          <div>
            <label className={labelClass}>Gói dịch vụ áp dụng</label>
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

          <div className="flex items-end gap-2.5">
            <button
              type="submit"
              disabled={busy || !profileId}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#A7ACD9] px-4 py-2.5 text-xs font-bold text-[#1F2335] hover:bg-[#b8bdf3] transition disabled:opacity-50"
            >
              {busy ? (
                'Đang lưu…'
              ) : editing ? (
                'Cập nhật phụ phí'
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" /> Thêm phụ phí
                </>
              )}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-xl border border-white/10 px-3 py-2.5 text-xs text-[#919099] hover:bg-white/5 hover:text-white transition"
            >
              Đặt lại
            </button>
          </div>
        </div>
      </form>

      {/* Configured Addon List */}
      <div className="space-y-2.5">
        <label className={labelClass}>Danh sách phụ phí đang cấu hình ({items.length})</label>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-[#919099]">
            Chưa có phụ phí nào. Bạn có thể chọn mẫu gợi ý phía trên hoặc tạo mới bằng form.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#171a2a] p-4 text-xs transition hover:border-white/20"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      item.isActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-500'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-semibold text-white">{item.title}</strong>
                      <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-[#A7ACD9] border border-white/10">
                        {item.allowedMilestone}
                      </span>
                      {item.packageId && (
                        <span className="text-[10px] text-[#919099]">
                          (Gói: {packages.find((p) => p.id === item.packageId)?.name ?? 'Gói riêng'})
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#919099] mt-0.5">
                      +{addonMoney(item.price)}
                      {item.extendDays > 0 ? ` · Gia hạn +${item.extendDays} ngày` : ' · Không gia hạn'}
                      {!item.isActive && ' · (Đang tạm tắt)'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleEdit(item)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/5 transition"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleToggleActive(item)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      item.isActive
                        ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                        : 'bg-white/5 text-[#919099] hover:bg-white/10'
                    }`}
                  >
                    {item.isActive ? 'Đang bật' : 'Đã tắt'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
          {notice}
        </div>
      )}
    </section>
  );
}
