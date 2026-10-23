'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, Download, FolderOpen, Pencil, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '@/lib/api-error';
import { creatorProfileService } from '../services/creator-profile.service';
import type { CreatorAssetDto } from '../types/creator-profile.types';
import { assetDetails, assetMessage, assetSchema, type AssetDraft } from '../utils/creator-assets';

const types = [['Pose', 'Pose mẫu'], ['Palette', 'Bảng màu'], ['Preset', 'Presets']] as const;
const fieldClass = 'w-full rounded-xl border border-white/15 bg-[#171b2a] p-3 text-sm text-white';

function AssetPreview({ asset }: { asset: CreatorAssetDto }) {
  const { colors, notes } = assetDetails(asset);
  if (asset.assetType === 'Palette') return <div className="flex h-36 overflow-hidden rounded-xl bg-white/5">
    {colors.length ? colors.map((color, i) => <button type="button" key={`${color}-${i}`} style={{ backgroundColor: color }}
      title={`Sao chép ${color}`} aria-label={`Sao chép ${color}`} className="min-w-0 flex-1"
      onClick={() => void copyText(color)} />) : <span className="m-auto text-xs text-[#C7C5CF]">Chưa có màu — chọn sửa để bổ sung</span>}
  </div>;
  if (asset.assetUrl) return <a href={asset.assetUrl} target="_blank" rel="noopener noreferrer" className="relative block h-36 overflow-hidden rounded-xl bg-white/5">
    <Image src={asset.assetUrl} alt={asset.name} fill unoptimized className="object-contain" />
  </a>;
  return <p className="h-36 overflow-auto whitespace-pre-wrap rounded-xl bg-white/5 p-4 text-sm text-[#C7C5CF]">{notes || 'Chưa có nội dung — chọn sửa để bổ sung'}</p>;
}

async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); toast.success('Đã sao chép.'); }
  catch { toast.error('Không thể truy cập clipboard. Bạn có thể chọn và sao chép nội dung trực tiếp.'); }
}

function AssetEditor({ asset, type, onClose, onSaved }: {
  asset: CreatorAssetDto | null; type: AssetDraft['assetType']; onClose: () => void; onSaved: (asset: CreatorAssetDto) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const details = asset ? assetDetails(asset) : { colors: ['#A7ACD9', '#1F2335'], notes: '' };
  const { register, control, setValue, handleSubmit, formState: { errors, isSubmitting } } = useForm<AssetDraft>({
    resolver: zodResolver(assetSchema), defaultValues: {
      assetType: type, name: asset?.name || '', assetUrl: asset?.assetUrl || '', notes: details.notes,
      colors: type === 'Palette' ? details.colors : [],
    },
  });
  const colors = useWatch({ control, name: 'colors' });
  const assetUrl = useWatch({ control, name: 'assetUrl' });
  const busy = uploading || isSubmitting;
  useEffect(() => { dialog.current?.showModal(); }, []);

  const save = handleSubmit(async value => {
    setError('');
    try {
      const request = { assetType: value.assetType, name: value.name, assetUrl: value.assetUrl,
        metadataJson: JSON.stringify({ notes: value.notes, ...(type === 'Palette' ? { colors: value.colors.map(c => c.toUpperCase()) } : {}) }) };
      const result = asset ? await creatorProfileService.updateAsset(asset.id, request) : await creatorProfileService.saveAsset(request);
      onSaved(result);
      toast.success(asset ? 'Đã cập nhật tài nguyên.' : 'Đã lưu tài nguyên.');
    } catch (err) { setError(getApiErrorMessage(err, 'Không thể lưu tài nguyên.')); }
  });

  return <dialog ref={dialog} onCancel={event => { if (busy) event.preventDefault(); else onClose(); }}
    aria-labelledby="asset-editor-title" className="m-auto max-h-[90vh] w-[min(94vw,620px)] overflow-y-auto rounded-3xl border border-white/15 bg-[#1F2335] p-6 text-white backdrop:bg-black/70">
    <div className="mb-5 flex items-center justify-between"><h2 id="asset-editor-title" className="font-h1 text-lg">{asset ? 'Sửa' : 'Thêm'} {types.find(t => t[0] === type)?.[1]}</h2>
      <button type="button" aria-label="Đóng" disabled={busy} onClick={onClose}><X size={20} /></button></div>
    <form onSubmit={save} className="space-y-4">
      <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
        <label className="block space-y-2"><span>Tên tài nguyên</span><input {...register('name')} maxLength={120} className={fieldClass} autoFocus /></label>
        {errors.name && <p role="alert" className="text-sm text-rose-300">{errors.name.message}</p>}
        {type === 'Palette' ? <div className="space-y-3"><p>Màu sắc (2–16 màu)</p>
          {colors.map((color, index) => <div key={index} className="flex gap-2">
            <input type="color" aria-label={`Chọn màu ${index + 1}`} value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#000000'} onChange={e => setValue(`colors.${index}`, e.target.value, { shouldValidate: true })} className="h-11 w-14 bg-transparent" />
            <input aria-label={`Mã HEX màu ${index + 1}`} {...register(`colors.${index}`)} maxLength={7} className={fieldClass} />
            <button type="button" aria-label={`Xóa màu ${index + 1}`} disabled={colors.length <= 2} onClick={() => setValue('colors', colors.filter((_, i) => i !== index), { shouldValidate: true })}><Trash2 size={18} /></button>
          </div>)}
          <button type="button" disabled={colors.length >= 16} onClick={() => setValue('colors', [...colors, '#FFFFFF'], { shouldValidate: true })} className="text-sm text-[#A7ACD9]">+ Thêm màu</button>
          {errors.colors && <p role="alert" className="text-sm text-rose-300">{errors.colors.message || 'Kiểm tra mã màu, cần dạng #RRGGBB.'}</p>}
        </div> : <div className="space-y-3">
          <label className="block space-y-2"><span>Ảnh tham chiếu</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className={fieldClass} onChange={async e => {
            const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
            if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type) || file.size > 25 * 1024 * 1024) { setError('Chọn ảnh PNG, JPEG, WebP hoặc GIF tối đa 25 MB.'); return; }
            setUploading(true); setError('');
            try { setValue('assetUrl', await creatorProfileService.uploadArtworkImage(file), { shouldValidate: true }); }
            catch (err) { setError(getApiErrorMessage(err, 'Không thể tải ảnh.')); }
            finally { setUploading(false); }
          }} /></label>
          <p className="text-xs text-[#C7C5CF]">PNG, JPEG, WebP, GIF tối đa 25 MB. Ảnh được lưu bằng đường dẫn có thể chia sẻ.</p>
          <label className="block space-y-2"><span>Hoặc URL ảnh</span><input {...register('assetUrl')} className={fieldClass} placeholder="https://…" /></label>
          {errors.assetUrl && <p role="alert" className="text-sm text-rose-300">{errors.assetUrl.message}</p>}
          {assetUrl && /^https?:\/\//.test(assetUrl) && <div className="relative h-36"><Image src={assetUrl} alt="Ảnh tham chiếu" unoptimized fill className="object-contain" /></div>}
        </div>}
        <label className="block space-y-2"><span>{type === 'Preset' ? 'Hướng dẫn / thông số preset' : 'Ghi chú'}</span><textarea {...register('notes')} rows={4} maxLength={3000} className={fieldClass} placeholder={type === 'Preset' ? 'Ví dụ: Brush opacity 40%, Multiply 25%, các bước tô bóng…' : 'Mô tả cách dùng tài nguyên…'} /></label>
        {errors.notes && <p role="alert" className="text-sm text-rose-300">{errors.notes.message}</p>}
      </fieldset>
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      <div className="flex justify-end gap-3"><button type="button" disabled={busy} onClick={onClose} className="rounded-xl border border-white/15 px-4 py-2">Hủy</button>
        <button type="submit" disabled={busy} className="rounded-xl bg-[#A7ACD9] px-5 py-2 font-semibold text-[#1F2335] disabled:opacity-50">{busy ? 'Đang lưu…' : 'Lưu tài nguyên'}</button></div>
    </form>
  </dialog>;
}

export function CreatorAssetLibrary({ onSelect }: { onSelect?: (body: string) => void }) {
  const [type, setType] = useState<AssetDraft['assetType']>('Pose');
  const [assets, setAssets] = useState<CreatorAssetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [editor, setEditor] = useState<{ asset: CreatorAssetDto | null; type: AssetDraft['assetType'] } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    creatorProfileService.getAssets().then(value => { if (active) { setAssets(value); setError(''); } })
      .catch(err => { if (active) setError(getApiErrorMessage(err, 'Không thể tải thư viện.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);
  const visible = assets.filter(a => a.assetType === type);

  function download(asset: CreatorAssetDto) {
    const { colors, notes } = assetDetails(asset);
    const body = JSON.stringify({ name: asset.name, assetType: asset.assetType, assetUrl: asset.assetUrl, colors, notes }, null, 2);
    const url = URL.createObjectURL(new Blob([body], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${asset.name.replace(/[^\p{L}\p{N}_-]/gu, '_') || 'asset'}.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div className="space-y-5">
    <p className="text-sm text-[#C7C5CF]">Lưu pose tham chiếu, bảng màu và công thức preset để dùng lại. {onSelect ? 'Chọn tài nguyên để chèn vào tin nhắn; bấm Gửi khi bạn sẵn sàng.' : 'Trong Workroom, chọn Thư viện tài nguyên để chia sẻ với khách.'}</p>
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Loại tài nguyên">{types.map(([value, label]) => <button role="tab" aria-selected={type === value} key={value} onClick={() => { setType(value); setConfirmDelete(null); }} type="button"
      className={`rounded-full px-4 py-2 text-sm ${type === value ? 'bg-[#A7ACD9] text-[#1F2335]' : 'bg-white/5 text-[#C7C5CF]'}`}>{label} ({assets.filter(a => a.assetType === value).length})</button>)}</div>
    {loading ? <p role="status" className="text-[#C7C5CF]">Đang tải thư viện…</p> : error ? <div role="alert" className="text-rose-300">{error} <button onClick={() => { setLoading(true); setReload(n => n + 1); }} className="underline">Thử lại</button></div> : <>
      {!onSelect && <button onClick={() => setEditor({ asset: null, type })} type="button" className="flex items-center gap-2 rounded-xl border border-[#A7ACD9]/40 px-4 py-3 text-[#A7ACD9]"><Plus size={18} />Thêm {types.find(t => t[0] === type)?.[1]}</button>}
      {!visible.length && <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-[#C7C5CF]">Chưa có tài nguyên trong mục này. {onSelect ? 'Thêm tài nguyên trong Creator Studio.' : 'Tạo tài nguyên đầu tiên để sử dụng lại.'}</p>}
      <div className={`grid gap-4 ${onSelect ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>{visible.map(asset => <article key={asset.id} className="glass-container min-w-0 rounded-3xl border border-white/10 p-4">
        <AssetPreview asset={asset} />
        <h3 className="mt-4 break-words font-semibold text-white">{asset.name}</h3>
        <p className="mt-1 text-xs text-[#919099]">Đã tạo {new Date(asset.createdAt).toLocaleDateString('vi-VN')}</p>
        {asset.assetType === 'Palette' && <p className="mt-3 break-words text-xs text-[#C7C5CF]">{assetDetails(asset).colors.join(' · ')}</p>}
        {assetDetails(asset).notes && (asset.assetType === 'Palette' || asset.assetUrl) && <p className="mt-3 whitespace-pre-wrap break-words text-sm text-[#C7C5CF]">{assetDetails(asset).notes}</p>}
        <div className="mt-4 flex flex-wrap gap-2 text-sm text-[#A7ACD9]">
          {onSelect ? <button type="button" onClick={() => onSelect(assetMessage(asset))} className="rounded-lg bg-[#A7ACD9] px-3 py-2 text-[#1F2335]">Chèn vào tin nhắn</button> : <>
            <button type="button" title="Sửa tài nguyên" aria-label={`Sửa ${asset.name}`} onClick={() => setEditor({ asset, type })} className="rounded-lg bg-white/5 p-2"><Pencil size={16} /></button>
            <button type="button" title="Xuất tài nguyên JSON" aria-label={`Xuất ${asset.name}`} onClick={() => download(asset)} className="rounded-lg bg-white/5 p-2"><Download size={16} /></button>
            <button type="button" title="Xóa tài nguyên" aria-label={`Xóa ${asset.name}`} onClick={() => setConfirmDelete(asset.id)} className="rounded-lg bg-white/5 p-2 text-rose-300"><Trash2 size={16} /></button>
          </>}
          <button type="button" title="Sao chép nội dung" aria-label={`Sao chép ${asset.name}`} onClick={() => void copyText(assetMessage(asset))} className="rounded-lg bg-white/5 p-2"><Copy size={16} /></button>
          {asset.assetUrl && <a href={asset.assetUrl} target="_blank" rel="noopener noreferrer" aria-label={`Mở ${asset.name}`} title="Mở ảnh gốc" className="rounded-lg bg-white/5 p-2"><FolderOpen size={16} /></a>}
        </div>
        {confirmDelete === asset.id && <div className="mt-3 space-y-2 text-sm text-white"><p>Xóa tài nguyên này khỏi thư viện?</p><div className="flex gap-4">
          <button type="button" disabled={deleting === asset.id} className="text-rose-300" onClick={async () => {
            setDeleting(asset.id);
            try { await creatorProfileService.deleteAsset(asset.id); setAssets(current => current.filter(a => a.id !== asset.id)); setConfirmDelete(null); toast.success('Đã xóa tài nguyên.'); }
            catch (err) { toast.error(getApiErrorMessage(err, 'Không thể xóa tài nguyên.')); }
            finally { setDeleting(null); }
          }}>{deleting === asset.id ? 'Đang xóa…' : 'Xác nhận xóa'}</button><button type="button" disabled={deleting === asset.id} onClick={() => setConfirmDelete(null)}>Hủy</button></div></div>}
      </article>)}</div>
    </>}
    {editor && <AssetEditor asset={editor.asset} type={editor.type} onClose={() => setEditor(null)} onSaved={saved => {
      setAssets(current => [saved, ...current.filter(a => a.id !== saved.id)]); setEditor(null);
    }} />}
  </div>;
}

export function CreatorAssetPicker({ onSelect, onClose }: { onSelect: (body: string) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} onCancel={onClose} aria-labelledby="asset-picker-title" className="m-auto max-h-[85vh] w-[min(95vw,850px)] overflow-y-auto rounded-3xl border border-white/15 bg-[#1F2335] p-6 text-white backdrop:bg-black/70">
    <div className="mb-5 flex justify-between"><h2 id="asset-picker-title" className="font-h1 text-lg">Thư viện tài nguyên</h2><button onClick={onClose} aria-label="Đóng thư viện"><X size={20} /></button></div>
    <CreatorAssetLibrary onSelect={onSelect} />
  </dialog>;
}
