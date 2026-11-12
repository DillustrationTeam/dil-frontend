'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowUpCircle,
  Check,
  Edit3,
  FolderKanban,
  GitMerge,
  Loader2,
  Plus,
  RefreshCw,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { getErrorMessage } from '@/lib/api-error';
import type { CategoryDto } from '@/features/marketplace/services/categories.service';
import {
  adminCategoriesService,
  type TrendingTagDto,
  type UpsertCategoryRequest,
} from '@/features/admin/services/categories.service';

const EMPTY_FORM: UpsertCategoryRequest = {
  name: '',
  slug: '',
  description: '',
  displayOrder: 0,
  isActive: true,
};

export function CategoryManagementConsole() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [trendingTags, setTrendingTags] = useState<TrendingTagDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Category modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
  const [form, setForm] = useState<UpsertCategoryRequest>(EMPTY_FORM);

  // Tag merge state
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [targetTagId, setTargetTagId] = useState<string>('');
  const [merging, setMerging] = useState(false);

  // Tag promote modal state
  const [promotingTag, setPromotingTag] = useState<TrendingTagDto | null>(null);
  const [promoteName, setPromoteName] = useState('');
  const [promoteDesc, setPromoteDesc] = useState('');
  const [assignOnlyUnassigned, setAssignOnlyUnassigned] = useState(true);
  const [deleteTagAfterPromote, setDeleteTagAfterPromote] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminCategoriesService.getOverview(40);
      setCategories(data.categories);
      setTrendingTags(data.trendingTags);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không tải được danh mục và Trending Tags.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setForm({
      ...EMPTY_FORM,
      displayOrder: categories.length + 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (cat: CategoryDto) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? '',
      displayOrder: cat.displayOrder,
      isActive: cat.isActive,
    });
    setModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên danh mục.');
      return;
    }

    setBusy(true);
    try {
      const payload: UpsertCategoryRequest = {
        name: form.name.trim(),
        slug: form.slug?.trim() || null,
        description: form.description?.trim() || null,
        displayOrder: Number(form.displayOrder) || 0,
        isActive: form.isActive,
      };
      if (editingCategory) {
        await adminCategoriesService.updateCategory(editingCategory.id, payload);
        toast.success('Đã cập nhật danh mục.');
      } else {
        await adminCategoriesService.createCategory(payload);
        toast.success('Đã tạo danh mục mới.');
      }
      setModalOpen(false);
      await loadOverview();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu danh mục.'));
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCategory = async (cat: CategoryDto) => {
    if (!window.confirm(`Xóa danh mục "${cat.name}"? Các tác phẩm thuộc danh mục này sẽ chuyển về chưa phân loại.`)) {
      return;
    }
    setBusy(true);
    try {
      await adminCategoriesService.deleteCategory(cat.id);
      toast.success(`Đã xóa danh mục "${cat.name}".`);
      await loadOverview();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa danh mục.'));
    } finally {
      setBusy(false);
    }
  };

  const toggleSelectTag = (tagId: string) => {
    setSelectedTagIds((prev) => {
      const next = prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId];
      if (!next.includes(targetTagId)) {
        setTargetTagId(next[0] ?? '');
      }
      return next;
    });
  };

  const selectedTags = useMemo(
    () => trendingTags.filter((t) => selectedTagIds.includes(t.tagId)),
    [trendingTags, selectedTagIds]
  );

  const handleMergeTags = async () => {
    if (selectedTagIds.length < 2 || !targetTagId) {
      toast.error('Chọn ít nhất 2 tag và 1 tag đích để gộp.');
      return;
    }
    const sourceIds = selectedTagIds.filter((id) => id !== targetTagId);
    if (sourceIds.length === 0) {
      toast.error('Cần ít nhất 1 tag nguồn khác tag đích.');
      return;
    }

    setMerging(true);
    try {
      const result = await adminCategoriesService.mergeTags(sourceIds, targetTagId);
      toast.success(`Đã gộp ${sourceIds.length} tag (${result.affectedArtworks} tác phẩm được cập nhật).`);
      setSelectedTagIds([]);
      setTargetTagId('');
      await loadOverview();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gộp tag.'));
    } finally {
      setMerging(false);
    }
  };

  const openPromoteModal = (tag: TrendingTagDto) => {
    setPromotingTag(tag);
    setPromoteName(tag.name);
    setPromoteDesc(`Danh mục mở rộng từ tag #${tag.name}`);
    setAssignOnlyUnassigned(true);
    setDeleteTagAfterPromote(false);
  };

  const handleConfirmPromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promotingTag || !promoteName.trim()) return;

    setBusy(true);
    try {
      const result = await adminCategoriesService.promoteTag(promotingTag.tagId, {
        categoryName: promoteName.trim(),
        description: promoteDesc.trim() || null,
        displayOrder: categories.length + 1,
        assignOnlyUnassigned,
        deleteTagAfterPromote,
      });
      toast.success(
        `Đã thăng hạng "${result.category.name}" và gán cho ${result.assignedArtworks} tác phẩm.`
      );
      setPromotingTag(null);
      await loadOverview();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thăng hạng tag.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#A7ACD9]">
            Taxonomy &amp; Discovery Governance
          </p>
          <h1 className="font-h1 text-2xl font-bold text-white mt-1 flex items-center gap-2.5">
            <FolderKanban className="w-6 h-6 text-[#A7ACD9]" />
            <span>Quản lý Danh mục lớn &amp; Trending Tags</span>
          </h1>
          <p className="text-xs text-[#8A8FA9] mt-1">
            Quản lý danh mục chuẩn trên Creator Studio, Marketplace, Rate Card và gộp/thăng hạng các tag xu hướng.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadOverview()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#A7ACD9] hover:bg-[#b8bde4] text-[#1F2335] text-xs font-bold transition shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm danh mục lớn</span>
          </button>
        </div>
      </div>

      {/* Section 1: Broad Categories */}
      <section className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="font-h1 text-base font-bold text-white">
              Danh mục lớn ({categories.length})
            </h2>
            <p className="text-xs text-[#8A8FA9]">
              Khuyến nghị duy trì 6–8 danh mục cốt lõi để AI Auto-Tagging và bộ lọc hoạt động chính xác.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center gap-2 text-xs text-[#8A8FA9]">
            <Loader2 className="w-4 h-4 animate-spin text-[#A7ACD9]" />
            <span>Đang tải danh sách danh mục...</span>
          </div>
        ) : categories.length === 0 ? (
          <p className="py-10 text-center text-xs text-[#8A8FA9]">Chưa có danh mục nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-[#8A8FA9] border-b border-white/10">
                <tr>
                  <th className="py-3 px-3">Thứ tự</th>
                  <th className="py-3 px-3">Tên danh mục</th>
                  <th className="py-3 px-3">Slug</th>
                  <th className="py-3 px-3">Mô tả</th>
                  <th className="py-3 px-3">Số tranh</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/90">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-white/[0.03] transition">
                    <td className="py-3 px-3 font-mono text-[#A7ACD9]">#{cat.displayOrder}</td>
                    <td className="py-3 px-3 font-bold text-white">{cat.name}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-[#8A8FA9]">{cat.slug}</td>
                    <td className="py-3 px-3 text-[#C7C5CF] max-w-xs truncate">
                      {cat.description || <span className="italic text-white/30">Chưa có mô tả</span>}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-[#C5C9F8]">
                      {cat.artworkCount}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          cat.isActive
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-white/10 text-white/60 border-white/15'
                        }`}
                      >
                        {cat.isActive ? 'Đang bật' : 'Tạm ẩn'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(cat)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white transition cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Sửa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCategory(cat)}
                        disabled={busy}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs text-rose-300 transition cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Xóa</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 2: Trending Tags & 1-Click Merge / Promote */}
      <section className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-3">
          <div>
            <h2 className="font-h1 text-base font-bold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#A7ACD9]" />
              <span>Trending Tags ({trendingTags.length})</span>
            </h2>
            <p className="text-xs text-[#8A8FA9]">
              Theo dõi các tag con có nhiều tác phẩm nhất để gộp các tag trùng nghĩa hoặc thăng hạng thành danh mục lớn.
            </p>
          </div>

          {selectedTagIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#A7ACD9]/35 bg-[#A7ACD9]/10 px-3 py-2 text-xs">
              <span className="font-semibold text-white">
                Đã chọn {selectedTagIds.length} tag · Gộp vào:
              </span>
              <select
                value={targetTagId}
                onChange={(e) => setTargetTagId(e.target.value)}
                className="rounded-lg border border-white/15 bg-[#141724] px-2.5 py-1 text-xs text-white outline-none focus:border-[#A7ACD9]"
              >
                {selectedTags.map((t) => (
                  <option key={t.tagId} value={t.tagId}>
                    #{t.name} ({t.artworkCount} tranh)
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={selectedTagIds.length < 2 || merging}
                onClick={() => void handleMergeTags()}
                className="inline-flex items-center gap-1 rounded-lg bg-[#A7ACD9] hover:bg-[#b8bde4] px-3 py-1 font-bold text-[#1F2335] disabled:opacity-40 cursor-pointer"
              >
                <GitMerge className="w-3.5 h-3.5" />
                <span>{merging ? 'Đang gộp...' : '1-Click Gộp Tag'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTagIds([]);
                  setTargetTagId('');
                }}
                className="p-1 text-[#8A8FA9] hover:text-white cursor-pointer"
                title="Bỏ chọn"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-10 text-center text-xs text-[#8A8FA9]">Đang tải Trending Tags...</div>
        ) : trendingTags.length === 0 ? (
          <p className="py-10 text-center text-xs text-[#8A8FA9]">
            Chưa có tag nào được gắn trên tác phẩm.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trendingTags.map((tag) => {
              const checked = selectedTagIds.includes(tag.tagId);
              return (
                <div
                  key={tag.tagId}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition ${
                    checked
                      ? 'border-[#A7ACD9]/60 bg-[#A7ACD9]/10'
                      : 'border-white/10 bg-black/25 hover:border-white/20'
                  }`}
                >
                  <label className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelectTag(tag.tagId)}
                      className="h-4 w-4 accent-[#A7ACD9] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-white">#{tag.name}</p>
                      <p className="text-[11px] text-[#8A8FA9]">
                        {tag.artworkCount} tác phẩm
                        {tag.isAiGenerated ? ' · AI gợi ý' : ''}
                      </p>
                    </div>
                  </label>

                  <button
                    type="button"
                    onClick={() => openPromoteModal(tag)}
                    title="Thăng hạng tag thành danh mục lớn"
                    className="inline-flex items-center gap-1 shrink-0 rounded-xl border border-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300 transition cursor-pointer"
                  >
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                    <span>Thăng hạng</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Create / Edit Category Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => !busy && setModalOpen(false)}
        >
          <form
            onSubmit={handleSaveCategory}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-white/15 bg-[#191d2e] p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-h1 text-lg font-bold text-white">
                {editingCategory ? 'Cập nhật danh mục lớn' : 'Tạo danh mục lớn mới'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-[#8A8FA9] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block text-[#C7C5CF]">
                Tên danh mục *
                <input
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ví dụ: Anime / Manga"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#121521] px-3 py-2.5 text-white outline-none focus:border-[#A7ACD9]"
                />
              </label>

              <label className="block text-[#C7C5CF]">
                Slug (tùy chọn, tự tạo nếu để trống)
                <input
                  maxLength={120}
                  value={form.slug ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="anime-manga"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#121521] px-3 py-2.5 font-mono text-white outline-none focus:border-[#A7ACD9]"
                />
              </label>

              <label className="block text-[#C7C5CF]">
                Mô tả ngắn
                <textarea
                  maxLength={500}
                  rows={3}
                  value={form.description ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Mô tả gu tranh của danh mục..."
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#121521] px-3 py-2.5 text-white outline-none focus:border-[#A7ACD9]"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-[#C7C5CF]">
                  Thứ tự hiển thị
                  <input
                    type="number"
                    min={0}
                    value={form.displayOrder}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, displayOrder: Number(e.target.value) || 0 }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#121521] px-3 py-2.5 text-white outline-none focus:border-[#A7ACD9]"
                  />
                </label>

                <label className="flex items-center gap-2.5 pt-6 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="h-4 w-4 accent-[#A7ACD9]"
                  />
                  <span>Đang hoạt động</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                disabled={busy}
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs text-[#C7C5CF] hover:bg-white/5 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#A7ACD9] hover:bg-[#b8bde4] px-4 py-2 text-xs font-bold text-[#1F2335] disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{busy ? 'Đang lưu...' : 'Lưu danh mục'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Promote Tag to Category Modal */}
      {promotingTag && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => !busy && setPromotingTag(null)}
        >
          <form
            onSubmit={handleConfirmPromote}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-white/15 bg-[#191d2e] p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-h1 text-lg font-bold text-white">
                Thăng hạng tag #{promotingTag.name}
              </h3>
              <button
                type="button"
                onClick={() => setPromotingTag(null)}
                className="rounded-lg p-1.5 text-[#8A8FA9] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#8A8FA9]">
              Tạo danh mục lớn mới (hoặc kích hoạt nếu đã tồn tại) và tự động gắn vào các tác phẩm đang có tag{' '}
              <strong className="text-white">#{promotingTag.name}</strong> ({promotingTag.artworkCount} tranh).
            </p>

            <div className="space-y-3 text-xs">
              <label className="block text-[#C7C5CF]">
                Tên danh mục lớn *
                <input
                  required
                  maxLength={100}
                  value={promoteName}
                  onChange={(e) => setPromoteName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#121521] px-3 py-2.5 text-white outline-none focus:border-[#A7ACD9]"
                />
              </label>

              <label className="block text-[#C7C5CF]">
                Mô tả ngắn
                <input
                  maxLength={500}
                  value={promoteDesc}
                  onChange={(e) => setPromoteDesc(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#121521] px-3 py-2.5 text-white outline-none focus:border-[#A7ACD9]"
                />
              </label>

              <label className="flex items-start gap-2.5 text-[#C7C5CF] cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignOnlyUnassigned}
                  onChange={(e) => setAssignOnlyUnassigned(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#A7ACD9]"
                />
                <span>Chỉ gán cho tranh chưa có danh mục lớn (giữ nguyên các tranh đã phân loại trước đó)</span>
              </label>

              <label className="flex items-start gap-2.5 text-[#C7C5CF] cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteTagAfterPromote}
                  onChange={(e) => setDeleteTagAfterPromote(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#A7ACD9]"
                />
                <span>Xóa tag #{promotingTag.name} khỏi hệ thống sau khi thăng hạng</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                disabled={busy}
                onClick={() => setPromotingTag(null)}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs text-[#C7C5CF] hover:bg-white/5 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 px-4 py-2 text-xs font-bold text-[#14221b] disabled:opacity-50 cursor-pointer"
              >
                <ArrowUpCircle className="w-3.5 h-3.5" />
                <span>{busy ? 'Đang xử lý...' : 'Xác nhận thăng hạng'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
