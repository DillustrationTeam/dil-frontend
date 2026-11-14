'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Plus,
  AlertCircle,
  Loader2,
  Calendar,
  User,
  Info,
  Palette,
  Search,
  X,
} from 'lucide-react';
import { artTradeService } from '@/services/art-trade.service';
import { formatNoteWithAttachments } from '@/features/art-trade/utils/trade-attachment.utils';
import { TradeSlotStatusDto, CreatorSearchItemDto } from '@/types/art-trade.types';
import { useAuthStore } from '@/store/use-auth-store';
import toast from 'react-hot-toast';

function CreateArtTradeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const roles = useAuthStore((state) => state.roles);

  const isCreator = roles.some((r) => r.toLowerCase() === 'creator');
  const isAdmin = roles.some((r) => ['administrator', 'admin', 'moderator'].includes(r.toLowerCase()));

  const prefilledReceiverId = searchParams?.get('receiverId') || searchParams?.get('to') || '';
  const prefilledReceiverName = searchParams?.get('name') || '';

  // Creator Partner Selection
  const [receiverId, setReceiverId] = useState(prefilledReceiverId);
  const [receiverDisplayName, setReceiverDisplayName] = useState(prefilledReceiverName);
  const [selectedCreator, setSelectedCreator] = useState<CreatorSearchItemDto | null>(null);
  const [creatorSearchQuery, setCreatorSearchQuery] = useState(prefilledReceiverName);
  const [creatorResults, setCreatorResults] = useState<CreatorSearchItemDto[]>([]);
  const [isSearchingCreators, setIsSearchingCreators] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Trade fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [initiatorRequestNote, setInitiatorRequestNote] = useState('');
  const [receiverRequestNote, setReceiverRequestNote] = useState('');
  const [submissionDeadlineDays, setSubmissionDeadlineDays] = useState<number>(14);

  // Reference images
  const [initiatorImages, setInitiatorImages] = useState<string[]>([]);
  const [receiverImages, setReceiverImages] = useState<string[]>([]);
  const [uploadingInitiatorImg, setUploadingInitiatorImg] = useState<boolean>(false);
  const [uploadingReceiverImg, setUploadingReceiverImg] = useState<boolean>(false);

  const handleUploadInitiatorImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploadingInitiatorImg(true);
      for (let i = 0; i < files.length; i++) {
        const url = await artTradeService.uploadAttachment(files[i]);
        setInitiatorImages((prev) => [...prev, url]);
      }
      toast.success('Đã tải ảnh mẫu lên!');
    } catch {
      toast.error('Tải ảnh mẫu thất bại.');
    } finally {
      setUploadingInitiatorImg(false);
      e.target.value = '';
    }
  };

  const handleUploadReceiverImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploadingReceiverImg(true);
      for (let i = 0; i < files.length; i++) {
        const url = await artTradeService.uploadAttachment(files[i]);
        setReceiverImages((prev) => [...prev, url]);
      }
      toast.success('Đã tải ảnh mẫu lên!');
    } catch {
      toast.error('Tải ảnh mẫu thất bại.');
    } finally {
      setUploadingReceiverImg(false);
      e.target.value = '';
    }
  };

  const [slotStatus, setSlotStatus] = useState<TradeSlotStatusDto | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // Handle prefilled receiver params
  useEffect(() => {
    if (prefilledReceiverName && !selectedCreator) {
      setReceiverDisplayName(prefilledReceiverName);
      setCreatorSearchQuery(prefilledReceiverName);
      artTradeService
        .searchCreators(prefilledReceiverName, 5)
        .then((results) => {
          const exactMatch = results.find(
            (c) =>
              c.displayName.toLowerCase() === prefilledReceiverName.toLowerCase() ||
              (prefilledReceiverId && c.userId.toLowerCase() === prefilledReceiverId.toLowerCase())
          );
          if (exactMatch) {
            setSelectedCreator(exactMatch);
            setReceiverId(exactMatch.userId);
            setReceiverDisplayName(exactMatch.displayName);
          }
        })
        .catch(() => {});
    } else if (prefilledReceiverId && !receiverId) {
      setReceiverId(prefilledReceiverId);
    }
  }, [prefilledReceiverName, prefilledReceiverId, receiverId, selectedCreator]);

  useEffect(() => {
    let isMounted = true;
    async function fetchSlots() {
      try {
        setLoadingSlots(true);
        const data = await artTradeService.getMySlotStatus();
        if (isMounted) setSlotStatus(data);
      } catch (err) {
        console.error('Could not fetch slot status:', err);
        if (isMounted) {
          setSlotStatus(null);
        }
      } finally {
        if (isMounted) setLoadingSlots(false);
      }
    }
    fetchSlots();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const fetchCreatorSuggestions = async (q: string) => {
    try {
      setIsSearchingCreators(true);
      const items = await artTradeService.searchCreators(q, 10);
      setCreatorResults(items);
    } catch (e) {
      console.warn('Failed to search creators', e);
    } finally {
      setIsSearchingCreators(false);
    }
  };

  const handleSearchInputChange = (value: string) => {
    setCreatorSearchQuery(value);
    setReceiverDisplayName(value);
    setShowDropdown(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchCreatorSuggestions(value);
    }, 250);
  };

  const handleSelectCreator = (creator: CreatorSearchItemDto) => {
    setSelectedCreator(creator);
    setReceiverId(creator.userId);
    setReceiverDisplayName(creator.displayName);
    setCreatorSearchQuery('');
    setShowDropdown(false);
  };

  const handleClearSelectedCreator = () => {
    setSelectedCreator(null);
    setReceiverId('');
    setReceiverDisplayName('');
    setCreatorSearchQuery('');
  };

  // Trading is only available for Creators
  if (!isCreator && !isAdmin) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="glass-container rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-brand-periwinkle/10 border border-brand-periwinkle/25 text-brand-periwinkle flex items-center justify-center mx-auto mb-5">
            <Palette className="w-8 h-8" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2 font-h1">
            Art Trading is Exclusive to Creators
          </h2>
          <p className="text-sm text-[#919099] mb-6 max-w-md mx-auto">
            Only verified Creators are permitted to upload and exchange original artwork. Apply to become a Creator to unlock Art Trading!
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/become-creator"
              className="commission-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg transition hover:scale-105"
            >
              <Palette className="w-4 h-4" /> Become a Creator
            </Link>
            <Link
              href="/explore"
              className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-[#C7C5CF] hover:text-white transition"
            >
              Explore Artworks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalReceiverId = selectedCreator?.userId || (receiverId.trim() ? receiverId.trim() : undefined);
    const finalReceiverDisplayName =
      selectedCreator?.displayName || (receiverDisplayName.trim() ? receiverDisplayName.trim() : (creatorSearchQuery.trim() ? creatorSearchQuery.trim() : undefined));

    if (!finalReceiverId && !finalReceiverDisplayName) {
      toast.error('Vui lòng tìm kiếm hoặc chỉ định Nghệ sĩ (Creator) nhận đề nghị trao đổi.');
      return;
    }
    if (!title.trim()) {
      toast.error('Please provide a title for the art trade.');
      return;
    }
    if (!initiatorRequestNote.trim()) {
      toast.error('Please state what artwork or subject you will create for your partner.');
      return;
    }
    if (!receiverRequestNote.trim()) {
      toast.error('Please state what you would like your partner to draw for you.');
      return;
    }

    if (slotStatus && slotStatus.availableSlots <= 0) {
      toast.error('You do not have any available trade slots. Complete an existing trade first.');
      return;
    }

    if (slotStatus && slotStatus.frozenSlotsCount > 0 && slotStatus.availableSlots <= 0) {
      toast.error(`Your trading privileges are currently frozen: ${slotStatus.frozenDetails?.[0]?.reason || 'Penalty'}`);
      return;
    }

    try {
      setSubmitting(true);
      const combinedNote = [
        initiatorRequestNote.trim() ? `What I will draw: ${initiatorRequestNote.trim()}` : '',
        receiverRequestNote.trim() ? `What I want in return: ${receiverRequestNote.trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      const formattedInitiatorNote = formatNoteWithAttachments(initiatorRequestNote, initiatorImages);
      const formattedReceiverNote = formatNoteWithAttachments(receiverRequestNote, receiverImages);

      const newTrade = await artTradeService.propose({
        receiverId: finalReceiverId,
        receiverDisplayName: finalReceiverDisplayName,
        title: title.trim(),
        description: description.trim() || undefined,
        requestNote: combinedNote,
        initiatorRequestNote: formattedInitiatorNote,
        receiverRequestNote: formattedReceiverNote,
        durationDays: submissionDeadlineDays,
      });

      toast.success('Art Trade proposal sent successfully!');
      router.push(`/art-trades/${newTrade.id}`);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to send trade proposal.';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const deadlineOptions = [
    { days: 7, label: '7 Days', desc: 'Fast exchange' },
    { days: 14, label: '14 Days', desc: 'Standard turnaround' },
    { days: 21, label: '21 Days', desc: 'Relaxed schedule' },
    { days: 30, label: '30 Days', desc: 'Complex pieces' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Top Breadcrumb & Return */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/art-trades"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#919099] hover:text-white transition"
        >
          <ArrowLeftRight className="w-4 h-4 text-brand-periwinkle" />
          <span>Back to My Trades</span>
        </Link>
      </div>

      {/* Main Glass Form Card */}
      <div className="glass-container rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-brand-periwinkle/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-brand-periwinkle/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="pb-8 mb-8 border-b border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-wider text-brand-periwinkle font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Creator Art Trade
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-h1">
            Propose an Art Trade
          </h1>
          <p className="text-sm text-[#919099] mt-1 max-w-2xl">
            Propose an art exchange with a fellow Creator. Both original files are protected by watermark previews until both sides confirm mutual satisfaction.
          </p>

          {/* Slot Status Indicator */}
          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[#C7C5CF]">
              <Clock className="w-4 h-4 text-brand-periwinkle" />
              <span>
                Active Slots:{' '}
                <strong className="text-white">
                  {loadingSlots ? '...' : `${slotStatus?.activeTradesCount ?? 0} / ${slotStatus?.totalSlots ?? 2}`}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-brand-periwinkle/10 border border-brand-periwinkle/25 text-brand-periwinkle">
              <ShieldCheck className="w-4 h-4 text-brand-periwinkle" />
              <span>Zero-fee Escrow Protection</span>
            </div>

            {slotStatus && slotStatus.frozenSlotsCount > 0 && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Trade Slot Frozen: {slotStatus.frozenDetails?.[0]?.reason || 'Penalty'}</span>
              </div>
            )}

            {slotStatus && slotStatus.availableSlots <= 0 && slotStatus.frozenSlotsCount === 0 && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Đã hết Slot ({slotStatus.activeTradesCount}/{slotStatus.totalSlots} đang chạy) - Hoàn tất kèo hiện tại để tạo thêm</span>
              </div>
            )}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Partner Creator Selection with Searchbar */}
          <div>
            <label className="block text-xs font-bold text-[#C7C5CF] uppercase tracking-wider mb-2">
              Đối tác trao đổi (Partner Creator) <span className="text-rose-400">*</span>
            </label>

            {selectedCreator ? (
              /* Selected Creator Display Card */
              <div className="relative rounded-2xl border border-brand-periwinkle/40 bg-[#161926]/90 p-4 backdrop-blur-xl flex items-center justify-between gap-4 transition shadow-lg">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-brand-navy border border-brand-periwinkle/40 flex items-center justify-center shrink-0">
                    {selectedCreator.avatarUrl ? (
                      <img
                        src={selectedCreator.avatarUrl}
                        alt={selectedCreator.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-base font-bold text-brand-periwinkle uppercase">
                        {selectedCreator.displayName.slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white truncate font-h1">
                        {selectedCreator.displayName}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-periwinkle/15 text-brand-periwinkle border border-brand-periwinkle/30">
                        Creator
                      </span>
                    </div>
                    <p className="text-xs text-[#919099] truncate mt-0.5">
                      {selectedCreator.headline || selectedCreator.specialties || 'Họa sĩ minh họa'}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px]">
                      <span
                        className={
                          selectedCreator.availableSlots > 0
                            ? 'text-emerald-400 font-medium'
                            : 'text-amber-400 font-medium'
                        }
                      >
                        ● {selectedCreator.availableSlots > 0 ? `${selectedCreator.availableSlots} slot khả dụng` : 'Hiện kín slot'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearSelectedCreator}
                  className="shrink-0 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-[#C7C5CF] hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Đổi nghệ sĩ</span>
                </button>
              </div>
            ) : (
              /* Search Bar with Dropdown Suggestions */
              <div ref={searchContainerRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#919099] pointer-events-none" />
                  <input
                    type="text"
                    value={creatorSearchQuery}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    onFocus={() => {
                      setShowDropdown(true);
                      if (creatorResults.length === 0) fetchCreatorSuggestions(creatorSearchQuery);
                    }}
                    placeholder="Tìm theo Tên hiển thị (Display Name), phong cách, hoặc nhập tên nghệ sĩ..."
                    className="w-full pl-11 pr-10 py-3 bg-[#161926] border border-white/10 rounded-2xl text-sm text-white placeholder-[#919099] focus:outline-none focus:ring-1 focus:ring-brand-periwinkle focus:border-brand-periwinkle transition"
                  />
                  {creatorSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setCreatorSearchQuery('');
                        setReceiverDisplayName('');
                        fetchCreatorSuggestions('');
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#919099] hover:text-white cursor-pointer p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Dropdown Suggestions */}
                {showDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-white/10 bg-[#161926] shadow-2xl backdrop-blur-2xl overflow-hidden max-h-80 overflow-y-auto divide-y divide-white/5">
                    {isSearchingCreators ? (
                      <div className="p-4 text-center text-xs text-[#919099] flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-brand-periwinkle" />
                        <span>Đang tìm kiếm nghệ sĩ...</span>
                      </div>
                    ) : creatorResults.length > 0 ? (
                      <>
                        <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#919099] bg-white/[0.02]">
                          Gợi ý nghệ sĩ ({creatorResults.length})
                        </div>
                        {creatorResults.map((creator) => (
                          <div
                            key={creator.userId}
                            onClick={() => handleSelectCreator(creator)}
                            className="px-4 py-3 hover:bg-brand-periwinkle/10 cursor-pointer transition flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-brand-navy border border-white/10 flex items-center justify-center shrink-0">
                                {creator.avatarUrl ? (
                                  <img
                                    src={creator.avatarUrl}
                                    alt={creator.displayName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-bold text-brand-periwinkle uppercase">
                                    {creator.displayName.slice(0, 2)}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white group-hover:text-brand-periwinkle transition truncate">
                                    {creator.displayName}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-[#919099] border border-white/5">
                                    Creator
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#919099] truncate mt-0.5">
                                  {creator.headline || creator.specialties || 'Chưa cập nhật giới thiệu'}
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0 flex flex-col items-end gap-1">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                                  creator.availableSlots > 0
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}
                              >
                                {creator.availableSlots > 0 ? `${creator.availableSlots} slot` : 'Kín slot'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="p-6 text-center text-xs text-[#919099]">
                        <p className="font-medium text-[#C7C5CF]">Không tìm thấy nghệ sĩ phù hợp</p>
                        <p className="text-[11px] text-[#919099] mt-1">
                          Bạn có thể gửi đề nghị với tên &quot;{creatorSearchQuery}&quot; hoặc nhập mã Creator ID.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {prefilledReceiverName && !selectedCreator && (
              <p className="text-xs text-brand-periwinkle mt-1.5 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Gửi đề nghị đến: <strong>{prefilledReceiverName}</strong>
              </p>
            )}
          </div>

          {/* Trade Title */}
          <div>
            <label className="block text-xs font-bold text-[#C7C5CF] uppercase tracking-wider mb-2">
              Trade Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fantasy OC Portrait Exchange"
              maxLength={120}
              required
              className="w-full px-4 py-3 bg-[#161926] border border-white/10 rounded-2xl text-sm text-white placeholder-[#919099] focus:outline-none focus:ring-1 focus:ring-brand-periwinkle focus:border-brand-periwinkle transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#C7C5CF] uppercase tracking-wider mb-2">
              General Overview / Guidelines <span className="text-[#919099]">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any general notes, preferred canvas dimensions, art style or background rules..."
              rows={3}
              maxLength={1000}
              className="w-full px-4 py-3 bg-[#161926] border border-white/10 rounded-2xl text-sm text-white placeholder-[#919099] focus:outline-none focus:ring-1 focus:ring-brand-periwinkle focus:border-brand-periwinkle transition resize-none"
            />
          </div>

          {/* Dual Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Side A Note: What I will draw */}
            <div className="p-4 rounded-2xl bg-brand-periwinkle/[0.06] border border-brand-periwinkle/20">
              <label className="block text-xs font-bold text-brand-periwinkle uppercase tracking-wider mb-2">
                What you will draw for your partner <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={initiatorRequestNote}
                onChange={(e) => setInitiatorRequestNote(e.target.value)}
                placeholder="Describe what subject, character, or style you pledge to illustrate for your partner..."
                rows={4}
                required
                className="w-full px-3.5 py-2.5 bg-[#161926] border border-white/10 rounded-xl text-xs text-white placeholder-[#919099] focus:outline-none focus:ring-1 focus:ring-brand-periwinkle focus:border-brand-periwinkle transition resize-none"
              />

              {/* Multiple Reference Images for Side A */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-brand-periwinkle font-semibold">
                    Ảnh mẫu tham khảo (Reference Images)
                  </span>
                  <span className="text-[10px] text-[#919099]">
                    {initiatorImages.length} ảnh
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {initiatorImages.map((url, idx) => (
                    <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border border-brand-periwinkle/30 bg-black/40">
                      <img src={url} alt="Ref" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setInitiatorImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full bg-black/80 text-white hover:bg-rose-600 transition flex cursor-pointer shadow-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-brand-periwinkle/30 bg-brand-periwinkle/5 text-brand-periwinkle hover:border-brand-periwinkle hover:text-white transition">
                    {uploadingInitiatorImg ? (
                      <Loader2 className="w-4 h-4 animate-spin text-brand-periwinkle" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mb-0.5" />
                        <span className="text-[10px] font-medium">Thêm ảnh</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploadingInitiatorImg}
                      onChange={handleUploadInitiatorImg}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Side B Note: What I request */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/15">
              <label className="block text-xs font-bold text-[#C7C5CF] uppercase tracking-wider mb-2">
                What you want your partner to draw <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={receiverRequestNote}
                onChange={(e) => setReceiverRequestNote(e.target.value)}
                placeholder="Describe your character, references, pose preferences or mood you want them to draw..."
                rows={4}
                required
                className="w-full px-3.5 py-2.5 bg-[#161926] border border-white/10 rounded-xl text-xs text-white placeholder-[#919099] focus:outline-none focus:ring-1 focus:ring-brand-periwinkle focus:border-brand-periwinkle transition resize-none"
              />

              {/* Multiple Reference Images for Side B */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-[#C7C5CF] font-semibold">
                    Ảnh mẫu tham khảo (Reference Images)
                  </span>
                  <span className="text-[10px] text-[#919099]">
                    {receiverImages.length} ảnh
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {receiverImages.map((url, idx) => (
                    <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border border-white/20 bg-black/40">
                      <img src={url} alt="Ref" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setReceiverImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full bg-black/80 text-white hover:bg-rose-600 transition flex cursor-pointer shadow-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/25 bg-white/[0.03] text-[#C7C5CF] hover:border-brand-periwinkle hover:text-white transition">
                    {uploadingReceiverImg ? (
                      <Loader2 className="w-4 h-4 animate-spin text-brand-periwinkle" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mb-0.5" />
                        <span className="text-[10px] font-medium">Thêm ảnh</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploadingReceiverImg}
                      onChange={handleUploadReceiverImg}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Submission Deadline Selection */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-[#C7C5CF] uppercase tracking-wider mb-3">
              Proposed Submission Deadline <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {deadlineOptions.map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setSubmissionDeadlineDays(opt.days)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    submissionDeadlineDays === opt.days
                      ? 'bg-brand-periwinkle/15 border-brand-periwinkle text-white shadow-lg'
                      : 'bg-[#161926] border-white/10 text-[#919099] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">{opt.label}</span>
                    <Calendar className="w-3.5 h-3.5 opacity-70" />
                  </div>
                  <p className="text-[11px] text-[#919099]">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Safety Notice */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3 text-xs text-[#919099]">
            <ShieldCheck className="w-5 h-5 text-brand-periwinkle shrink-0 mt-0.5" />
            <p>
              Once accepted, both Creators enter the Drawing Phase. After both upload their original art, watermarked previews will be available for mutual verification before non-watermarked original downloads are unlocked.
            </p>
          </div>

          {/* Submit Action */}
          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-white/10">
            {slotStatus && slotStatus.availableSlots <= 0 ? (
              <p className="text-xs text-amber-300/90 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Bạn đã dùng hết {slotStatus.totalSlots} slot ({slotStatus.activeTradesCount} kèo đang chạy). Vui lòng hoàn tất kèo cũ để mở khóa nút gửi.</span>
              </p>
            ) : (
              <div />
            )}

            <div className="flex items-center justify-end gap-4">
              <Link
                href="/art-trades"
                className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-[#919099] hover:text-white hover:bg-white/5 transition"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting || (slotStatus ? slotStatus.availableSlots <= 0 || !slotStatus.canTrade : false)}
                className="commission-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg transition disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending Proposal...
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="w-4 h-4" /> Send Trade Proposal
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateArtTradePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center text-[#919099]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-periwinkle mb-3" />
          <p className="text-xs font-medium">Loading trade creation workspace...</p>
        </div>
      }
    >
      <CreateArtTradeContent />
    </Suspense>
  );
}
