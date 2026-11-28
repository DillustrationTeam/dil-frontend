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
  Search,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { getErrorMessage } from '@/lib/api-error';
import { useLanguage } from '@/context/language-context';
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
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [trendingTags, setTrendingTags] = useState<TrendingTagDto[]>([]);
  const [tagSearch, setTagSearch] = useState('');
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
      toast.error(getErrorMessage(err, isVie ? 'Không tải được danh mục và Trending Tags.' : 'Unable to load categories and trending tags.'));
    } finally {
      setLoading(false);
    }
  }, [isVie]);

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
      toast.error(isVie ? 'Vui lòng nhập tên danh mục.' : 'Please enter a category name.');
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
        toast.success(isVie ? 'Đã cập nhật danh mục.' : 'Category updated.');
      } else {
        await adminCategoriesService.createCategory(payload);
        toast.success(isVie ? 'Đã tạo danh mục mới.' : 'Category created.');
      }
      setModalOpen(false);
      await loadOverview();
    } catch (err) {
      toast.error(getErrorMessage(err, isVie ? 'Không thể lưu danh mục.' : 'Unable to save category.'));
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCategory = async (cat: CategoryDto) => {
    const confirmMsg = isVie
      ? `Xóa danh mục "${cat.name}"? Các tác phẩm thuộc danh mục này sẽ chuyển về chưa phân loại.`
      : `Delete category "${cat.name}"? Artworks in this category will become uncategorized.`;
    if (!window.confirm(confirmMsg)) {
      return;
    }
    setBusy(true);
    try {
      await adminCategoriesService.deleteCategory(cat.id);
      toast.success(isVie ? `Đã xóa danh mục "${cat.name}".` : `Deleted category "${cat.name}".`);
      await loadOverview();
    } catch (err) {
      toast.error(getErrorMessage(err, isVie ? 'Không thể xóa danh mục.' : 'Unable to delete category.'));
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

  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    return categories.filter((cat) => {
      if (categoryStatusFilter === 'active' && !cat.isActive) return false;
      if (categoryStatusFilter === 'inactive' && cat.isActive) return false;
      if (q && !cat.name.toLowerCase().includes(q) && !cat.slug.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [categories, categorySearch, categoryStatusFilter]);

  const filteredTrendingTags = useMemo(() => {
    const q = tagSearch.trim().toLowerCase().replace(/^#+/, '');
    if (!q) return trendingTags;
    return trendingTags.filter((t) => t.name.toLowerCase().includes(q));
  }, [trendingTags, tagSearch]);

  const selectedTags = useMemo(
    () => trendingTags.filter((t) => selectedTagIds.includes(t.tagId)),
    [trendingTags, selectedTagIds]
  );

  const handleMergeTags = async () => {
    if (selectedTagIds.length < 2 || !targetTagId) {
      toast.error(isVie ? 'Chọn ít nhất 2 tag và 1 tag đích để gộp.' : 'Select at least 2 tags and 1 target tag to merge.');
      return;
    }
    const sourceIds = selectedTagIds.filter((id) => id !== targetTagId);
    if (sourceIds.length === 0) {
      toast.error(isVie ? 'Cần ít nhất 1 tag nguồn khác tag đích.' : 'Select at least 1 source tag different from the target tag.');
      return;
    }

    setMerging(true);
    try {
      const result = await adminCategoriesService.mergeTags(sourceIds, targetTagId);
      toast.success(
        isVie
          ? `Đã gộp ${sourceIds.length} tag (${result.affectedArtworks} tác phẩm được cập nhật).`
          : `Merged ${sourceIds.length} tag(s) (${result.affectedArtworks} artwork(s) updated).`
      );
      setSelectedTagIds([]);
      setTargetTagId('');
      await loadOverview();
    } catch (err) {
      toast.error(getErrorMessage(err, isVie ? 'Không thể gộp tag.' : 'Unable to merge tags.'));
    } finally {
      setMerging(false);
    }
  };

  const openPromoteModal = (tag: TrendingTagDto) => {
    setPromotingTag(tag);
    setPromoteName(tag.name);
    setPromoteDesc(isVie ? `Danh mục mở rộng từ tag #${tag.name}` : `Category promoted from tag #${tag.name}`);
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
        isVie
          ? `Đã thăng hạng "${result.category.name}" và gán cho ${result.assignedArtworks} tác phẩm.`
          : `Promoted "${result.category.name}" and assigned to ${result.assignedArtworks} artwork(s).`
      );
      setPromotingTag(null);
      await loadOverview();
    } catch (err) {
      toast.error(getErrorMessage(err, isVie ? 'Không thể thăng hạng tag.' : 'Unable to promote tag.'));
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
            {isVie ? 'Quản trị Phân loại & Khám phá' : 'Taxonomy & Discovery Governance'}
          </p>
          <h1 className="font-h1 text-2xl font-bold text-[#241F1A] mt-1 flex items-center gap-2.5">
            <FolderKanban className="w-6 h-6 text-[#B24A26]" />
            <span>{isVie ? 'Quản lý Danh mục lớn & Trending Tags' : 'Category & Trending Tag Management'}</span>
          </h1>
          <p className="text-xs text-[#6E6459] mt-1">
            {isVie
              ? 'Quản lý danh mục chuẩn trên xưởng vẽ họa sĩ, Marketplace, Rate Card và gộp/thăng hạng các tag xu hướng.'
              : 'Manage standard categories across Creator Studio, Marketplace, and Rate Cards, and merge or promote trending tags.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadOverview()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] hover:bg-[#F0E7D8] text-xs font-semibold text-[#241F1A] transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isVie ? 'Làm mới' : 'Refresh'}</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#B24A26] hover:bg-[#8C3718] text-[#F7F2E9] text-xs font-bold transition shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isVie ? 'Thêm danh mục lớn' : 'Add Category'}</span>
          </button>
        </div>
      </div>

      {/* Section 1: Broad Categories */}
      <section className="glass-container bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-[28px] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#221E1A]/10 pb-3">
          <div>
            <h2 className="font-h1 text-base font-bold text-[#241F1A]">
              {isVie ? `Danh mục lớn (${filteredCategories.length}/${categories.length})` : `Broad Categories (${filteredCategories.length}/${categories.length})`}
            </h2>
            <p className="text-xs text-[#6E6459]">
              {isVie
                ? 'Khuyến nghị duy trì 6–8 danh mục cốt lõi để AI Auto-Tagging và bộ lọc hoạt động chính xác.'
                : 'Recommended: keep 6–8 core categories so AI Auto-Tagging and filters work accurately.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-60 sm:flex-initial">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#746A5F]" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder={isVie ? 'Tìm theo tên hoặc slug...' : 'Search by name or slug...'}
                aria-label={isVie ? 'Tìm danh mục theo tên hoặc slug' : 'Search categories by name or slug'}
                className="admin-cat-control w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] py-1.5 pl-8 pr-7 text-xs text-[#241F1A] placeholder:text-[#746A5F] outline-none focus:border-[#B24A26]"
              />
              {categorySearch && (
                <button
                  type="button"
                  onClick={() => setCategorySearch('')}
                  aria-label={isVie ? 'Xóa tìm kiếm' : 'Clear search'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#746A5F] hover:text-[#241F1A] cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <select
              value={categoryStatusFilter}
              onChange={(e) => setCategoryStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              aria-label={isVie ? 'Lọc theo trạng thái' : 'Filter by status'}
              className="admin-cat-control rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-1.5 text-xs text-[#241F1A] outline-none focus:border-[#B24A26] cursor-pointer"
            >
              <option value="all">{isVie ? 'Tất cả trạng thái' : 'All statuses'}</option>
              <option value="active">{isVie ? 'Đang bật' : 'Active'}</option>
              <option value="inactive">{isVie ? 'Tạm ẩn' : 'Hidden'}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center gap-2 text-xs text-[#6E6459]">
            <Loader2 className="w-4 h-4 animate-spin text-[#B24A26]" />
            <span>{isVie ? 'Đang tải danh sách danh mục...' : 'Loading categories...'}</span>
          </div>
        ) : categories.length === 0 ? (
          <p className="py-10 text-center text-xs text-[#6E6459]">
            {isVie ? 'Chưa có danh mục nào.' : 'No categories yet.'}
          </p>
        ) : filteredCategories.length === 0 ? (
          <p className="py-10 text-center text-xs text-[#6E6459]">
            {isVie ? 'Không tìm thấy danh mục phù hợp.' : 'No matching categories found.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-[#6E6459] border-b border-[#221E1A]/10">
                <tr>
                  <th className="py-3 px-3">{isVie ? 'Thứ tự' : 'Order'}</th>
                  <th className="py-3 px-3">{isVie ? 'Tên danh mục' : 'Category Name'}</th>
                  <th className="py-3 px-3">Slug</th>
                  <th className="py-3 px-3">{isVie ? 'Mô tả' : 'Description'}</th>
                  <th className="py-3 px-3">{isVie ? 'Số tranh' : 'Artworks'}</th>
                  <th className="py-3 px-3">{isVie ? 'Trạng thái' : 'Status'}</th>
                  <th className="py-3 px-3 text-right">{isVie ? 'Thao tác' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#221E1A]/10 text-[#241F1A]/90">
                {filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[#FFFCF6] transition">
                    <td className="py-3 px-3 font-mono text-[#B24A26]">#{cat.displayOrder}</td>
                    <td className="py-3 px-3 font-bold text-[#241F1A]">{cat.name}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-[#6E6459]">{cat.slug}</td>
                    <td className="py-3 px-3 text-[#6E6459] max-w-xs truncate">
                      {cat.description || <span className="italic text-[#4A423A]">{isVie ? 'Chưa có mô tả' : 'No description'}</span>}
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
                        {cat.isActive ? (isVie ? 'Đang bật' : 'Active') : (isVie ? 'Tạm ẩn' : 'Hidden')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(cat)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFFCF6] hover:bg-[#F0E7D8] border border-[#221E1A]/10 text-xs text-[#241F1A] transition cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isVie ? 'Sửa' : 'Edit'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCategory(cat)}
                        disabled={busy}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#A8321C]/10 hover:bg-[#A8321C]/20 border border-[#A8321C]/40 text-xs text-[#A8321C] transition cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{isVie ? 'Xóa' : 'Delete'}</span>
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
              <span>Trending Tags ({filteredTrendingTags.length}/{trendingTags.length})</span>
            </h2>
            <p className="text-xs text-[#6E6459]">
              {isVie
                ? 'Theo dõi các tag con có nhiều tác phẩm nhất để gộp các tag trùng nghĩa hoặc thăng hạng thành danh mục lớn.'
                : 'Monitor sub-tags with the most artworks to merge duplicates or promote them into broad categories.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-56 sm:flex-initial">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#746A5F]" />
              <input
                type="text"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                placeholder={isVie ? 'Tìm tag...' : 'Search tags...'}
                aria-label={isVie ? 'Tìm trending tag' : 'Search trending tags'}
                className="admin-cat-control w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] py-1.5 pl-8 pr-7 text-xs text-[#241F1A] placeholder:text-[#746A5F] outline-none focus:border-[#B24A26]"
              />
              {tagSearch && (
                <button
                  type="button"
                  onClick={() => setTagSearch('')}
                  aria-label={isVie ? 'Xóa tìm kiếm' : 'Clear search'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#746A5F] hover:text-[#241F1A] cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

          {selectedTagIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#B24A26]/35 bg-[#B24A26]/10 px-3 py-2 text-xs">
              <span className="font-semibold text-[#241F1A]">
                {isVie ? `Đã chọn ${selectedTagIds.length} tag · Gộp vào:` : `${selectedTagIds.length} selected · Merge into:`}
              </span>
              <select
                value={targetTagId}
                onChange={(e) => setTargetTagId(e.target.value)}
                className="rounded-lg border border-[#221E1A]/10 bg-[#F0E7D8] px-2.5 py-1 text-xs text-[#241F1A] outline-none focus:border-[#B24A26]"
              >
                {selectedTags.map((t) => (
                  <option key={t.tagId} value={t.tagId}>
                    #{t.name} ({t.artworkCount} {isVie ? 'tranh' : 'artworks'})
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
                <span>{merging ? (isVie ? 'Đang gộp...' : 'Merging...') : (isVie ? '1-Click Gộp Tag' : '1-Click Merge Tags')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTagIds([]);
                  setTargetTagId('');
                }}
                className="p-1 text-[#6E6459] hover:text-[#241F1A] cursor-pointer"
                title={isVie ? 'Bỏ chọn' : 'Clear selection'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-xs text-[#6E6459]">
            {isVie ? 'Đang tải Trending Tags...' : 'Loading trending tags...'}
          </div>
        ) : trendingTags.length === 0 ? (
          <p className="py-10 text-center text-xs text-[#6E6459]">
            {isVie ? 'Chưa có tag nào được gắn trên tác phẩm.' : 'No tags attached to artworks yet.'}
          </p>
        ) : filteredTrendingTags.length === 0 ? (
          <p className="py-10 text-center text-xs text-[#6E6459]">
            {isVie ? 'Không tìm thấy tag phù hợp.' : 'No matching tags found.'}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTrendingTags.map((tag) => {
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
                        {tag.artworkCount} {isVie ? 'tác phẩm' : 'artworks'}
                        {tag.isAiGenerated ? (isVie ? ' · AI gợi ý' : ' · AI suggested') : ''}
                      </p>
                    </div>
                  </label>

                  <button
                    type="button"
                    onClick={() => openPromoteModal(tag)}
                    title={isVie ? 'Thăng hạng tag thành danh mục lớn' : 'Promote tag to broad category'}
                    className="inline-flex items-center gap-1 shrink-0 rounded-xl border border-[#2F6B63]/40 bg-[#2F6B63]/10 hover:bg-[#2F6B63]/20 px-2.5 py-1.5 text-[11px] font-semibold text-[#2F6B63] transition cursor-pointer"
                  >
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                    <span>{isVie ? 'Thăng hạng' : 'Promote'}</span>
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
                {editingCategory
                  ? (isVie ? 'Cập nhật danh mục lớn' : 'Edit Category')
                  : (isVie ? 'Tạo danh mục lớn mới' : 'Create New Category')}
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
                {isVie ? 'Tên danh mục *' : 'Category Name *'}
                <input
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={isVie ? 'Ví dụ: Anime / Manga' : 'e.g. Anime / Manga'}
                  className="mt-1.5 w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-2.5 text-[#241F1A] outline-none focus:border-[#B24A26]"
                />
              </label>

              <label className="block text-[#6E6459]">
                {isVie ? 'Slug (tùy chọn, tự tạo nếu để trống)' : 'Slug (optional, auto-generated if blank)'}
                <input
                  maxLength={120}
                  value={form.slug ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="anime-manga"
                  className="mt-1.5 w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-2.5 font-mono text-[#241F1A] outline-none focus:border-[#B24A26]"
                />
              </label>

              <label className="block text-[#6E6459]">
                {isVie ? 'Mô tả ngắn' : 'Short Description'}
                <textarea
                  maxLength={500}
                  rows={3}
                  value={form.description ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder={isVie ? 'Mô tả gu tranh của danh mục...' : 'Describe the art style of this category...'}
                  className="mt-1.5 w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-2.5 text-[#241F1A] outline-none focus:border-[#B24A26]"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-[#6E6459]">
                  {isVie ? 'Thứ tự hiển thị' : 'Display Order'}
                  <input
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
                  <span>{isVie ? 'Đang hoạt động' : 'Active'}</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#221E1A]/10">
              <button
                type="button"
                disabled={busy}
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-[#221E1A]/10 px-4 py-2 text-xs text-[#6E6459] hover:bg-[#FFFCF6] cursor-pointer"
              >
                {isVie ? 'Hủy' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#B24A26] hover:bg-[#8C3718] px-4 py-2 text-xs font-bold text-[#F7F2E9] disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{busy ? (isVie ? 'Đang lưu...' : 'Saving...') : (isVie ? 'Lưu danh mục' : 'Save Category')}</span>
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
                {isVie ? `Thăng hạng tag #${promotingTag.name}` : `Promote tag #${promotingTag.name}`}
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
              {isVie ? (
                <>
                  Tạo danh mục lớn mới (hoặc kích hoạt nếu đã tồn tại) và tự động gắn vào các tác phẩm đang có tag{' '}
                  <strong className="text-[#241F1A]">#{promotingTag.name}</strong> ({promotingTag.artworkCount} tranh).
                </>
              ) : (
                <>
                  Create a new broad category (or activate if it already exists) and automatically assign it to artworks tagged{' '}
                  <strong className="text-[#241F1A]">#{promotingTag.name}</strong> ({promotingTag.artworkCount} artworks).
                </>
              )}
            </p>

            <div className="space-y-3 text-xs">
              <label className="block text-[#6E6459]">
                {isVie ? 'Tên danh mục lớn *' : 'Category Name *'}
                <input
                  required
                  maxLength={100}
                  value={promoteName}
                  onChange={(e) => setPromoteName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-2.5 text-[#241F1A] outline-none focus:border-[#B24A26]"
                />
              </label>

              <label className="block text-[#6E6459]">
                {isVie ? 'Mô tả ngắn' : 'Short Description'}
                <input
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
                <span>
                  {isVie
                    ? 'Chỉ gán cho tranh chưa có danh mục lớn (giữ nguyên các tranh đã phân loại trước đó)'
                    : 'Only assign to uncategorized artworks (keep existing category assignments)'}
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-[#6E6459] cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteTagAfterPromote}
                  onChange={(e) => setDeleteTagAfterPromote(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#B24A26]"
                />
                <span>
                  {isVie
                    ? `Xóa tag #${promotingTag.name} khỏi hệ thống sau khi thăng hạng`
                    : `Delete tag #${promotingTag.name} from the system after promoting`}
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#221E1A]/10">
              <button
                type="button"
                disabled={busy}
                onClick={() => setPromotingTag(null)}
                className="rounded-xl border border-[#221E1A]/10 px-4 py-2 text-xs text-[#6E6459] hover:bg-[#FFFCF6] cursor-pointer"
              >
                {isVie ? 'Hủy' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F6B63]/10 hover:bg-[#2F6B63]/10 px-4 py-2 text-xs font-bold text-[#FFFCF6] disabled:opacity-50 cursor-pointer"
              >
                <ArrowUpCircle className="w-3.5 h-3.5" />
                <span>{busy ? (isVie ? 'Đang xử lý...' : 'Processing...') : (isVie ? 'Xác nhận thăng hạng' : 'Confirm Promote')}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
