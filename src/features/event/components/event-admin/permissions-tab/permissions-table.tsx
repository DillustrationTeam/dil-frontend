'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, Clock, Crown, UserCheck, Edit2, UserX, X, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const emptySubscribe = () => () => {};

export interface JuryPermissionMember {
  id: string;
  name: string;
  role: 'Head Jury' | 'Jury';
  status: 'Confirmed' | 'Pending';
  email?: string;
}

interface PermissionsTableProps {
  members: JuryPermissionMember[];
  onUpdateRole?: (memberId: string, newRole: 'Head Jury' | 'Jury') => void;
  onRemoveMember?: (memberId: string) => void;
  isJudgingPhaseActive?: boolean;
}

export function PermissionsTable({ members, onUpdateRole, onRemoveMember, isJudgingPhaseActive = false }: PermissionsTableProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [editingMember, setEditingMember] = useState<JuryPermissionMember | null>(null);
  const [editRole, setEditRole] = useState<'Head Jury' | 'Jury'>('Jury');
  const [memberToRemove, setMemberToRemove] = useState<JuryPermissionMember | null>(null);

  const handleOpenEdit = (member: JuryPermissionMember) => {
    if (isJudgingPhaseActive) {
      toast.error('Không thể chỉnh sửa vai trò giám khảo khi giai đoạn chấm thi đã bắt đầu.');
      return;
    }
    setEditingMember(member);
    setEditRole(member.role);
  };

  const handleOpenRemove = (member: JuryPermissionMember) => {
    if (isJudgingPhaseActive) {
      toast.error('Không thể gỡ giám khảo khỏi sự kiện khi giai đoạn chấm thi đã bắt đầu.');
      return;
    }
    setMemberToRemove(member);
  };

  const handleSaveRole = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingMember && onUpdateRole) {
      onUpdateRole(editingMember.id, editRole);
    }
    setEditingMember(null);
  };

  const handleConfirmRemove = () => {
    if (memberToRemove && onRemoveMember) {
      onRemoveMember(memberToRemove.id);
    }
    setMemberToRemove(null);
  };

  return (
    <div className="glass-container rounded-2xl p-6 border border-white/10 bg-[#161926]/90 backdrop-blur-xl">
      <h2 className="text-xl font-bold font-h1 text-on-surface mb-4">Jury Panel Permissions</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[550px]">
          <thead>
            <tr className="border-b border-white/10 text-[11px] font-bold text-outline uppercase tracking-wider">
              <th className="pb-3 px-3">Member</th>
              <th className="pb-3 px-3">Role</th>
              <th className="pb-3 px-3">Status</th>
              <th className="pb-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {members.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-xs text-outline">
                  No jury members assigned yet.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-3 font-semibold text-on-surface">
                    {member.name}
                    {member.email && (
                      <span className="block text-xs text-outline font-normal font-mono">
                        {member.email}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        member.role === 'Head Jury'
                          ? 'bg-amber-950/70 border border-amber-400/30 text-amber-300'
                          : 'bg-brand-periwinkle/15 border border-brand-periwinkle/30 text-brand-periwinkle'
                      }`}
                    >
                      {member.role === 'Head Jury' ? (
                        <Crown className="w-3 h-3" />
                      ) : (
                        <UserCheck className="w-3 h-3" />
                      )}
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                        member.status === 'Confirmed'
                          ? 'text-emerald-300 bg-emerald-950/40 border border-emerald-500/20'
                          : 'text-amber-300 bg-amber-950/40 border border-amber-500/20'
                      }`}
                    >
                      {member.status === 'Confirmed' ? (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      {member.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(member)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3 text-brand-periwinkle" />
                        <span>Edit Role</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenRemove(member)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-xs text-red-400 transition-all cursor-pointer"
                        title="Remove Member"
                      >
                        <UserX className="w-3 h-3 text-red-400" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Role Modal Portaled to document.body */}
      {mounted && editingMember && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleSaveRole} className="w-full max-w-md rounded-2xl border border-white/15 bg-[#161926] p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left m-auto max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setEditingMember(null)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-white font-h1">Edit Jury Role</h3>
            <p className="text-xs text-outline mt-1">
              Change permissions for <span className="font-semibold text-white">{editingMember.name}</span> ({editingMember.email || 'No email'}).
            </p>

            <div className="mt-4 p-3 rounded-xl border border-blue-500/20 bg-blue-500/10 flex items-start gap-2.5 text-xs text-blue-300">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Role changes are allowed only before the judging phase starts (<code className="text-white">JudgingStartAt</code>).
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  Select Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'Head Jury' | 'Jury')}
                  className="w-full rounded-xl border border-white/10 bg-[#090b12]/90 text-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-periwinkle focus:ring-1 focus:ring-brand-periwinkle/30 transition-all cursor-pointer mb-3"
                >
                  <option value="Jury" className="bg-[#1f2335]">
                    Jury Member (Giám khảo)
                  </option>
                  <option value="Head Jury" className="bg-[#1f2335]">
                    Head Jury (Trưởng ban giám khảo)
                  </option>
                </select>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditRole('Jury')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      editRole === 'Jury'
                        ? 'border-brand-periwinkle bg-brand-periwinkle/20 text-white shadow-[0_0_15px_rgba(167,172,217,0.2)]'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-brand-periwinkle" />
                    Jury
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditRole('Head Jury')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      editRole === 'Head Jury'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <Crown className="w-4 h-4 text-amber-300" />
                    Head Jury
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/5 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#a7acd9] to-[#7fd5e8] text-brand-navy text-xs font-bold hover:brightness-110 transition-all cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Remove Member Confirmation Modal Portaled to document.body */}
      {mounted && memberToRemove && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#161926] p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left m-auto">
            <h3 className="text-lg font-bold text-white font-h1">Remove Jury Member</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-white">{memberToRemove.name}</span> from the Jury Panel? They will no longer have access to evaluation tasks for this event.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/5 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer"
              >
                Remove Member
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}



