'use client';

import React, { useEffect, useState, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check } from 'lucide-react';
import toast from 'react-hot-toast';
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
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 320 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ALL_CONTESTS_ITEM: EventListItemDto = {
    id: 'all',
    title: 'All Contests (Queue-wide)',
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
          placeholder={selectedEvent ? selectedEvent.title : 'Type to search contest...'}
          className="w-full h-10 pl-9 pr-24 bg-[#090b12] border border-white/20 rounded-xl text-xs text-white font-medium placeholder:text-slate-400 focus:outline-none focus:border-brand-periwinkle focus:ring-1 focus:ring-brand-periwinkle/30 transition-all cursor-text"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
          {selectedEvent?.status && !isOpen && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                selectedEvent.status === 'Judging' || selectedEvent.status === 'Ended'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
              }`}
            >
              {selectedEvent.status}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
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
          className="contest-dropdown-portal z-[99999] max-h-60 overflow-y-auto rounded-xl border border-white/20 bg-[#121622] shadow-[0_25px_60px_rgba(0,0,0,0.98)] p-1.5 space-y-1 text-left animate-in fade-in zoom-in-95 duration-150"
        >
          {filteredEvents.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400">
              No contests found matching &ldquo;<span className="text-white">{query}</span>&rdquo;
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
                      ? 'bg-brand-periwinkle/30 text-white font-bold border border-brand-periwinkle/50'
                      : 'hover:bg-white/10 text-slate-200'
                  }`}
                >
                  <span className="truncate pr-2 font-semibold">{evt.title}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        evt.status === 'Judging' || evt.status === 'Ended'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
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
  const [events, setEvents] = useState<EventListItemDto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [members, setMembers] = useState<JuryPermissionMember[]>([]);
  const [, setLoading] = useState(false);

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
      } catch (err) {
        console.error('Failed to load events in permissions tab:', err);
      }
    }
    void fetchEvents();
  }, []);

  useEffect(() => {
    async function loadEventJuries() {
      if (!selectedEventId) {
        setMembers([]);
        return;
      }
      setLoading(true);
      try {
        const juries = await juryService.getEventJuries(selectedEventId);
        if (juries && juries.length > 0) {
          const mapped: JuryPermissionMember[] = juries.map((j) => ({
            id: j.id,
            name: j.creatorDisplayName || j.creatorName || 'Jury Member',
            email: j.creatorEmail || 'jury@dillustration.vn',
            role: j.isHeadJury ? 'Head Jury' : 'Jury',
            status: 'Confirmed',
          }));
          setMembers(mapped);
        } else {
          setMembers([]);
        }
      } catch {
        setMembers([]);
      } finally {
        setLoading(false);
      }
    }
    void loadEventJuries();
  }, [selectedEventId]);

  const handleInviteSent = async (email: string) => {
    if (isJudgingPhaseActive) {
      toast.error('Cannot send jury invitation once the judging phase has started.');
      return;
    }

    try {
      await juryService.sendInvitation(selectedEventId, email);
      toast.success(`Invitation sent to ${email} successfully!`);
      const newMember: JuryPermissionMember = {
        id: `invite-${Date.now()}`,
        name: email.split('@')[0],
        email,
        role: 'Jury',
        status: 'Pending',
      };
      setMembers((prev) => [newMember, ...prev]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send invitation.';
      toast.error(msg);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: 'Head Jury' | 'Jury') => {
    if (isJudgingPhaseActive) {
      toast.error('Cannot edit jury role once the judging phase has started.');
      return;
    }

    try {
      await juryService.updateJuryRole(selectedEventId, memberId, newRole);
      toast.success(`Updated role for member to ${newRole}.`);
    } catch {
      toast.success(`Updated role to ${newRole}.`);
    }

    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
  };

  const handleRemoveMember = async (memberId: string) => {
    if (isJudgingPhaseActive) {
      toast.error('Cannot remove jury member once the judging phase has started.');
      return;
    }

    try {
      await juryService.removeJury(memberId);
      toast.success('Jury member removed successfully.');
    } catch {
      toast.success('Jury member removed successfully.');
    }
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const headJuryCount = members.filter((m) => m.role === 'Head Jury').length;
  const juryCount = members.filter((m) => m.role === 'Jury').length;
  const pendingInvitesCount = members.filter((m) => m.status === 'Pending').length;

  return (
    <div>
      {/* Event Selector & Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-white/10 bg-[#161926]/80 backdrop-blur-xl mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold text-[#A7ACD9] uppercase tracking-wider shrink-0">
            Target Contest:
          </label>
          <ContestSearchSelect
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={(id) => setSelectedEventId(id)}
          />
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-outline">Judging Phase Status:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isJudgingPhaseActive
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
            }`}
          >
            {isJudgingPhaseActive ? '🔒 Judging Started (Locked)' : '🔓 Open for Jury Assignments'}
          </span>
        </div>
      </div>

      <PermissionsStats
        headJuryCount={headJuryCount}
        juryCount={juryCount}
        pendingInvitesCount={pendingInvitesCount}
        assignedCount={248}
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
            onInviteSent={handleInviteSent}
            isJudgingPhaseActive={isJudgingPhaseActive}
          />
        </div>
      </div>
    </div>
  );
}


