'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Bot,
  Brush,
  Check,
  ChevronRight,
  Clock3,
  FileImage,
  FolderOpen,
  GripVertical,
  ImagePlus,
  LayoutGrid,
  MessageSquareText,
  Palette,
  Plus,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { creatorProfileService } from '../services/creator-profile.service';
import type {
  AutoReplySettingDto,
  CreateCreatorAssetRequest,
  CreateWorkItemRequest,
  CreatorAssetDto,
  CreatorFaqDto,
  CreatorTermsDto,
  CreatorWorkItemDto,
  CreatorWorkstationState,
} from '../types/creator-profile.types';

export type WorkstationView = 'artworks' | 'services' | 'terms' | 'ai-rules' | 'waitlist' | 'assets';

type Service = { id: number; name: string; price: string; days: string; active: boolean };

type FaqDraft = { q: string; a: string };

const navigation: { value: WorkstationView; label: string; icon: typeof Brush }[] = [
  { value: 'artworks', label: 'Tác phẩm', icon: Brush },
  { value: 'services', label: 'Dịch vụ & giá', icon: LayoutGrid },
  { value: 'terms', label: 'Điều khoản', icon: ShieldCheck },
  { value: 'ai-rules', label: 'AI Auto-reply', icon: Bot },
  { value: 'waitlist', label: 'Hàng chờ', icon: Clock3 },
  { value: 'assets', label: 'Asset & Presets', icon: Palette },
];

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
  workItems: [
    { id: 'wi-1', clientName: 'Linh', title: 'Chibi couple', stage: 'PendingBrief', dueAt: '2026-09-30T00:00:00Z', createdAt: '2026-09-22T00:00:00Z' },
    { id: 'wi-2', clientName: 'Hà', title: 'Album cover', stage: 'PendingBrief', dueAt: '2026-09-27T00:00:00Z', createdAt: '2026-09-22T00:00:00Z' },
    { id: 'wi-3', clientName: 'An', title: 'Full-body OC', stage: 'InProgress', dueAt: '2026-09-29T00:00:00Z', createdAt: '2026-09-20T00:00:00Z' },
    { id: 'wi-4', clientName: 'Khánh', title: 'Stream overlay', stage: 'Review', dueAt: '2026-09-25T00:00:00Z', createdAt: '2026-09-19T00:00:00Z' },
    { id: 'wi-5', clientName: 'Mai', title: 'Headshot', stage: 'Completed', dueAt: '2026-09-23T00:00:00Z', createdAt: '2026-09-18T00:00:00Z' },
  ],
  assets: [
    { id: 'asset-1', assetType: 'Pose', name: 'Dynamic pose', assetUrl: '', metadataJson: '{"type":"pose"}', createdAt: '2026-09-22T00:00:00Z' },
    { id: 'asset-2', assetType: 'Palette', name: 'Moonlight', assetUrl: '', metadataJson: '{"colors":["#E9D5A1","#CB8A71","#6A4C66","#32364A"]}', createdAt: '2026-09-21T00:00:00Z' },
    { id: 'asset-3', assetType: 'Preset', name: 'Soft shading', assetUrl: '', metadataJson: '{"preset":"soft"}', createdAt: '2026-09-20T00:00:00Z' },
  ],
};

function Shell({ view, children }: { view: WorkstationView; children: React.ReactNode }) {
  const [title, subtitle] = titles[view];

  return (
    <main className="min-h-screen bg-[#1F2335] text-[#E4E1E5]">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-60 shrink-0 lg:block">
          <Link href="/" className="mb-8 flex items-center gap-2 text-sm text-[#A7ACD9]">
            <span>←</span> Marketplace
          </Link>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#919099]">Creator workstation</p>
          <nav className="space-y-1">
            {navigation.map(({ value, label, icon: Icon }) => (
              <Link
                key={value}
                href={`/creator/${value}`}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition ${
                  view === value ? 'bg-[#A7ACD9] font-semibold text-[#1F2335]' : 'text-[#C7C5CF] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#A7ACD9]">Creator studio</p>
              <h1 className="mt-2 font-h1 text-2xl font-bold text-white sm:text-3xl">{title}</h1>
              <p className="mt-2 text-sm text-[#C7C5CF]">{subtitle}</p>
            </div>
            <Link href="/creator/services" className="rounded-full border border-white/15 px-4 py-2 text-xs text-[#C7C5CF] lg:hidden">
              Menu
            </Link>
          </div>
          {children}
        </section>
      </div>
    </main>
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
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [watermark, setWatermark] = useState(true);
  const [autoTags, setAutoTags] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        await creatorProfileService.getMyProfile();
        setProfileReady(true);
      } catch {
        setProfileReady(false);
      }
    };

    void loadProfile();
  }, []);

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file?.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file));
      setSaved(false);
    }
  };

  const addTag = () => {
    const value = tag.trim();
    if (value && !tags.includes(value)) {
      setTags((current) => [...current, value]);
    }
    setTag('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!profileReady) {
      setError('Bạn cần tạo profile creator trước khi upload artwork.');
      return;
    }

    if (!title.trim() || !preview) {
      setError('Vui lòng chọn ảnh và nhập tiêu đề tác phẩm.');
      return;
    }

    try {
      const uploaded = await creatorProfileService.uploadArtwork({
        title: title.trim(),
        description,
        imageUrl: preview,
        thumbnailUrl: preview,
        isAiGenerated: autoTags,
        tags,
      });
      setError('');
      setSaved(true);
      toast.success(`Đã lưu tác phẩm ${uploaded.title}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu tác phẩm.');
      toast.error(err instanceof Error ? err.message : 'Không thể lưu tác phẩm.');
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
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Violet afternoon" className="mt-2 w-full rounded-2xl border border-white/10 bg-[#171a2a] px-4 py-3 text-white outline-none focus:border-[#A7ACD9]" />
            </label>

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
          <h2 className="font-h1 text-lg font-semibold text-white">AI settings</h2>
          <Toggle label="AI Auto-watermark" description="Thêm watermark tự động cho file xuất bản." checked={watermark} onChange={setWatermark} />
          <Toggle label="Tự động sinh tag bởi AI" description="Phân loại chủ đề và style tự động." checked={autoTags} onChange={setAutoTags} />

          <button type="submit" className="mt-6 w-full rounded-2xl bg-[#A7ACD9] px-5 py-3 text-sm font-bold text-[#1F2335]">
            Lưu tác phẩm
          </button>

          {saved ? <p className="mt-3 flex items-center gap-2 text-sm text-[#BCE6B8]"><Check className="h-4 w-4" /> Đã lưu thành công.</p> : null}
          {error ? <p className="mt-3 text-sm text-[#ff9aa2]">{error}</p> : null}
        </aside>
      </form>
    </Shell>
  );
}

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
        setTemplate(state.autoReply.briefTemplate || template);
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
  const [workItems, setWorkItems] = useState<CreatorWorkItemDto[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [clientName, setClientName] = useState('');
  const [title, setTitle] = useState('');
  const [stage, setStage] = useState('PendingBrief');

  useEffect(() => {
    const loadState = async () => {
      try {
        const state = await creatorProfileService.getWorkstationState();
        setWorkItems(state.workItems ?? []);
      } catch {
        setWorkItems(defaultState.workItems);
      }
    };

    void loadState();
  }, []);

  const addWorkItem = async (event: FormEvent) => {
    event.preventDefault();
    if (!clientName.trim() || !title.trim()) {
      toast.error('Vui lòng nhập tên khách và tên dự án.');
      return;
    }

    try {
      const created = await creatorProfileService.saveWorkItem({ clientName: clientName.trim(), title: title.trim(), stage, dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString() });
      setWorkItems((current) => [created, ...current]);
      setClientName('');
      setTitle('');
      setStage('PendingBrief');
      setShowAddForm(false);
      toast.success('Đã thêm đơn hàng vào waitlist.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể thêm đơn hàng.';
      toast.error(message);
    }
  };

  const columns = [
    { name: 'Pending brief', color: 'border-[#A7ACD9]', items: workItems.filter((item) => item.stage === 'PendingBrief') },
    { name: 'In progress', color: 'border-[#d7b777]', items: workItems.filter((item) => item.stage === 'InProgress') },
    { name: 'Review', color: 'border-[#8bb6d9]', items: workItems.filter((item) => item.stage === 'Review') },
    { name: 'Completed', color: 'border-[#8fc98b]', items: workItems.filter((item) => item.stage === 'Completed') },
  ];

  return (
    <Shell view="waitlist">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#C7C5CF]">{workItems.length} commission đang được theo dõi</p>
        <button type="button" onClick={() => setShowAddForm((value) => !value)} className="inline-flex items-center gap-2 rounded-2xl bg-[#A7ACD9] px-4 py-2.5 text-sm font-bold text-[#1F2335]">
          <Plus className="h-4 w-4" />
          Thêm đơn
        </button>
      </div>

      {showAddForm ? (
        <form onSubmit={addWorkItem} className="mb-5 grid gap-3 rounded-3xl border border-white/10 bg-white/[.04] p-4 md:grid-cols-3">
          <input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Tên khách" className="rounded-2xl border border-white/10 bg-[#171a2a] px-3 py-2 text-sm text-white outline-none" />
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Tên dự án" className="rounded-2xl border border-white/10 bg-[#171a2a] px-3 py-2 text-sm text-white outline-none" />
          <div className="flex gap-2">
            <select value={stage} onChange={(event) => setStage(event.target.value)} className="flex-1 rounded-2xl border border-white/10 bg-[#171a2a] px-3 py-2 text-sm text-white outline-none">
              <option value="PendingBrief">Pending brief</option>
              <option value="InProgress">In progress</option>
              <option value="Review">Review</option>
              <option value="Completed">Completed</option>
            </select>
            <button type="submit" className="rounded-2xl bg-[#A7ACD9] px-4 py-2 text-sm font-bold text-[#1F2335]">Lưu</button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-4">
        {columns.map((column) => (
          <section key={column.name} className={`min-h-72 rounded-3xl border-t-2 ${column.color} bg-white/[.035] p-3`}>
            <div className="mb-4 flex items-center justify-between px-2">
              <h2 className="text-sm font-semibold text-white">{column.name}</h2>
              <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-[#C7C5CF]">{column.items.length}</span>
            </div>
            <div className="space-y-3">
              {column.items.map((card) => (
                <article key={card.id} className="cursor-grab rounded-2xl border border-white/10 bg-[#252a42] p-4 shadow-lg">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-white">{card.clientName} · {card.title}</p>
                    <GripVertical className="h-4 w-4 text-[#919099]" />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-[#A7ACD9]">Commission</span>
                    <span className="text-xs text-[#919099]">{card.dueAt ? new Date(card.dueAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' }) : 'N/A'}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Shell>
  );
}

function Assets() {
  const [tab, setTab] = useState<'poses' | 'palettes' | 'presets'>('poses');
  const [assets, setAssets] = useState<CreatorAssetDto[]>([]);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const state = await creatorProfileService.getWorkstationState();
        setAssets(state.assets ?? []);
      } catch {
        setAssets(defaultState.assets);
      }
    };

    void loadAssets();
  }, []);

  const addAsset = async () => {
    const assetType = tab === 'poses' ? 'Pose' : tab === 'palettes' ? 'Palette' : 'Preset';
    const name = `${assetType} ${assets.filter((item) => item.assetType === assetType).length + 1}`;

    try {
      const created = await creatorProfileService.saveAsset({
        assetType,
        name,
        assetUrl: '',
        metadataJson: JSON.stringify({ category: tab }),
      });
      setAssets((current) => [created, ...current]);
      toast.success('Đã lưu asset mới.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu asset.';
      toast.error(message);
    }
  };

  const cards = assets.length ? assets.filter((item) => item.assetType === (tab === 'poses' ? 'Pose' : tab === 'palettes' ? 'Palette' : 'Preset')).map((item) => item.name) : [];

  return (
    <Shell view="assets">
      <div className="mb-6 flex gap-2 rounded-full bg-white/5 p-1 w-fit">
        {([
          ['poses', 'Pose mẫu'],
          ['palettes', 'Bảng màu'],
          ['presets', 'Presets'],
        ] as const).map(([value, label]) => (
          <button key={value} type="button" onClick={() => setTab(value)} className={`rounded-full px-4 py-2 text-sm ${tab === value ? 'bg-[#A7ACD9] font-semibold text-[#1F2335]' : 'text-[#C7C5CF]'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button type="button" onClick={addAsset} className="flex min-h-52 flex-col items-center justify-center rounded-3xl border border-dashed border-[#A7ACD9]/50 bg-[#A7ACD9]/[.04] text-[#A7ACD9]">
          <ImagePlus className="h-7 w-7" />
          <span className="mt-3 text-sm font-semibold">Thêm {tab === 'palettes' ? 'bảng màu' : 'asset mới'}</span>
        </button>

        {cards.map((card, index) => (
          <article key={card} className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[.035]">
            <div className={`relative flex aspect-[16/10] items-center justify-center ${index === 0 ? 'bg-gradient-to-br from-[#a7acd9] to-[#5d6092]' : index === 1 ? 'bg-gradient-to-br from-[#d8a976] to-[#705641]' : 'bg-gradient-to-br from-[#665581] to-[#342c4b]'}`}>
              {tab === 'palettes' ? (
                <div className="flex gap-2">
                  {['#E9D5A1', '#CB8A71', '#6A4C66', '#32364A'].map((color) => (
                    <i key={color} className="h-9 w-9 rounded-full border border-white/30" style={{ background: color }} />
                  ))}
                </div>
              ) : (
                <FileImage className="h-8 w-8 text-white/70" />
              )}
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <h2 className="text-sm font-semibold text-white">{card}</h2>
                <p className="mt-1 text-xs text-[#919099]">Cập nhật hôm nay</p>
              </div>
              <button type="button" className="rounded-xl p-2 text-[#C7C5CF] hover:bg-white/10">
                <FolderOpen className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </Shell>
  );
}

export function CreatorWorkstation({ view }: { view: WorkstationView }) {
  switch (view) {
    case 'artworks':
      return <Artworks />;
    case 'services':
      return <Services />;
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
