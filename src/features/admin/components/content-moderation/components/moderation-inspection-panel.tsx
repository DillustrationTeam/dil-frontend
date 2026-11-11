'use client';

import React, { useEffect, useState } from 'react';
import { ArtworkScanPanel } from '@/features/artwork-ai';
import { Loader2, Plus, Save, ShieldCheck, Tags, X } from 'lucide-react';
import {
  categoriesService,
  type CategoryDto,
} from '@/features/marketplace/services/categories.service';
import {
  ArtworkInspectionDetailDto,
  ModerationActionType,
} from '@/features/admin/types/moderation.types';
import { ArtworkPreviewCard } from './artwork-preview-card';
import { AiScanMetricsCard } from './ai-scan-metrics-card';
import { ArtworkDuplicateCheckCard } from './artwork-duplicate-check-card';
import { ModerationDecisionForm } from './moderation-decision-form';

interface ModerationInspectionPanelProps {
  artwork: ArtworkInspectionDetailDto | null;
  isLoading: boolean;
  isSubmitting: boolean;
  onExecuteDecision: (
    artworkId: string,
    action: ModerationActionType,
    moderationNote?: string
  ) => Promise<boolean>;
  onUpdateMetadata?: (
    artworkId: string,
    payload: { categoryId?: string | null; tags?: string[] }
  ) => Promise<boolean>;
  onClose?: () => void;
}

function ModerationMetadataEditor({
  artwork,
  categories,
  onSave,
}: {
  artwork: ArtworkInspectionDetailDto;
  categories: CategoryDto[];
  onSave: (artworkId: string, payload: { categoryId?: string | null; tags?: string[] }) => Promise<boolean>;
}) {
  const [categoryId, setCategoryId] = useState<string>(artwork.categoryId ?? '');
  const [tags, setTags] = useState<string[]>(() => artwork.tags.map((t) => t.name));
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddTag = () => {
    const cleaned = tagInput.trim().replace(/^#+/, '');
    if (!cleaned || cleaned.length > 50 || tags.length >= 10) return;
    if (!tags.some((t) => t.toLowerCase() === cleaned.toLowerCase())) {
      setTags((prev) => [...prev, cleaned]);
    }
    setTagInput('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(artwork.artworkId, {
        categoryId: categoryId || null,
        tags,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#C5C9F8]">
          <Tags className="w-3.5 h-3.5 text-[#A7ACD9]" />
          <span>Phân loại Danh mục &amp; Tag con</span>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#A7ACD9] hover:bg-[#b8bde4] px-3 py-1.5 text-[11px] font-bold text-[#1F2335] transition disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-3 h-3" />
          <span>{saving ? 'Đang lưu...' : 'Lưu phân loại'}</span>
        </button>
      </div>

      <div className="space-y-2.5 text-xs">
        <label className="block text-[11px] text-[#8A8FA9]">
          Danh mục lớn (Category)
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#141724] px-3 py-2 text-xs text-white outline-none focus:border-[#A7ACD9]"
          >
            <option value="">-- Chưa chọn danh mục --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="block text-[11px] text-[#8A8FA9] mb-1">Tag con ({tags.length}/10)</span>
          <div className="flex gap-1.5">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Thêm tag mới..."
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#141724] px-3 py-1.5 text-xs text-white outline-none focus:border-[#A7ACD9]"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 text-[#A7ACD9] cursor-pointer"
              aria-label="Thêm tag"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-[#A7ACD9]/15 border border-[#A7ACD9]/25 px-2.5 py-0.5 text-[11px] font-semibold text-[#C5C9F8]"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((item) => item !== tag))}
                    className="hover:text-white cursor-pointer"
                    aria-label={`Xóa tag ${tag}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ModerationInspectionPanel({
  artwork,
  isLoading,
  isSubmitting,
  onExecuteDecision,
  onUpdateMetadata,
  onClose,
}: ModerationInspectionPanelProps) {
  const [categories, setCategories] = useState<CategoryDto[]>([]);

  useEffect(() => {
    let active = true;
    categoriesService
      .getCategories()
      .then((list) => {
        if (active) setCategories(list);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  if (isLoading && !artwork) {
    return (
      <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-12 flex flex-col items-center justify-center min-h-[300px] text-center space-y-3">
        <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
        <p className="font-h1 font-bold text-white text-sm">
          Loading Artwork Inspection Details...
        </p>
        <p className="text-xs text-[#8A8FA9]">
          Đang tải thông tin tác phẩm và kết quả kiểm tra.
        </p>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-10 flex flex-col items-center justify-center text-center space-y-3">
        <ShieldCheck className="w-10 h-10 text-[#8A8FA9]/40" />
        <p className="font-h1 font-bold text-white text-base">
          No Artwork Selected for Inspection
        </p>
        <p className="text-xs text-[#8A8FA9] max-w-md">
          Select any flagged artwork from the queue above to review AI NSFW scan breakdown, tag classifications, and execute moderation actions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-h1 font-bold text-lg text-white flex items-center gap-2">
          <span>Inspection Console</span>
          <span className="text-xs font-mono text-[#8A8FA9]">
            [Item #{artwork.artworkId.substring(0, 8)}]
          </span>
        </h2>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 text-xs text-[#8A8FA9] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Collapse Panel</span>
          </button>
        )}
      </div>

      {/* Detailed Inspection Panel (Selected Item) matching SCR-20 grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Image Preview & AI Tags (50% / col-span-6) */}
        <div className="md:col-span-6">
          <ArtworkPreviewCard artwork={artwork} />
        </div>

        {/* Right Column: AI NSFW Metrics Breakdown & Moderator Action Form (50% / col-span-6) */}
        <div className="md:col-span-6 glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 space-y-6 flex flex-col justify-between">
          {/* Category & Tag Correction Editor */}
          {onUpdateMetadata && (
            <ModerationMetadataEditor
              key={`${artwork.artworkId}:${artwork.categoryId ?? ''}:${artwork.tags.map((t) => t.name).join(',')}`}
              artwork={artwork}
              categories={categories}
              onSave={onUpdateMetadata}
            />
          )}

          {/* AI Confidence Scores */}
          <AiScanMetricsCard artwork={artwork} />
          <ArtworkDuplicateCheckCard key={`dup-${artwork.artworkId}`} artworkId={artwork.artworkId} />
          <ArtworkScanPanel key={artwork.artworkId} artworkId={artwork.artworkId} canRetry={['Pending', 'Flagged'].includes(artwork.moderationStatus)} />

          {/* Moderator Decision Form */}
          <ModerationDecisionForm
            artworkId={artwork.artworkId}
            isSubmitting={isSubmitting}
            currentStatus={artwork.moderationStatus}
            onExecuteDecision={onExecuteDecision}
          />
        </div>
      </div>
    </div>
  );
}
