'use client';

import { ArtworkMetadataAssistant, ArtworkScanPanel } from '@/features/artwork-ai';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Bot,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  List,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { creatorProfileService } from '../services/creator-profile.service';
import { commissionService } from '@/services/commission.service';
import type { Commission, CommissionStatus } from '@/types/commission.types';
import { CreatorAssetLibrary } from './creator-asset-library';
import { CreatorRateCardManager } from './creator-rate-card-manager';
import type {
  ArtworkDto,
  CreatorWorkstationState,
} from '../types/creator-profile.types';

export type WorkstationView = 'artworks' | 'services' | 'terms' | 'ai-rules' | 'waitlist' | 'assets';

type Service = { id: number; name: string; price: string; days: string; active: boolean };

type FaqDraft = { q: string; a: string };

const titles: Record<WorkstationView, [string, string]> = {
  artworks: ['Đăng tải & quản lý tác phẩm', 'Xây dựng portfolio với thiết lập AI hỗ trợ.'],
  services: ['Bảng giá & dịch vụ', 'Thiết lập gói commission và số slot nhận đơn.'],
  terms: ['Điều khoản & bản quyền', 'Cài đặt chính sách phù hợp với cách làm việc của bạn.'],
  'ai-rules': ['AI Auto-reply & rules', 'Tự động phản hồi brief và câu hỏi thường gặp.'],
  waitlist: ['Quản lý hàng chờ', 'Theo dõi mọi commission theo từng giai đoạn.'],
  assets: ['Thư viện asset & presets', 'Tổ chức pose mẫu, palette và preset cá nhân.'],
};

const defaultState: CreatorWorkstationState = {
  terms: { commercialLicenseMultiplier: 1.5, revisionPolicy: '02 lần chỉnh sửa miễn phí trong giai đoạn sketch.', cancellationPolicy: 'Hoàn tiền theo tiến độ hoàn thành. Phí hủy có thể áp dụng sau khi duyệt sketch.' },
  autoReply: { isEnabled: true, briefTemplate: 'Cảm ơn bạn đã gửi brief! Mình đã nhận được thông tin và sẽ phản hồi trong vòng 24 giờ.' },
  faqs: [
    { id: 'faq-1', question: 'Bạn nhận commission không?', answer: 'Mình đang nhận commission theo số slot hiển thị trên profile.', displayOrder: 1 },
    { id: 'faq-2', question: 'Thời gian hoàn thành?', answer: 'Tùy gói dịch vụ, thường từ 3–7 ngày.', displayOrder: 2 },
  ],
  workItems: [],
  assets: [],
};

function Shell({ view, children }: { view: WorkstationView; children: React.ReactNode }) {
  const [title, subtitle] = titles[view];

  return (
    <div className="w-full space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#A7ACD9]">Creator studio</p>
          <h1 className="mt-2 font-h1 text-2xl font-bold text-white sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-[#C7C5CF]">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="mt-5 flex cursor-pointer items-center justify-between gap-3">
      <span>
        <span className="block text-sm text-white">{label}</span>
        <span className="mt-1 block text-xs text-[#919099]">{description}</span>
      </span>
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" className="h-5 w-9 accent-[#A7ACD9]" />
    </label>
  );
}

function LicenseRow({ title, detail, value }: { title: string; detail: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
      <div className="flex justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="mt-1 text-xs text-[#C7C5CF]">{detail}</p>
        </div>
        <strong className="text-sm text-[#A7ACD9]">{value}</strong>
      </div>
    </div>
  );
}

function Artworks() {
  const inputRef = useRef<HTMLInputElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [profileReady, setProfileReady] = useState(false);
  const [artworks, setArtworks] = useState<ArtworkDto[]>([]);
  const [artworkSearch, setArtworkSearch] = useState('');
  const [artworkStatus, setArtworkStatus] = useState('All');
  const [editingArtwork, setEditingArtwork] = useState<ArtworkDto | null>(null);
  const [editingImageFile, setEditingImageFile] = useState<File | null>(null);
  const [editingImagePreview, setEditingImagePreview] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingArtwork, setDeletingArtwork] = useState<ArtworkDto | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState('');
  const [loadingArtworks, setLoadingArtworks] = useState(true);
  const [scanNotices, setScanNotices] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadProfile = async () => {
      try {
        await creatorProfileService.getMyProfile();
        setProfileReady(true);
      } catch {
        setError('Không thể tải hồ sơ creator. Vui lòng hoàn tất hồ sơ và tải lại trang.');
      }
    };

    void loadProfile();
  }, []);

  useEffect(() => {
    let active = true;
    creatorProfileService.getMyArtworks(artworkSearch, artworkStatus === 'All' ? undefined : artworkStatus)
      .then((items) => { if (active) setArtworks(items); })
      .catch((cause) => { if (active) toast.error(cause instanceof Error ? cause.message : 'Không thể tải portfolio.'); })
      .finally(() => { if (active) setLoadingArtworks(false); });
    return () => { active = false; };
  }, [artworkSearch, artworkStatus]);

  useEffect(() => () => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => () => {
    if (editingImagePreview?.startsWith('blob:')) URL.revokeObjectURL(editingImagePreview);
  }, [editingImagePreview]);

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.size <= 25 * 1024 * 1024 && ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
      setSaved(false);
    } else if (file) {
      setError('Ảnh phải là JPEG, PNG, WEBP hoặc GIF và không vượt quá 25 MB.');
    }
  };

  const addTag = () => {
    const value = tag.trim();
    if (value.length > 50 || tags.length >= 10) {
      setError('Tối đa 10 tag, mỗi tag không quá 50 ký tự.');
      return;
    }
    if (value && !tags.some((item) => item.toLocaleLowerCase() === value.toLocaleLowerCase())) {
      setTags((current) => [...current, value]);
    }
    setTag('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (uploading || !profileReady) return;

    if (!title.trim() || !imageFile) {
      setError('Vui lòng chọn ảnh và nhập tiêu đề tác phẩm.');
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await creatorProfileService.uploadArtworkImage(imageFile);
      const uploaded = await creatorProfileService.uploadArtwork({
        title: title.trim(),
        description,
        imageUrl,
        thumbnailUrl: imageUrl,
        isAiGenerated,
        tags,
      });
      setError('');
      setSaved(true);
      setScanNotices(current => ({ ...current, [uploaded.id]: uploaded.imageUrl }));
      setArtworkSearch('');
      setArtworkStatus('All');
      setArtworks(current => [uploaded, ...current.filter(item => item.id !== uploaded.id)]);
      setImageFile(null);
      setPreview(null);
      setTitle('');
      setDescription('');
      setTags([]);
      toast.success(`Đã lưu ${uploaded.title}. Theo dõi kiểm tra AI trong portfolio bên dưới.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu tác phẩm.');
      toast.error(err instanceof Error ? err.message : 'Không thể lưu tác phẩm.');
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (artwork: ArtworkDto) => {
    setEditingArtwork(artwork);
    setEditingImageFile(null);
    setEditingImagePreview(artwork.thumbnailUrl || artwork.imageUrl);
    setEditTitle(artwork.title);
    setEditDescription(artwork.description ?? '');
    setEditTags(artwork.tags.join(', '));
  };

  const chooseEditImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Ảnh phải là JPEG, PNG, WEBP hoặc GIF và không vượt quá 25 MB.');
      event.target.value = '';
      return;
    }
    if (editingImagePreview?.startsWith('blob:')) URL.revokeObjectURL(editingImagePreview);
    setEditingImageFile(file);
    setEditingImagePreview(URL.createObjectURL(file));
  };

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingArtwork) return;
    setSavingEdit(true);
    try {
      const imageUrl = editingImageFile
        ? await creatorProfileService.uploadArtworkImage(editingImageFile)
        : undefined;
      await creatorProfileService.updateArtwork(editingArtwork.id, {
        title: editTitle,
        description: editDescription,
        tags: editTags.split(',').map((value) => value.trim()).filter(Boolean),
        ...(imageUrl ? { imageUrl, thumbnailUrl: imageUrl } : {}),
      });
      if (imageUrl) setScanNotices(current => ({ ...current, [editingArtwork.id]: imageUrl }));
      setArtworks(await creatorProfileService.getMyArtworks(artworkSearch, artworkStatus === 'All' ? undefined : artworkStatus));
      setEditingArtwork(null);
      setEditingImageFile(null);
      setEditingImagePreview(null);
      toast.success('Đã cập nhật tác phẩm.');
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Không thể cập nhật tác phẩm.');
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDeleteArtwork = async () => {
    if (!deletingArtwork || deleteBusy) return;
    setDeleteBusy(true);
    try {
      await creatorProfileService.deleteArtwork(deletingArtwork.id);
      setArtworks((current) => current.filter((artwork) => artwork.id !== deletingArtwork.id));
      if (editingArtwork?.id === deletingArtwork.id) setEditingArtwork(null);
      setDeletingArtwork(null);
      toast.success('Đã xóa tác phẩm khỏi portfolio.');
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Không thể xóa tác phẩm.');
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <Shell view="artworks">
      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="glass-container rounded-[28px] p-5 sm:p-7">
          <button type="button" onClick={() => inputRef.current?.click()} className="relative flex min-h-72 w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-white/25 bg-white/[.025] p-6 transition hover:border-[#A7ACD9]/70">
            {preview ? (
              <Image src={preview} alt="Artwork preview" fill unoptimized className="object-contain" />
            ) : (
              <>
                <span className="rounded-2xl bg-[#A7ACD9]/15 p-4"><Upload className="h-7 w-7 text-[#A7ACD9]" /></span>
                <strong className="mt-4 text-sm text-white">Tải file tác phẩm gốc</strong>
                <span className="mt-1 text-xs text-[#919099]">PNG, JPG, WEBP · tối đa 25 MB</span>
              </>
            )}
            <input ref={inputRef} onChange={chooseFile} type="file" accept="image/*" className="hidden" />
          </button>

          <div className="mt-6 grid gap-5">
            <label className="text-sm text-[#C7C5CF]">
              Tiêu đề tác phẩm
              <input maxLength={200} required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Violet afternoon" className="mt-2 w-full rounded-2xl border border-white/10 bg-[#171a2a] px-4 py-3 text-white outline-none focus:border-[#A7ACD9]" />
            </label>

            <ArtworkMetadataAssistant file={imageFile} onApply={value => { setTitle(value.title); setDescription(value.description); setTags(value.tags); }} />

            <label className="text-sm text-[#C7C5CF]">
              Mô tả
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Chia sẻ cảm hứng hoặc câu chuyện phía sau tác phẩm..." className="mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-[#171a2a] px-4 py-3 text-white outline-none focus:border-[#A7ACD9]" />
            </label>

            <div>
              <p className="text-sm text-[#C7C5CF]">Tags</p>
              <div className="mt-2 flex gap-2">
                <input value={tag} onChange={(event) => setTag(event.target.value)} onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addTag();
                  }
                }} placeholder="Nhập tag và Enter" className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#171a2a] px-4 py-3 text-sm outline-none focus:border-[#A7ACD9]" />
                <button type="button" onClick={addTag} className="rounded-2xl bg-white/10 px-4 text-[#A7ACD9]">+</button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTags((current) => current.filter((tagItem) => tagItem !== item))}
                    className="rounded-full bg-[#A7ACD9]/15 px-2 py-1 text-[11px] text-[#DDE0FF]"
                  >
                    #{item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside className="glass-container rounded-[28px] p-5">
          <h2 className="font-h1 text-lg font-semibold text-white">Thông tin xuất bản</h2>
          <Toggle label="Tác phẩm tạo bằng AI" description="Bật nếu bạn dùng AI để tạo hình ảnh này." checked={isAiGenerated} onChange={setIsAiGenerated} />
          <p className="mt-5 text-xs leading-5 text-[#919099]">Tác phẩm sẽ được kiểm duyệt trước khi xuất hiện công khai. Bạn có thể chỉnh sửa và theo dõi trạng thái trong portfolio bên dưới.</p>
          <p className="mt-3 rounded-xl border border-[#A7ACD9]/25 bg-[#A7ACD9]/5 p-3 text-xs leading-5 text-[#C7C5CF]">Sau khi bấm Lưu tác phẩm, hệ thống tự động kiểm tra ảnh AI. Tiến trình và điểm nghi ngờ sẽ hiện trên tác phẩm trong portfolio; chọn file thôi chưa bắt đầu quét.</p>

          <button type="submit" disabled={uploading || !profileReady} className="mt-6 w-full rounded-2xl bg-[#A7ACD9] px-5 py-3 text-sm font-bold text-[#1F2335] disabled:opacity-60">
            {uploading ? 'Đang tải lên...' : 'Lưu tác phẩm'}
          </button>

          {saved ? <p role="status" className="mt-3 flex items-center gap-2 text-sm text-[#BCE6B8]"><Check className="h-4 w-4 shrink-0" /> Đã lưu. Xem trạng thái kiểm tra AI trong portfolio bên dưới.</p> : null}
          {error ? <p className="mt-3 text-sm text-[#ff9aa2]">{error}</p> : null}
        </aside>
      </form>

      <section className="glass-container rounded-[28px] p-5 sm:p-7">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-h1 text-xl font-semibold text-white">Portfolio của bạn</h2>
            <p className="mt-1 text-sm text-[#C7C5CF]">{artworks.length} tác phẩm</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_170px]">
            <input value={artworkSearch} onChange={(event) => setArtworkSearch(event.target.value)} placeholder="Tìm tên, mô tả hoặc tag" className="rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2 text-sm text-white outline-none focus:border-[#A7ACD9]" />
            <select value={artworkStatus} onChange={(event) => setArtworkStatus(event.target.value)} className="rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2 text-sm text-white outline-none">
              <option value="All">Mọi trạng thái</option>
              <option value="Pending">Đang duyệt</option>
              <option value="Approved">Đã duyệt</option>
              <option value="Flagged">Bị gắn cờ</option>
              <option value="Rejected">Bị từ chối</option>
              <option value="Hidden">Đã ẩn</option>
            </select>
          </div>
        </div>
        {loadingArtworks ? <p className="py-10 text-center text-sm text-[#C7C5CF]">Đang tải portfolio...</p> : artworks.length === 0 ? <p className="py-10 text-center text-sm text-[#C7C5CF]">Chưa có tác phẩm phù hợp.</p> : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {artworks.map((artwork) => (
              <article key={artwork.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#171a2a]">
                <div className="relative aspect-[4/3] bg-black/20">
                  <Image src={artwork.thumbnailUrl || artwork.imageUrl} alt={artwork.title} fill unoptimized className="object-contain" />
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><h3 className="truncate text-sm font-semibold text-white">{artwork.title}</h3><p className="mt-1 text-xs text-[#A7ACD9]">{artwork.moderationStatus} · {artwork.viewCount} lượt xem</p></div>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" onClick={() => openEdit(artwork)} title="Chỉnh sửa tác phẩm" aria-label={`Chỉnh sửa ${artwork.title}`} className="rounded-lg border border-white/10 p-2 text-[#C7C5CF] hover:bg-white/10 hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => setDeletingArtwork(artwork)} title="Xóa tác phẩm" aria-label={`Xóa ${artwork.title}`} className="rounded-lg border border-rose-300/20 p-2 text-rose-200 hover:bg-rose-300/10"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  {artwork.tags.length ? <div className="flex flex-wrap gap-1.5">{artwork.tags.map((item) => <span key={item} className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-[#C7C5CF]">#{item}</span>)}</div> : null}
                  <ArtworkScanPanel key={`${artwork.id}:${artwork.imageUrl}`} artworkId={artwork.id} compact onCompleted={scanNotices[artwork.id] === artwork.imageUrl ? () => {
                    setScanNotices(current => {
                      if (current[artwork.id] !== artwork.imageUrl) return current;
                      const next = { ...current };
                      delete next[artwork.id];
                      return next;
                    });
                  } : undefined} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {editingArtwork ? <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Chỉnh sửa tác phẩm">
        <form onSubmit={saveEdit} className="w-full max-w-xl space-y-4 rounded-2xl border border-white/10 bg-[#20253b] p-5 sm:p-6">
          <div className="flex items-center justify-between"><h2 className="font-h1 text-lg font-semibold text-white">Chỉnh sửa tác phẩm</h2><button type="button" onClick={() => setEditingArtwork(null)} className="rounded-lg p-2 text-[#C7C5CF] hover:bg-white/10" aria-label="Đóng"><X className="h-4 w-4" /></button></div>
          <button type="button" onClick={() => editImageInputRef.current?.click()} className="relative flex h-44 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/15 bg-black/20 text-xs text-white hover:border-[#A7ACD9]/60">{editingImagePreview ? <Image src={editingImagePreview} alt="Ảnh artwork mới" fill unoptimized className="object-contain" /> : <span>Chọn ảnh thay thế</span>}<span className="absolute bottom-2 right-2 rounded-lg bg-black/70 px-2 py-1">Thay ảnh</span></button>
          <input ref={editImageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={chooseEditImage} className="hidden" />
          <label className="block text-sm text-[#C7C5CF]">Tiêu đề<input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} maxLength={200} required className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2.5 text-white outline-none focus:border-[#A7ACD9]" /></label>
          <label className="block text-sm text-[#C7C5CF]">Mô tả<textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} className="mt-1.5 min-h-24 w-full rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2.5 text-white outline-none focus:border-[#A7ACD9]" /></label>
          <label className="block text-sm text-[#C7C5CF]">Tags, phân cách bằng dấu phẩy<input value={editTags} onChange={(event) => setEditTags(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2.5 text-white outline-none focus:border-[#A7ACD9]" /></label>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditingArtwork(null)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white">Hủy</button><button type="submit" disabled={savingEdit} className="rounded-xl bg-[#A7ACD9] px-4 py-2 text-sm font-semibold text-[#1F2335] disabled:opacity-60">{savingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}</button></div>
        </form>
      </div> : null}
      {deletingArtwork ? <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" role="alertdialog" aria-modal="true" aria-labelledby="delete-artwork-title">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#20253b] p-5">
          <h2 id="delete-artwork-title" className="font-h1 text-lg font-semibold text-white">Xóa tác phẩm?</h2>
          <p className="mt-2 text-sm leading-5 text-[#C7C5CF]">“{deletingArtwork.title}” sẽ bị gỡ khỏi portfolio và marketplace.</p>
          <div className="mt-5 flex justify-end gap-2"><button type="button" disabled={deleteBusy} onClick={() => setDeletingArtwork(null)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white">Hủy</button><button type="button" disabled={deleteBusy} onClick={confirmDeleteArtwork} className="rounded-xl bg-rose-300 px-4 py-2 text-sm font-semibold text-[#351718] disabled:opacity-60">{deleteBusy ? 'Đang xóa...' : 'Xóa tác phẩm'}</button></div>
        </div>
      </div> : null}
    </Shell>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- legacy editor retained until rate-card migration is complete
function Services() {
  const [slots, setSlots] = useState(3);
  const [services, setServices] = useState<Service[]>([
    { id: 1, name: 'Headshot', price: '150.000đ', days: '3 ngày', active: true },
    { id: 2, name: 'Half-body', price: '350.000đ', days: '5 ngày', active: true },
    { id: 3, name: 'Full-body', price: '650.000đ', days: '7 ngày', active: false },
  ]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await creatorProfileService.getMyProfile();
        setSlots(profile.availableSlots ?? 3);
      } catch {
        setSlots(3);
      }
    };

    void loadProfile();
  }, []);

  const add = () => {
    setServices((current) => [...current, { id: Date.now(), name: 'Gói mới', price: '0đ', days: '3 ngày', active: true }]);
  };

  const updateSlots = async (nextSlots: number) => {
    try {
      await creatorProfileService.updateMyProfile({ availableSlots: nextSlots });
      setSlots(nextSlots);
      toast.success('Đã cập nhật số slot nhận đơn.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật slot.';
      toast.error(message);
      setSlots((current) => Math.max(1, current));
    }
  };

  return (
    <Shell view="services">
      <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <section className="space-y-3">
          {services.map((service) => (
            <article key={service.id} className="glass-container flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center">
              <GripVertical className="hidden h-5 w-5 text-[#919099] sm:block" />
              <div className="min-w-0 flex-1">
                <input value={service.name} onChange={(event) => setServices((current) => current.map((item) => item.id === service.id ? { ...item, name: event.target.value } : item))} className="w-full bg-transparent font-h1 text-lg font-semibold text-white outline-none" />
                <p className="mt-1 text-xs text-[#919099]">Gói commission</p>
              </div>
              <input value={service.price} onChange={(event) => setServices((current) => current.map((item) => item.id === service.id ? { ...item, price: event.target.value } : item))} className="rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2 text-sm text-white outline-none sm:w-32" />
              <input value={service.days} onChange={(event) => setServices((current) => current.map((item) => item.id === service.id ? { ...item, days: event.target.value } : item))} className="rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2 text-sm text-white outline-none sm:w-28" />
              <button type="button" onClick={() => setServices((current) => current.map((item) => item.id === service.id ? { ...item, active: !item.active } : item))} className={`rounded-full px-3 py-2 text-xs ${service.active ? 'bg-[#BCE6B8]/15 text-[#BCE6B8]' : 'bg-white/5 text-[#919099]'}`}>
                {service.active ? 'Đang mở' : 'Tạm ẩn'}
              </button>
            </article>
          ))}
          <button type="button" onClick={add} className="flex items-center gap-2 rounded-2xl border border-dashed border-white/15 px-4 py-3 text-sm text-[#A7ACD9]">
            <Plus className="h-4 w-4" /> Thêm gói mới
          </button>
        </section>

        <aside className="glass-container rounded-3xl p-5">
          <p className="text-xs uppercase tracking-[.2em] text-[#A7ACD9]">Slots</p>
          <h2 className="mt-3 font-h1 text-xl font-bold text-white">Số slot nhận đơn</h2>
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-[#171a2a] p-3">
            <button type="button" onClick={() => updateSlots(Math.max(1, slots - 1))} className="rounded-xl bg-white/5 px-3 py-2 text-white">−</button>
            <span className="text-lg font-semibold text-white">{slots}</span>
            <button type="button" onClick={() => updateSlots(slots + 1)} className="rounded-xl bg-white/5 px-3 py-2 text-white">+</button>
          </div>
          <p className="mt-3 text-sm text-[#C7C5CF]">Tổng slot đang mở cho khách đặt hàng.</p>
        </aside>
      </div>
    </Shell>
  );
}

function Terms() {
  const [commercial, setCommercial] = useState('1.5');
  const [revision, setRevision] = useState('02 lần chỉnh sửa miễn phí trong giai đoạn sketch.');
  const [cancellation, setCancellation] = useState('Hoàn tiền theo tiến độ hoàn thành. Phí hủy có thể áp dụng sau khi duyệt sketch.');

  useEffect(() => {
    const loadState = async () => {
      try {
        const state = await creatorProfileService.getWorkstationState();
        setCommercial(String(state.terms.commercialLicenseMultiplier ?? 1.5));
        setRevision(state.terms.revisionPolicy ?? '02 lần chỉnh sửa miễn phí trong giai đoạn sketch.');
        setCancellation(state.terms.cancellationPolicy ?? 'Hoàn tiền theo tiến độ hoàn thành. Phí hủy có thể áp dụng sau khi duyệt sketch.');
      } catch {
        // keep demo defaults
      }
    };

    void loadState();
  }, []);

  const save = async () => {
    try {
      await creatorProfileService.saveTerms({
        commercialLicenseMultiplier: Number(commercial || 1.5),
        revisionPolicy: revision,
        cancellationPolicy: cancellation,
      });
      toast.success('Đã lưu điều khoản & bản quyền.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu điều khoản.';
      toast.error(message);
    }
  };

  return (
    <Shell view="terms">
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="glass-container rounded-3xl p-6">
          <h2 className="font-h1 text-lg font-bold text-white">Bản quyền sử dụng</h2>
          <p className="mt-2 text-sm text-[#C7C5CF]">Thiết lập phụ phí theo mục đích sử dụng của client.</p>
          <div className="mt-6 space-y-3">
            <LicenseRow title="Personal use" detail="Dùng cá nhân, không kinh doanh" value="1.0× giá gốc" />
            <label className="block rounded-2xl border border-[#A7ACD9]/30 bg-[#A7ACD9]/[.06] p-4">
              <span className="text-sm font-medium text-white">Commercial use</span>
              <span className="mt-1 block text-xs text-[#C7C5CF]">Sử dụng thương mại / branding</span>
              <div className="mt-3 flex items-center gap-2">
                <input value={commercial} onChange={(event) => setCommercial(event.target.value)} className="w-20 rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2 text-center text-sm outline-none" />
                <span className="text-sm text-[#DDE0FF]">× giá gốc</span>
              </div>
            </label>
          </div>
        </section>

        <section className="glass-container rounded-3xl p-6">
          <h2 className="font-h1 text-lg font-bold text-white">Chỉnh sửa & hủy đơn</h2>
          <label className="mt-5 block text-sm text-[#C7C5CF]">
            Quy định chỉnh sửa
            <textarea value={revision} onChange={(event) => setRevision(event.target.value)} className="mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-[#171a2a] p-3 text-sm text-white outline-none focus:border-[#A7ACD9]" />
          </label>
          <label className="mt-5 block text-sm text-[#C7C5CF]">
            Chính sách hủy đơn
            <textarea value={cancellation} onChange={(event) => setCancellation(event.target.value)} className="mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-[#171a2a] p-3 text-sm text-white outline-none focus:border-[#A7ACD9]" />
          </label>
          <button type="button" onClick={save} className="mt-5 rounded-2xl bg-[#A7ACD9] px-5 py-3 text-sm font-bold text-[#1F2335]">
            Lưu điều khoản
          </button>
        </section>
      </div>
    </Shell>
  );
}

function AiRules() {
  const [enabled, setEnabled] = useState(true);
  const [template, setTemplate] = useState('Cảm ơn bạn đã gửi brief! Mình đã nhận được thông tin và sẽ phản hồi trong vòng 24 giờ.');
  const [faqs, setFaqs] = useState<FaqDraft[]>([
    { q: 'Bạn nhận commission không?', a: 'Mình đang nhận commission theo số slot hiển thị trên profile.' },
    { q: 'Thời gian hoàn thành?', a: 'Tùy gói dịch vụ, thường từ 3–7 ngày.' },
  ]);

  useEffect(() => {
    const loadState = async () => {
      try {
        const state = await creatorProfileService.getWorkstationState();
        setEnabled(state.autoReply.isEnabled);
        setTemplate(state.autoReply.briefTemplate || defaultState.autoReply.briefTemplate);
        setFaqs((state.faqs ?? []).map((faq) => ({ q: faq.question, a: faq.answer })) || [
          { q: 'Bạn nhận commission không?', a: 'Mình đang nhận commission theo số slot hiển thị trên profile.' },
        ]);
      } catch {
        // keep defaults
      }
    };

    void loadState();
  }, []);

  const saveAutoReply = async () => {
    try {
      await creatorProfileService.saveAutoReply({ isEnabled: enabled, briefTemplate: template });
      toast.success('Đã lưu mẫu auto-reply.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu auto-reply.';
      toast.error(message);
    }
  };

  const addFaq = () => {
    setFaqs((current) => [...current, { q: 'Câu hỏi mới', a: 'Câu trả lời' }]);
  };

  const saveFaq = async (index: number) => {
    const faq = faqs[index];
    if (!faq) return;

    try {
      await creatorProfileService.saveFaq({ question: faq.q, answer: faq.a, displayOrder: index + 1 });
      toast.success('Đã lưu FAQ.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu FAQ.';
      toast.error(message);
    }
  };

  return (
    <Shell view="ai-rules">
      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <section className="glass-container rounded-3xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Bot className="h-6 w-6 text-[#A7ACD9]" />
              <h2 className="mt-4 font-h1 text-lg font-bold text-white">Auto-reply cho brief</h2>
              <p className="mt-2 text-sm text-[#C7C5CF]">AI trả lời ngay khi client gửi brief mới.</p>
            </div>
            <input checked={enabled} onChange={(event) => setEnabled(event.target.checked)} type="checkbox" className="h-5 w-9 accent-[#A7ACD9]" />
          </div>

          <label className="mt-6 block text-sm text-[#C7C5CF]">
            Mẫu tin nhắn
            <textarea value={template} onChange={(event) => setTemplate(event.target.value)} className="mt-2 min-h-36 w-full rounded-2xl border border-white/10 bg-[#171a2a] p-3 text-sm text-white outline-none focus:border-[#A7ACD9]" />
          </label>
          <button type="button" onClick={saveAutoReply} className="mt-5 w-full rounded-2xl bg-[#A7ACD9] py-3 text-sm font-bold text-[#1F2335]">
            Lưu automation
          </button>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-h1 text-lg font-bold text-white">FAQ tự động</h2>
              <p className="mt-1 text-sm text-[#C7C5CF]">Câu trả lời AI có thể gửi ngay cho khách.</p>
            </div>
            <button type="button" onClick={addFaq} className="rounded-xl bg-white/10 p-2 text-[#A7ACD9]" aria-label="Thêm FAQ">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <article key={`${faq.q}-${index}`} className="rounded-3xl border border-white/10 bg-white/[.035] p-4">
                <input value={faq.q} onChange={(event) => setFaqs((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, q: event.target.value } : item))} className="w-full bg-transparent text-sm font-medium text-white outline-none" />
                <textarea value={faq.a} onChange={(event) => setFaqs((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, a: event.target.value } : item))} className="mt-3 min-h-20 w-full rounded-2xl border border-white/10 bg-[#171a2a] p-3 text-sm text-white outline-none focus:border-[#A7ACD9]" />
                <button type="button" onClick={() => saveFaq(index)} className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-xs text-[#A7ACD9]">
                  Lưu FAQ
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}

function Waitlist() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [status, setStatus] = useState<'All' | CommissionStatus>('All');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'table' | 'calendar'>('table');
  const [monthCursor, setMonthCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    commissionService.getByCreator()
      .then((items) => { if (active) setCommissions(items); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Không thể tải commission.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visibleCommissions = commissions.filter((commission) => {
    const matchesStatus = status === 'All' || commission.status === status;
    const term = search.trim().toLocaleLowerCase();
    const matchesSearch = !term || `${commission.title} ${commission.clientName ?? ''} ${commission.clientId}`.toLocaleLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });
  const statusLabels: Record<CommissionStatus, string> = {
    PendingAcceptance: 'Chờ chấp nhận',
    InProgress: 'Đang thực hiện',
    Negotiating: 'Đang thương lượng',
    SubmittedFinal: 'Chờ duyệt bản cuối',
    Delivered: 'Đã bàn giao',
    Completed: 'Hoàn tất',
    Cancelled: 'Đã hủy',
    Disputed: 'Đang tranh chấp',
  };
  const statusColors: Record<CommissionStatus, string> = {
    PendingAcceptance: 'bg-white/10 text-[#C7C5CF]',
    InProgress: 'bg-blue-400/15 text-blue-200',
    Negotiating: 'bg-amber-400/15 text-amber-200',
    SubmittedFinal: 'bg-sky-400/15 text-sky-200',
    Delivered: 'bg-teal-400/15 text-teal-200',
    Completed: 'bg-emerald-400/15 text-emerald-200',
    Cancelled: 'bg-rose-400/15 text-rose-200',
    Disputed: 'bg-orange-400/15 text-orange-200',
  };
  const money = (amount?: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount ?? 0);
  const monthStart = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const monthOffset = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0).getDate();
  const calendarCellCount = Math.ceil((monthOffset + daysInMonth) / 7) * 7;
  const calendarDays = Array.from({ length: calendarCellCount }, (_, index) => {
    const day = index - monthOffset + 1;
    return day < 1 || day > daysInMonth ? null : new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day);
  });
  const monthCommissions = visibleCommissions.filter((commission) => {
    if (!commission.deadlineAt) return false;
    const deadline = new Date(commission.deadlineAt);
    return deadline.getFullYear() === monthCursor.getFullYear() && deadline.getMonth() === monthCursor.getMonth();
  });
  const dateKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const commissionsByDate = new Map<string, Commission[]>();
  for (const commission of monthCommissions) {
    const key = dateKey(new Date(commission.deadlineAt!));
    commissionsByDate.set(key, [...(commissionsByDate.get(key) ?? []), commission]);
  }
  const undatedCommissions = visibleCommissions.filter((commission) => !commission.deadlineAt);
  const monthLabel = monthCursor.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const transactionPercent = (commission: Commission) => {
    const total = commission.finalPrice || commission.totalPrice || commission.price || 0;
    if (!total) return 0;
    const settled = (commission.escrowHeldAmount ?? 0) + (commission.disbursedAmount ?? 0);
    return Math.max(0, Math.min(100, Math.round((settled / total) * 100)));
  };

  return (
    <Shell view="waitlist">
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.025]">
        <div className="grid gap-3 border-b border-white/10 p-4 xl:grid-cols-[minmax(220px,1fr)_220px_auto] xl:items-center">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên khách hoặc commission" className="rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2.5 text-sm text-white outline-none focus:border-[#A7ACD9]" />
          <select value={status} onChange={(event) => setStatus(event.target.value as 'All' | CommissionStatus)} className="rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2.5 text-sm text-white outline-none">
            <option value="All">Tất cả trạng thái</option>
            {(Object.keys(statusLabels) as CommissionStatus[]).map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}
          </select>
          <div className="inline-flex w-fit rounded-xl border border-white/10 bg-[#171a2a] p-1" role="group" aria-label="Chế độ hiển thị waitlist">
            <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${view === 'table' ? 'bg-[#A7ACD9] text-[#1F2335]' : 'text-[#C7C5CF] hover:text-white'}`}><List className="h-4 w-4" />Bảng</button>
            <button type="button" aria-pressed={view === 'calendar'} onClick={() => setView('calendar')} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${view === 'calendar' ? 'bg-[#A7ACD9] text-[#1F2335]' : 'text-[#C7C5CF] hover:text-white'}`}><CalendarDays className="h-4 w-4" />Lịch tháng</button>
          </div>
        </div>
        {loading ? <p className="py-12 text-center text-sm text-[#C7C5CF]">Đang tải commission...</p> : error ? <p className="py-12 text-center text-sm text-[#ff9aa2]">{error}</p> : visibleCommissions.length === 0 ? <p className="py-12 text-center text-sm text-[#C7C5CF]">Không có commission phù hợp.</p> : (
          view === 'table' ? <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[.025] text-[11px] uppercase tracking-wide text-[#919099]"><tr><th className="px-4 py-3 font-medium">Khách hàng</th><th className="px-4 py-3 font-medium">Commission</th><th className="px-4 py-3 font-medium">Trạng thái</th><th className="px-4 py-3 font-medium">Hạn hoàn thành</th><th className="px-4 py-3 font-medium">Thanh toán</th><th className="px-4 py-3 font-medium">Ghi chú</th></tr></thead>
              <tbody className="divide-y divide-white/5">{visibleCommissions.map((commission) => {
                const percent = transactionPercent(commission);
                return <tr key={commission.id} className="align-top hover:bg-white/[.025]">
                  <td className="px-4 py-3.5"><p className="font-medium text-white">{commission.clientName || `Client ${commission.clientId.slice(0, 8)}`}</p><p className="mt-1 font-mono text-[10px] text-[#919099]">#{commission.id.slice(0, 8).toUpperCase()}</p></td>
                  <td className="px-4 py-3.5"><Link href={`/workroom/${commission.id}`} className="font-medium text-[#DDE0FF] hover:text-white">{commission.title}<ChevronRight className="ml-1 inline h-3.5 w-3.5" /></Link></td>
                  <td className="px-4 py-3.5"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${statusColors[commission.status]}`}>{statusLabels[commission.status]}</span>{commission.status === 'InProgress' ? <p className="mt-1 text-[10px] text-[#919099]">Stage {commission.currentStage}</p> : null}</td>
                  <td className="px-4 py-3.5 text-[#C7C5CF]">{commission.deadlineAt ? new Date(commission.deadlineAt).toLocaleDateString('vi-VN', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</td>
                  <td className="px-4 py-3.5"><span className="inline-flex rounded-md bg-rose-300/15 px-2 py-1 text-xs font-medium text-rose-200">{percent}%</span><p className="mt-1 text-[10px] text-[#919099]">{money((commission.escrowHeldAmount ?? 0) + (commission.disbursedAmount ?? 0))} / {money(commission.finalPrice || commission.totalPrice || commission.price || 0)}</p></td>
                  <td className="max-w-[240px] px-4 py-3.5 text-xs leading-5 text-[#C7C5CF]"><p className="line-clamp-2" title={commission.description || ''}>{commission.description || '—'}</p></td>
                </tr>;
              })}</tbody>
            </table>
          </div> : <div className="p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="font-h1 text-base font-semibold capitalize text-white">{monthLabel}</p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} className="rounded-lg border border-white/10 p-2 text-[#C7C5CF] hover:bg-white/10" aria-label="Tháng trước"><ChevronLeft className="h-4 w-4" /></button>
                <button type="button" onClick={() => setMonthCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#C7C5CF] hover:bg-white/10">Hôm nay</button>
                <button type="button" onClick={() => setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="rounded-lg border border-white/10 p-2 text-[#C7C5CF] hover:bg-white/10" aria-label="Tháng sau"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="grid min-w-[720px] grid-cols-7 border-l border-t border-white/10">
                {weekdays.map((weekday) => <div key={weekday} className="border-b border-r border-white/10 bg-white/[.025] px-2 py-2 text-center text-[10px] font-semibold uppercase text-[#919099]">{weekday}</div>)}
                {calendarDays.map((date, index) => {
                  const dayCommissions = date ? commissionsByDate.get(dateKey(date)) ?? [] : [];
                  const isToday = date?.toDateString() === new Date().toDateString();
                  return <div key={date ? dateKey(date) : `empty-${index}`} className={`min-h-28 border-b border-r border-white/10 p-2 ${date ? 'bg-[#171a2a]/60' : 'bg-black/10'}`}>
                    {date ? <><span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${isToday ? 'bg-[#A7ACD9] font-bold text-[#1F2335]' : 'text-[#C7C5CF]'}`}>{date.getDate()}</span><div className="mt-1 space-y-1">{dayCommissions.slice(0, 3).map((commission) => <Link key={commission.id} href={`/workroom/${commission.id}`} title={`${commission.clientName || 'Client'} · ${commission.title}`} className={`block truncate rounded px-1.5 py-1 text-[10px] ${statusColors[commission.status]}`}>{commission.clientName || commission.title}</Link>)}{dayCommissions.length > 3 ? <p className="px-1 text-[10px] text-[#919099]">+{dayCommissions.length - 3} more</p> : null}</div></> : null}
                  </div>;
                })}
              </div>
            </div>
            {undatedCommissions.length ? <section className="mt-5 border-t border-white/10 pt-4"><h3 className="text-xs font-semibold uppercase tracking-wider text-[#919099]">Chưa có deadline <span className="ml-1 text-[#C7C5CF]">{undatedCommissions.length}</span></h3><div className="mt-2 divide-y divide-white/5">{undatedCommissions.map((commission) => <Link key={commission.id} href={`/workroom/${commission.id}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:bg-white/[.025]"><span className="min-w-0 truncate text-white">{commission.title}<span className="ml-2 text-xs text-[#919099]">{commission.clientName || `Client ${commission.clientId.slice(0, 8)}`}</span></span><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] ${statusColors[commission.status]}`}>{statusLabels[commission.status]}</span></Link>)}</div></section> : null}
            {!monthCommissions.length && !undatedCommissions.length ? <p className="py-10 text-center text-sm text-[#919099]">Không có deadline trong tháng này.</p> : null}
          </div>
        )}
      </section>
    </Shell>
  );
}

function Assets() {
  return <Shell view="assets"><CreatorAssetLibrary /></Shell>;
}

export function CreatorWorkstation({ view }: { view: WorkstationView }) {
  switch (view) {
    case 'artworks':
      return <Artworks />;
    case 'services':
      return <CreatorRateCardManager />;
    case 'terms':
      return <Terms />;
    case 'ai-rules':
      return <AiRules />;
    case 'waitlist':
      return <Waitlist />;
    case 'assets':
    default:
      return <Assets />;
  }
}
