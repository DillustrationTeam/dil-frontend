'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Eye, EyeOff, Plus, RotateCcw, Minus, X, Check, ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';
import type { Milestone } from '@/types/commission.types';
import { addonService, type CommissionAddon } from '@/services/addon.service';

export interface StickyNoteItem {
  id: string;
  milestoneId?: string;
  type: 'revision' | 'addon' | 'custom';
  title: string;
  subtitle?: string;
  isDone: boolean;
  leftPct: number;
  topPct: number;
  isCollapsed?: boolean;
  createdAt: string;
  autoSourceKey?: string;
}

interface WorkroomStickyNotesProps {
  commissionId: string;
  displayedMilestone?: Milestone | null;
  isCreator: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onOpenApprovalModal?: () => void;
}

export const WorkroomStickyNotes: React.FC<WorkroomStickyNotesProps> = ({
  commissionId,
  displayedMilestone,
  isCreator,
  containerRef,
  onOpenApprovalModal,
}) => {
  const [notes, setNotes] = useState<StickyNoteItem[]>([]);
  const [allNotesVisible, setAllNotesVisible] = useState<boolean>(true);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [expandedContentIds, setExpandedContentIds] = useState<Record<string, boolean>>({});

  const storageKey = `workroom_notes_v1_${commissionId}`;

  const loadNotesFromStorage = useCallback((): StickyNoteItem[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore JSON parse error
    }
    return [];
  }, [storageKey]);

  const saveNotesToStorage = useCallback((items: StickyNoteItem[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [storageKey]);

  // Sync / Auto-seed notes from current milestone and addons
  useEffect(() => {
    let isCancelled = false;

    const syncNotes = async () => {
      const existing = loadNotesFromStorage();
      let updated = [...existing];
      let changed = false;

      // 1. Auto-seed revision feedback if milestone is in RevisionRequested
      if (
        displayedMilestone &&
        displayedMilestone.status === 'RevisionRequested' &&
        displayedMilestone.revisionFeedback
      ) {
        const revKey = `rev_${displayedMilestone.id}_${displayedMilestone.revisionCount}`;
        const hasNote = updated.some((n) => n.autoSourceKey === revKey);
        if (!hasNote) {
          const newRevNote: StickyNoteItem = {
            id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            milestoneId: displayedMilestone.id,
            type: 'revision',
            title: `Sửa mốc #${displayedMilestone.sequence}`,
            subtitle: displayedMilestone.revisionFeedback,
            isDone: false,
            leftPct: 38,
            topPct: 18,
            isCollapsed: false,
            createdAt: new Date().toISOString(),
            autoSourceKey: revKey,
          };
          updated.push(newRevNote);
          changed = true;
        }
      }

      // 2. Fetch approved addons from backend to auto-seed addon notes
      try {
        const addonList: CommissionAddon[] = await addonService.list(commissionId);
        if (!isCancelled && addonList && addonList.length > 0) {
          const activeAddons = addonList.filter(
            (a) => a.status === 'Accepted' || a.status === 'Proposed'
          );

          activeAddons.forEach((addon, idx) => {
            const addonKey = `addon_${addon.id}`;
            const hasNote = updated.some((n) => n.autoSourceKey === addonKey);
            if (!hasNote) {
              const newAddonNote: StickyNoteItem = {
                id: `addon-${Date.now()}-${idx}`,
                milestoneId: displayedMilestone?.id,
                type: 'addon',
                title: addon.title,
                subtitle: addon.extendDays ? `+${addon.extendDays} ngày gia hạn` : 'Gói phát sinh',
                isDone: false,
                leftPct: 16 + (idx % 2) * 5,
                topPct: 15 + idx * 22,
                isCollapsed: false,
                createdAt: new Date().toISOString(),
                autoSourceKey: addonKey,
              };
              updated.push(newAddonNote);
              changed = true;
            }
          });
        }
      } catch {
        // quiet failure if offline or no addons
      }

      if (!isCancelled) {
        if (changed) {
          saveNotesToStorage(updated);
        }
        setNotes(updated);
      }
    };

    syncNotes();

    return () => {
      isCancelled = true;
    };
  }, [commissionId, displayedMilestone, loadNotesFromStorage, saveNotesToStorage]);

  // Current milestone visible notes
  const currentMilestoneNotes = notes.filter((n) => {
    if (!displayedMilestone) return true;
    return !n.milestoneId || n.milestoneId === displayedMilestone.id;
  });

  const totalCount = currentMilestoneNotes.length;
  const doneCount = currentMilestoneNotes.filter((n) => n.isDone).length;

  // Toggle complete (Creator only)
  const handleToggleDone = (id: string) => {
    if (!isCreator) return;
    setNotes((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, isDone: !n.isDone } : n));
      saveNotesToStorage(next);
      return next;
    });
  };

  // Toggle collapse to pin
  const handleToggleCollapse = (id: string) => {
    setNotes((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, isCollapsed: !n.isCollapsed } : n));
      saveNotesToStorage(next);
      return next;
    });
  };

  // Toggle expand long content
  const handleToggleExpandContent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedContentIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Remove note (Creator only)
  const handleRemoveNote = (id: string) => {
    if (!isCreator) return;
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      saveNotesToStorage(next);
      return next;
    });
  };

  // Add manual note (Creator only)
  const handleAddManualNote = () => {
    if (!isCreator) return;
    const text = prompt('Nhập nội dung ghi chú cần dán lên tranh:', 'Lưu ý vẽ thêm phụ kiện...');
    if (!text || !text.trim()) return;

    const newNote: StickyNoteItem = {
      id: `manual-${Date.now()}`,
      milestoneId: displayedMilestone?.id,
      type: 'custom',
      title: text.trim(),
      subtitle: 'Ghi chú công việc riêng ♡',
      isDone: false,
      leftPct: 18,
      topPct: 55,
      isCollapsed: false,
      createdAt: new Date().toISOString(),
    };

    setNotes((prev) => {
      const next = [...prev, newNote];
      saveNotesToStorage(next);
      return next;
    });
  };

  // Reset positions (Creator only)
  const handleResetPositions = () => {
    if (!isCreator) return;
    setNotes((prev) => {
      const next = prev.map((n, idx) => ({
        ...n,
        isCollapsed: false,
        leftPct: 15 + (idx % 2) * 35,
        topPct: 15 + Math.floor(idx / 2) * 25,
      }));
      saveNotesToStorage(next);
      return next;
    });
  };

  // Drag logic (Creator only)
  const dragStartRef = useRef<{
    noteId: string;
    startX: number;
    startY: number;
    elemStartLeft: number;
    elemStartTop: number;
  } | null>(null);

  const onPointerDown = (e: React.PointerEvent, note: StickyNoteItem) => {
    if (!isCreator) return;

    const target = e.target as HTMLElement;
    if (target.closest('input') || target.closest('button')) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    e.preventDefault();
    e.stopPropagation();

    const noteElem = e.currentTarget as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    const noteRect = noteElem.getBoundingClientRect();

    dragStartRef.current = {
      noteId: note.id,
      startX: e.clientX,
      startY: e.clientY,
      elemStartLeft: noteRect.left - containerRect.left,
      elemStartTop: noteRect.top - containerRect.top,
    };

    setActiveDragId(note.id);
    (e.target as Element).setPointerCapture?.(e.pointerId);

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!dragStartRef.current) return;
      const { startX, startY, elemStartLeft, elemStartTop, noteId } = dragStartRef.current;

      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      const cRect = container.getBoundingClientRect();
      let newLeft = elemStartLeft + dx;
      let newTop = elemStartTop + dy;

      newLeft = Math.max(8, Math.min(newLeft, cRect.width - 90));
      newTop = Math.max(8, Math.min(newTop, cRect.height - 50));

      const pctX = (newLeft / cRect.width) * 100;
      const pctY = (newTop / cRect.height) * 100;

      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? { ...n, leftPct: Math.round(pctX * 10) / 10, topPct: Math.round(pctY * 10) / 10 }
            : n
        )
      );
    };

    const onPointerUp = () => {
      if (dragStartRef.current) {
        setNotes((prev) => {
          saveNotesToStorage(prev);
          return prev;
        });
      }
      dragStartRef.current = null;
      setActiveDragId(null);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <>
      {/* Mini Controls Pill on Canvas Top Right Corner */}
      <div className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1.5 p-1 rounded-xl bg-[#181A28]/95 border border-purple-500/30 shadow-lg backdrop-blur-md text-xs select-none">
        {allNotesVisible && (
          <>
            {/* Nút 1: Thêm Note mới (Creator) */}
            {isCreator && (
              <button
                type="button"
                onClick={handleAddManualNote}
                className="h-[22px] px-2.5 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 text-white border border-fuchsia-400/40 shadow-xs transition"
                title="Dán một note ghi chú mới lên tranh"
              >
                <Plus size={11} />
                <span>Thêm Note</span>
              </button>
            )}

            {/* Nút 2: Sắp xếp lại vị trí (Creator) */}
            {isCreator && totalCount > 0 && (
              <button
                type="button"
                onClick={handleResetPositions}
                className="h-[22px] w-[22px] flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition"
                title="Sắp xếp lại vị trí các note"
              >
                <RotateCcw size={10} />
              </button>
            )}

            {/* Huy hiệu tiến độ */}
            {totalCount > 0 && (
              <span
                className={`h-[22px] px-2 flex items-center justify-center rounded-lg text-[9px] font-bold border ${
                  doneCount === totalCount
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : 'bg-purple-500/20 text-purple-200 border-purple-500/30'
                }`}
              >
                {doneCount === totalCount ? '✓ Xong hết ♡' : `${doneCount}/${totalCount} xong`}
              </span>
            )}
          </>
        )}

        {/* Nút Ẩn/Hiện Notes (Nằm ở bên phải ngoài cùng) */}
        <button
          type="button"
          onClick={() => setAllNotesVisible((v) => !v)}
          className={`h-[22px] px-2.5 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 transition border ${
            allNotesVisible
              ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40 shadow-xs'
              : 'bg-white/5 text-slate-400 hover:text-white border-white/10'
          }`}
          title={allNotesVisible ? 'Ẩn tạm các note trên tranh' : 'Hiện lại các note'}
        >
          {allNotesVisible ? <Eye size={11} /> : <EyeOff size={11} />}
          <span>{allNotesVisible ? `Notes (${totalCount})` : 'Hiện Notes'}</span>
        </button>
      </div>

      {/* Layer Sticky Notes */}
      {allNotesVisible && (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          {currentMilestoneNotes.map((note, idx) => {
            const isDragging = activeDragId === note.id;
            const isContentExpanded = !!expandedContentIds[note.id];
            const isLongText = (note.subtitle && note.subtitle.length > 50) || (note.title && note.title.length > 40);

            let badgeText = 'Ghi chú';
            let badgeBg = 'bg-[#EC4899]';
            let washiClass = 'bg-amber-200/90';
            let stickerIcon = '✏️';

            if (note.type === 'revision') {
              badgeText = `Sửa mốc #${displayedMilestone?.sequence ?? ''}`;
              badgeBg = 'bg-[#EE60D0]';
              washiClass = 'bg-pink-200/90';
              stickerIcon = '✏️';
            } else if (note.type === 'addon') {
              badgeText = 'Gói Add-on';
              badgeBg = 'bg-[#9333EA]';
              washiClass = 'bg-purple-200/90';
              stickerIcon = '✨';
            } else {
              badgeText = 'Note riêng';
              badgeBg = 'bg-[#059669]';
              washiClass = 'bg-emerald-200/90';
              stickerIcon = '🌿';
            }

            return (
              <div
                key={note.id}
                onPointerDown={(e) => onPointerDown(e, note)}
                style={{
                  left: `${note.leftPct}%`,
                  top: `${note.topPct}%`,
                }}
                className={`absolute pointer-events-auto select-none transition-shadow duration-150 ${
                  isCreator ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                } ${
                  isDragging
                    ? 'z-50 scale-105 shadow-[0_15px_25px_-6px_rgba(0,0,0,0.5),0_0_20px_rgba(217,70,239,0.35)]'
                    : 'z-20'
                }`}
              >
                {!note.isCollapsed ? (
                  /* ================= COMPACT MEMO CARD VIEW ================= */
                  <div
                    className="relative rounded-xl p-2.5 pt-3 border-2 border-purple-200/90 shadow-[0_8px_20px_rgba(0,0,0,0.4)] w-[190px] sm:w-[215px] text-slate-800 transition-all duration-200"
                    style={{
                      backgroundColor: '#FFFFFF',
                      backgroundImage:
                        'repeating-linear-gradient(transparent, transparent 23px, #F1E8FD 23px, #F1E8FD 25px)',
                      backgroundPosition: '0 6px',
                    }}
                  >
                    {/* Washi Tape Strip on Top Center (Compact) */}
                    <div
                      className={`absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-3 rounded-xs shadow-xs backdrop-blur-xs border-l-2 border-r-2 border-dashed border-white/70 ${washiClass}`}
                      style={{
                        transform: `translateX(-50%) rotate(${idx % 2 === 0 ? '-1.5deg' : '1.5deg'})`,
                      }}
                    />

                    {/* Cute sticker on top right (Compact) */}
                    <div className="absolute -top-2.5 right-1 text-sm rotate-[18deg] filter drop-shadow-xs pointer-events-none select-none">
                      {stickerIcon}
                    </div>

                    {/* Header: Tag + Actions */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide text-white shadow-xs ${badgeBg}`}
                      >
                        {badgeText}
                      </span>

                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleToggleCollapse(note.id)}
                          title="Thu nhỏ thành tem ghim"
                          className="size-4 rounded-full hover:bg-purple-100 text-purple-400 hover:text-purple-700 flex items-center justify-center transition"
                        >
                          <Minus size={9} />
                        </button>
                        {isCreator && (
                          <button
                            type="button"
                            onClick={() => handleRemoveNote(note.id)}
                            title="Gỡ note"
                            className="size-4 rounded-full hover:bg-rose-100 text-rose-400 hover:text-rose-600 flex items-center justify-center transition"
                          >
                            <X size={9} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Note Content */}
                    <div className="space-y-0.5 pt-0.5 text-xs">
                      <label
                        className={`flex items-start gap-1.5 ${
                          isCreator ? 'cursor-pointer group' : 'cursor-default'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={note.isDone}
                          disabled={!isCreator}
                          onChange={() => handleToggleDone(note.id)}
                          className={`mt-0.5 size-3.5 rounded-full border-2 border-purple-300 text-fuchsia-500 focus:ring-0 ${
                            isCreator ? 'cursor-pointer' : 'cursor-default pointer-events-none'
                          }`}
                        />
                        <span
                          className={`text-[11px] text-slate-800 leading-tight font-bold ${
                            !isContentExpanded ? 'line-clamp-2' : ''
                          } ${note.isDone ? 'line-through opacity-50' : ''}`}
                        >
                          {note.title} <span className="text-fuchsia-500 font-normal">♡</span>
                        </span>
                      </label>

                      {note.subtitle && (
                        <div
                          className={`text-[10px] text-slate-600 pl-5 leading-tight italic ${
                            isContentExpanded
                              ? 'max-h-[120px] overflow-y-auto pr-1 scrollbar-thin'
                              : 'line-clamp-2'
                          } ${note.isDone ? 'line-through opacity-40' : ''}`}
                        >
                          &ldquo;{note.subtitle}&rdquo;
                        </div>
                      )}

                      {/* Expand / Collapse Action & Redline shortcut for long notes */}
                      {(isLongText || (note.type === 'revision' && displayedMilestone?.revisionFeedbackImageUrl)) && (
                        <div className="flex items-center justify-between pl-5 pt-1 mt-1 border-t border-purple-100/80">
                          {isLongText ? (
                            <button
                              type="button"
                              onClick={(e) => handleToggleExpandContent(note.id, e)}
                              className="inline-flex items-center gap-0.5 text-[9px] font-bold text-purple-600 hover:text-purple-800 transition py-0.5"
                            >
                              <span>{isContentExpanded ? 'Thu gọn' : 'Xem thêm'}</span>
                              {isContentExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                            </button>
                          ) : <span />}

                          {note.type === 'revision' && displayedMilestone?.revisionFeedbackImageUrl && onOpenApprovalModal && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenApprovalModal();
                              }}
                              className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 rounded transition shadow-2xs"
                              title="Mở xem ảnh khoanh vùng sửa (Redline) phóng to"
                            >
                              <Maximize2 size={8} />
                              <span>Ảnh vẽ sửa</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* ================= COLLAPSED PIN STAMP VIEW (COMPACT) ================= */
                  <div
                    onClick={() => handleToggleCollapse(note.id)}
                    className="cursor-pointer flex items-center gap-1.5 group"
                  >
                    <div className="relative size-7 rounded-xl bg-white border-2 border-fuchsia-400 text-fuchsia-600 font-extrabold text-[11px] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-1 bg-pink-300/80 rounded-xs" />
                      {note.isDone ? <Check size={11} className="text-emerald-500" /> : idx + 1}
                    </div>
                    <div className="hidden group-hover:flex items-center px-2 py-0.5 rounded-lg bg-white text-slate-800 border-2 border-purple-200 text-[10px] shadow-lg font-bold whitespace-nowrap">
                      {stickerIcon} {note.title.slice(0, 18)}...
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};
