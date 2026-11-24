'use client';

import React, { useCallback, useEffect, useState, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/language-context';
import { PermissionsStats } from './permissions-stats';
import { PermissionsTable, JuryPermissionMember } from './permissions-table';
import { InviteJuryCard } from './invite-jury-card';
import { juryService } from '../../../services/jury.service';
import { eventService } from '../../../services/event.service';
import type { EventListItemDto } from '../../../types/event.types';



export const EVENT_ALIAS_MAP: Record<string, string> = {
  'cyber-2026': 'e1000000-0000-0000-0000-000000000001',
  'aur-2026': '7843030d-0582-4079-a4c0-3d61dfde47ff',
  'fantasy-2026': 'e2000000-0000-0000-0000-000000000002',
};

export const REVERSE_EVENT_ALIAS_MAP: Record<string, string> = {
  'e1000000-0000-0000-0000-000000000001': 'cyber-2026',
  '7843030d-0582-4079-a4c0-3d61dfde47ff': 'aur-2026',
  'e2000000-0000-0000-0000-000000000002': 'fantasy-2026',
};

export function resolveEventId(id?: string | null): string {
  if (!id) return '';
  return EVENT_ALIAS_MAP[id] || id;
}

export function matchesEventId(eventId?: string | null, targetId?: string | null): boolean {
  if (!targetId || targetId === 'all') return true;
  if (!eventId) return false;
  const evNorm = eventId.toLowerCase();
  const targetNorm = targetId.toLowerCase();
  if (evNorm === targetNorm) return true;
  if (EVENT_ALIAS_MAP[targetId]?.toLowerCase() === evNorm) return true;
  if (REVERSE_EVENT_ALIAS_MAP[targetId]?.toLowerCase() === evNorm) return true;
  if (EVENT_ALIAS_MAP[eventId]?.toLowerCase() === targetNorm) return true;
  if (REVERSE_EVENT_ALIAS_MAP[eventId]?.toLowerCase() === targetNorm) return true;
  return false;
}

const emptySubscribe = () => () => {};

export interface ContestSearchSelectProps {
  events: EventListItemDto[];
  selectedEventId: string;
  onSelectEvent: (eventId: string) => void;
  showAllOption?: boolean;
}

export function ContestSearchSelect({
  events,
  selectedEventId,
  onSelectEvent,
  showAllOption = false,
}: ContestSearchSelectProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 320 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ALL_CONTESTS_ITEM: EventListItemDto = {
    id: 'all',
    title: isVie ? 'Tất cả cuộc thi (Toàn hàng đợi)' : 'All Contests (Queue-wide)',
    status: 'All',
  } as EventListItemDto;

  // Real backend events
  const baseEvents = events;
  const allEvents = showAllOption ? [ALL_CONTESTS_ITEM, ...baseEvents] : baseEvents;

  const selectedEvent =
    selectedEventId === 'all'
      ? ALL_CONTESTS_ITEM
      : allEvents.find((e) => matchesEventId(e.id, selectedEventId));

  const updateCoords = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 6,
        left: rect.left,
        width: Math.max(rect.width, 320),
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
      return () => {
        window.removeEventListener('resize', updateCoords);
        window.removeEventListener('scroll', updateCoords, true);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        const target = e.target as HTMLElement;
        if (!target.closest?.('.contest-dropdown-portal')) {
          setIsOpen(false);
          setQuery('');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredEvents = allEvents.filter((evt) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const titleStr = String(evt.title || '').toLowerCase();
    const statusStr = String(evt.status || '').toLowerCase();
    return titleStr.includes(q) || statusStr.includes(q);
  });

  const displayValue = isOpen ? query : (selectedEvent?.title || '');

  return (
    <div ref={containerRef} className="relative min-w-[300px] sm:min-w-[420px]">
      {/* 1. Primary Searchbar Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-periwinkle pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onFocus={() => {
            setIsOpen(true);
            setQuery('');
            updateCoords();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            updateCoords();
          }}
          placeholder={selectedEvent ? selectedEvent.title : (isVie ? 'Nhập để tìm cuộc thi...' : 'Type to search contest...')}
          className="w-full h-10 pl-9 pr-24 bg-[#E5D8C2] border border-[#221E1A]/20 rounded-xl text-xs text-[#241F1A] font-medium placeholder:text-[#746A5F] focus:outline-none focus:border-brand-periwinkle focus:ring-1 focus:ring-brand-periwinkle/30 transition-all cursor-text"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
          {selectedEvent?.status && !isOpen && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                selectedEvent.status === 'Judging' || selectedEvent.status === 'Ended'
                  ? 'bg-[#8A6A1F]/20 text-[#8A6A1F] border border-[#8A6A1F]/40'
                  : 'bg-[#2F6B63]/20 text-[#2F6B63] border border-[#2F6B63]/40'
              }`}
            >
              {selectedEvent.status}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-[#746A5F] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-brand-periwinkle' : ''
            }`}
          />
        </div>
      </div>

      {/* 2. Portaled Dropdown Menu (Directly on document.body - 100% Solid Dark Color, Zero Transparency) */}
      {mounted && isOpen && createPortal(
        <div
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
          }}
          className="contest-dropdown-portal z-[99999] max-h-60 overflow-y-auto rounded-xl border border-[#221E1A]/20 bg-[#FFFCF6] shadow-[0_25px_60px_rgba(0,0,0,0.98)] p-1.5 space-y-1 text-left animate-in fade-in zoom-in-95 duration-150"
        >
          {filteredEvents.length === 0 ? (
            <div className="p-3 text-center text-xs text-[#746A5F]">
              {isVie ? (
                <>Không tìm thấy cuộc thi phù hợp &ldquo;<span className="text-[#241F1A]">{query}</span>&rdquo;</>
              ) : (
                <>No contests found matching &ldquo;<span className="text-[#241F1A]">{query}</span>&rdquo;</>
              )}
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const isSelected = evt.id === selectedEventId;
              return (
                <button
                  key={evt.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                  onClick={() => {
                    onSelectEvent(evt.id);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-brand-periwinkle/30 text-[#241F1A] font-bold border border-brand-periwinkle/50'
                      : 'hover:bg-[#F0E7D8] text-[#6E6459]'
                  }`}
                >
                  <span className="truncate pr-2 font-semibold">{evt.title}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        evt.status === 'Judging' || evt.status === 'Ended'
                          ? 'bg-[#8A6A1F]/20 text-[#8A6A1F] border border-[#8A6A1F]/40'
                          : 'bg-[#2F6B63]/20 text-[#2F6B63] border border-[#2F6B63]/40'
                      }`}
                    >
                      {evt.status || 'Active'}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-periwinkle" />}
                  </div>
                </button>
              );
            })
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

export function PermissionsTab() {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const [events, setEvents] = useState<EventListItemDto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [members, setMembers] = useState<JuryPermissionMember[]>([]);
  const [, setLoading] = useState(false);
  const [candidateRefreshKey, setCandidateRefreshKey] = useState(0);

  // Real backend events
  const allEvents = events;
  const selectedEvent = allEvents.find((e) => matchesEventId(e.id, selectedEventId));

  // Check if judging phase has started / active
  const isJudgingPhaseActive = selectedEvent
    ? selectedEvent.status === 'Judging' ||
      selectedEvent.status === 'Ended' ||
      (selectedEvent.judgingStartAt ? new Date() >= new Date(selectedEvent.judgingStartAt) : false)
    : false;

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await eventService.list({ pageSize: 50 });
        if (res.items && res.items.length > 0) {
          setEvents(res.items);
          setSelectedEventId((prev) => {
            if (!prev || !res.items.some((e) => e.id === prev)) {
              return res.items[0].id;
            }
            return prev;
          });
        }
      } catch (err: unknown) {
        console.error('Failed to load events in permissions tab:', err);
        toast.error(err instanceof Error ? err.message : 'Không thể tải danh sách sự kiện.');
      }
    }
    void fetchEvents();
  }, []);

  const loadEventMembers = useCallback(async (eventId: string) => {
    if (!eventId) {
      setMembers([]);
      return;
    }
    setLoading(true);
    try {
      const [juries, pendingInvites] = await Promise.all([
        juryService.getEventJuries(eventId),
        juryService.getInvitations(eventId, 'Pending'),
      ]);

      const confirmedMembers: JuryPermissionMember[] = (juries || []).map((j) => ({
        id: j.id,
        name: j.creatorDisplayName || j.creatorName || 'Jury Member',
        email: j.creatorEmail || '',
        role: j.isHeadJury ? 'Head Jury' : 'Jury',
        status: 'Confirmed',
      }));

      const pendingMembers: JuryPermissionMember[] = (pendingInvites || []).map((inv) => ({
        id: inv.id,
        name: inv.sentToCreatorName || inv.sentToCreatorEmail || 'Invited Creator',
        email: inv.sentToCreatorEmail || '',
        role: inv.isHeadJury ? 'Head Jury' : 'Jury',
        status: 'Pending',
      }));

      setMembers([...confirmedMembers, ...pendingMembers]);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEventMembers(selectedEventId);
  }, [selectedEventId, loadEventMembers]);

  const handleInviteSent = async (email: string, isHeadJury = false): Promise<boolean> => {
    if (isJudgingPhaseActive) {
      toast.error(isVie ? 'Không thể gửi lời mời khi giai đoạn chấm thi đã bắt đầu.' : 'Cannot send jury invitation once the judging phase has started.');
      return false;
    }

    try {
      await juryService.sendInvitation(selectedEventId, email, isHeadJury);
      toast.success(isVie ? `Đã gửi lời mời tới ${email} thành công!` : `Invitation sent to ${email} successfully!`);
      await loadEventMembers(selectedEventId);
      setCandidateRefreshKey((k) => k + 1);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (isVie ? 'Gửi lời mời thất bại.' : 'Failed to send invitation.');
      toast.error(msg);
      return false;
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: 'Head Jury' | 'Jury') => {
    if (isJudgingPhaseActive) {
      toast.error(isVie ? 'Không thể đổi vai trò khi giai đoạn chấm thi đã bắt đầu.' : 'Cannot edit jury role once the judging phase has started.');
      return;
    }

    try {
      await juryService.updateJuryRole(selectedEventId, memberId, newRole);
      toast.success(isVie ? `Đã cập nhật vai trò thành viên thành ${newRole === 'Head Jury' ? 'Trưởng ban' : 'Giám khảo'}.` : `Updated role for member to ${newRole}.`);
      await loadEventMembers(selectedEventId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (isVie ? 'Cập nhật vai trò thất bại.' : 'Failed to update jury role.');
      toast.error(msg);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (isJudgingPhaseActive) {
      toast.error(isVie ? 'Không thể xóa thành viên khi giai đoạn chấm thi đã bắt đầu.' : 'Cannot remove jury member once the judging phase has started.');
      return;
    }

    const target = members.find((m) => m.id === memberId);

    try {
      if (target?.status === 'Pending') {
        await juryService.cancelInvitation(memberId);
        toast.success(isVie ? 'Đã hủy lời mời giám khảo đang chờ.' : 'Pending jury invitation canceled.');
      } else {
        await juryService.removeJury(memberId);
        toast.success(isVie ? 'Đã xóa thành viên ban giám khảo thành công.' : 'Jury member removed successfully.');
      }
      await loadEventMembers(selectedEventId);
      setCandidateRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (isVie ? 'Xóa thành viên thất bại.' : 'Failed to remove jury member.');
      toast.error(msg);
    }
  };

  const headJuryCount = members.filter((m) => m.role === 'Head Jury').length;
  const juryCount = members.filter((m) => m.role === 'Jury').length;
  const pendingInvitesCount = members.filter((m) => m.status === 'Pending').length;
  const assignedSubmissionsCount = selectedEvent?.submissionCount ?? 0;

  return (
    <div>
      {/* Event Selector & Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6]/80 backdrop-blur-xl mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold text-[#B24A26] uppercase tracking-wider shrink-0">
            {isVie ? 'Cuộc thi mục tiêu:' : 'Target Contest:'}
          </label>
          <ContestSearchSelect
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={(id) => setSelectedEventId(id)}
          />
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-outline">{isVie ? 'Trạng thái giai đoạn chấm:' : 'Judging Phase Status:'}</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isJudgingPhaseActive
                ? 'bg-[#8A6A1F]/20 text-[#8A6A1F] border border-[#8A6A1F]/40'
                : 'bg-[#2F6B63]/20 text-[#2F6B63] border border-[#2F6B63]/40'
            }`}
          >
            {isJudgingPhaseActive
              ? (isVie ? '🔒 Đã bắt đầu chấm (Đã khóa)' : '🔒 Judging Started (Locked)')
              : (isVie ? '🔓 Mở phân công giám khảo' : '🔓 Open for Jury Assignments')}
          </span>
        </div>
      </div>

      <PermissionsStats
        headJuryCount={headJuryCount}
        juryCount={juryCount}
        pendingInvitesCount={pendingInvitesCount}
        assignedCount={assignedSubmissionsCount}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8">
          <PermissionsTable
            members={members}
            onUpdateRole={handleUpdateRole}
            onRemoveMember={handleRemoveMember}
            isJudgingPhaseActive={isJudgingPhaseActive}
          />
        </div>
        <div className="lg:col-span-4">
          <InviteJuryCard
            eventId={selectedEventId}
            onInviteSent={handleInviteSent}
            isJudgingPhaseActive={isJudgingPhaseActive}
            refreshKey={candidateRefreshKey}
            hasHeadJury={headJuryCount > 0}
          />
        </div>
      </div>
    </div>
  );
}


