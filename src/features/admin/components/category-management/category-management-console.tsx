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
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#B24A26]">
            Taxonomy &amp; Discovery Governance
          </p>
          <h1 className="font-h1 text-2xl font-bold text-[#241F1A] mt-1 flex items-center gap-2.5">
            <FolderKanban className="w-6 h-6 text-[#B24A26]" />
            <span>Quản lý Danh mục lớn &amp; Trending Tags</span>
          </h1>
          <p className="text-xs text-[#6E6459] mt-1"> Quản lý danh mục chuẩn trên họa sĩ xưởng vẽ, Marketplace, Rate Card và gộp/thăng hạng các tag xu hướng. </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadOverview()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] hover:bg-[#F0E7D8] text-xs font-semibold text-[#241F1A] transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#B24A26] hover:bg-[#8C3718] text-[#F7F2E9] text-xs font-bold transition shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm danh mục lớn</span>
          </button>
        </div>
      </div>

      {/* Section 1: Broad Categories */}
      <section className="glass-container bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-[28px] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#221E1A]/10 pb-3">
          <div>
            <h2 className="font-h1 text-base font-bold text-[#241F1A]"> Danh mục lớn ({categories.length})
            </h2>
            <p className="text-xs text-[#6E6459]"> Khuyến nghị duy trì 6–8 danh mục cốt lõi để AI Auto-Tagging và bộ lọc hoạt động chính xác. </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center gap-2 text-xs text-[#6E6459]">
            <Loader2 className="w-4 h-4 animate-spin text-[#B24A26]" />
            <span>Đang tải danh sách danh mục...</span>
          </div>
        ) : categories.length === 0 ? (
          <p className="py-10 text-center text-xs text-[#6E6459]">Chưa có danh mục nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-[#6E6459] border-b border-[#221E1A]/10">
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
              <tbody className="divide-y divide-[#221E1A]/10 text-[#241F1A]/90">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[#FFFCF6] transition">
                    <td className="py-3 px-3 font-mono text-[#B24A26]">#{cat.displayOrder}</td>
                    <td className="py-3 px-3 font-bold text-[#241F1A]">{cat.name}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-[#6E6459]">{cat.slug}</td>
                    <td className="py-3 px-3 text-[#6E6459] max-w-xs truncate">
                      {cat.description || <span className="italic text-[#4A423A]">Chưa có mô tả</span>}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-[#8C3718]">
                      {cat.artworkCount}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          cat.isActive
                            ? 'bg-[#2F6B63]/15 text-[#2F6B63] border-[#2F6B63]/40'
                            : 'bg-[#F0E7D8] text-[#4A423A] border-[#221E1A]/10'
                        }`}
                      >
                        {cat.isActive ? 'Đang bật' : 'Tạm ẩn'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(cat)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFFCF6] hover:bg-[#F0E7D8] border border-[#221E1A]/10 text-xs text-[#241F1A] transition cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Sửa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCategory(cat)}
                        disabled={busy}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#A8321C]/10 hover:bg-[#A8321C]/20 border border-[#A8321C]/40 text-xs text-[#A8321C] transition cursor-pointer disabled:opacity-50"
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
      <section className="glass-container bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-[28px] p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#221E1A]/10 pb-3">
          <div>
            <h2 className="font-h1 text-base font-bold text-[#241F1A] flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#B24A26]" />
              <span>Trending Tags ({trendingTags.length})</span>
            </h2>
            <p className="text-xs text-[#6E6459]"> Theo dõi các tag con có nhiều tác phẩm nhất để gộp các tag trùng nghĩa hoặc thăng hạng thành danh mục lớn. </p>
          </div>

          {selectedTagIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#B24A26]/35 bg-[#B24A26]/10 px-3 py-2 text-xs">
              <span className="font-semibold text-[#241F1A]">
                Đã chọn {selectedTagIds.length} tag · Gộp vào:
              </span>
              <select
                value={targetTagId}
                onChange={(e) => setTargetTagId(e.target.value)}
                className="rounded-lg border border-[#221E1A]/10 bg-[#F0E7D8] px-2.5 py-1 text-xs text-[#241F1A] outline-none focus:border-[#B24A26]"
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
                className="inline-flex items-center gap-1 rounded-lg bg-[#B24A26] hover:bg-[#8C3718] px-3 py-1 font-bold text-[#F7F2E9] disabled:opacity-40 cursor-pointer"
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
                className="p-1 text-[#6E6459] hover:text-[#241F1A] cursor-pointer"
                title="Bỏ chọn"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-10 text-center text-xs text-[#6E6459]">Đang tải Trending Tags...</div>
        ) : trendingTags.length === 0 ? (
          <p className="py-10 text-center text-xs text-[#6E6459]"> Chưa có tag nào được gắn trên tác phẩm. </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trendingTags.map((tag) => {
              const checked = selectedTagIds.includes(tag.tagId);
              return (
                <div
                  key={tag.tagId}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition ${
                    checked
                      ? 'border-[#B24A26]/60 bg-[#B24A26]/10'
                      : 'border-[#221E1A]/10 bg-[#F0E7D8]/25 hover:border-[#221E1A]/20'
                  }`}
                >
                  <label className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelectTag(tag.tagId)}
                      className="h-4 w-4 accent-[#B24A26] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-[#241F1A]">#{tag.name}</p>
                      <p className="text-[11px] text-[#6E6459]">
                        {tag.artworkCount} tác phẩm
                        {tag.isAiGenerated ? ' · AI gợi ý' : ''}
                      </p>
                    </div>
                  </label>

                  <button
                    type="button"
                    onClick={() => openPromoteModal(tag)}
                    title="Thăng hạng tag thành danh mục lớn"
                    className="inline-flex items-center gap-1 shrink-0 rounded-xl border border-[#2F6B63]/40 bg-[#2F6B63]/10 hover:bg-[#2F6B63]/20 px-2.5 py-1.5 text-[11px] font-semibold text-[#2F6B63] transition cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#F0E7D8]/75 p-4 backdrop-blur-sm"
          onClick={() => !busy && setModalOpen(false)}
        >
          <form
            onSubmit={handleSaveCategory}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-h1 text-lg font-bold text-[#241F1A]">
                {editingCategory ? 'Cập nhật danh mục lớn' : 'Tạo danh mục lớn mới'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-[#6E6459] hover:text-[#241F1A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block text-[#6E6459]">
                Tên danh mục *
                <input
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ví dụ: Anime / Manga"
                  className="mt-1.5 w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-2.5 text-[#241F1A] outline-none focus:border-[#B24A26]"
                />
              </label>

              <label className="block text-[#6E6459]"> Slug (tùy chọn, tự tạo nếu để trống) <input
                  maxLength={120}
                  value={form.slug ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="anime-manga"
                  className="mt-1.5 w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-2.5 font-mono text-[#241F1A] outline-none focus:border-[#B24A26]"
                />
              </label>

              <label className="block text-[#6E6459]"> Mô tả ngắn <textarea
                  maxLength={500}
                  rows={3}
                  value={form.description ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Mô tả gu tranh của danh mục..."
                  className="mt-1.5 w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-2.5 text-[#241F1A] outline-none focus:border-[#B24A26]"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-[#6E6459]"> Thứ tự hiển thị <input
                    type="number"
                    min={0}
                    value={form.displayOrder}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, displayOrder: Number(e.target.value) || 0 }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-2.5 text-[#241F1A] outline-none focus:border-[#B24A26]"
                  />
                </label>

                <label className="flex items-center gap-2.5 pt-6 text-[#241F1A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="h-4 w-4 accent-[#B24A26]"
                  />
                  <span>Đang hoạt động</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#221E1A]/10">
              <button
                type="button"
                disabled={busy}
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-[#221E1A]/10 px-4 py-2 text-xs text-[#6E6459] hover:bg-[#FFFCF6] cursor-pointer"
              > Hủy </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#B24A26] hover:bg-[#8C3718] px-4 py-2 text-xs font-bold text-[#F7F2E9] disabled:opacity-50 cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#F0E7D8]/75 p-4 backdrop-blur-sm"
          onClick={() => !busy && setPromotingTag(null)}
        >
          <form
            onSubmit={handleConfirmPromote}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-h1 text-lg font-bold text-[#241F1A]">
                Thăng hạng tag #{promotingTag.name}
              </h3>
              <button
                type="button"
                onClick={() => setPromotingTag(null)}
                className="rounded-lg p-1.5 text-[#6E6459] hover:text-[#241F1A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#6E6459]">
              Tạo danh mục lớn mới (hoặc kích hoạt nếu đã tồn tại) và tự động gắn vào các tác phẩm đang có tag{' '}
              <strong className="text-[#241F1A]">#{promotingTag.name}</strong> ({promotingTag.artworkCount} tranh).
            </p>

            <div className="space-y-3 text-xs">
              <label className="block text-[#6E6459]">
                Tên danh mục lớn *
                <input
                  required
                  maxLength={100}
                  value={promoteName}
                  onChange={(e) => setPromoteName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-2.5 text-[#241F1A] outline-none focus:border-[#B24A26]"
                />
              </label>

              <label className="block text-[#6E6459]"> Mô tả ngắn <input
                  maxLength={500}
                  value={promoteDesc}
                  onChange={(e) => setPromoteDesc(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-2.5 text-[#241F1A] outline-none focus:border-[#B24A26]"
                />
              </label>

              <label className="flex items-start gap-2.5 text-[#6E6459] cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignOnlyUnassigned}
                  onChange={(e) => setAssignOnlyUnassigned(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#B24A26]"
                />
                <span>Chỉ gán cho tranh chưa có danh mục lớn (giữ nguyên các tranh đã phân loại trước đó)</span>
              </label>

              <label className="flex items-start gap-2.5 text-[#6E6459] cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteTagAfterPromote}
                  onChange={(e) => setDeleteTagAfterPromote(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#B24A26]"
                />
                <span>Xóa tag #{promotingTag.name} khỏi hệ thống sau khi thăng hạng</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#221E1A]/10">
              <button
                type="button"
                disabled={busy}
                onClick={() => setPromotingTag(null)}
                className="rounded-xl border border-[#221E1A]/10 px-4 py-2 text-xs text-[#6E6459] hover:bg-[#FFFCF6] cursor-pointer"
              > Hủy </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F6B63]/10 hover:bg-[#2F6B63]/10 px-4 py-2 text-xs font-bold text-[#FFFCF6] disabled:opacity-50 cursor-pointer"
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
