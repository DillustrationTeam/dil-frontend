'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, Clock, Crown, UserCheck, Edit2, UserX, X, Info, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/language-context';

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
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Head Jury' | 'Jury'>('All');
  const [editingMember, setEditingMember] = useState<JuryPermissionMember | null>(null);
  const [editRole, setEditRole] = useState<'Head Jury' | 'Jury'>('Jury');
  const [memberToRemove, setMemberToRemove] = useState<JuryPermissionMember | null>(null);

  const handleOpenEdit = (member: JuryPermissionMember) => {
    if (isJudgingPhaseActive) {
      toast.error('Cannot edit jury role once the judging phase has started.');
      return;
    }
    setEditingMember(member);
    setEditRole(member.role);
  };

  const handleOpenRemove = (member: JuryPermissionMember) => {
    if (isJudgingPhaseActive) {
      toast.error('Cannot remove jury member once the judging phase has started.');
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

  const filteredMembers = members.filter((member) => {
    if (roleFilter !== 'All' && member.role !== roleFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = member.name.toLowerCase().includes(q);
      const matchEmail = (member.email || '').toLowerCase().includes(q);
      return matchName || matchEmail;
    }
    return true;
  });

  return (
    <div className="glass-container rounded-2xl p-6 border border-[#221E1A]/10 bg-[#FFFCF6]/90 backdrop-blur-xl">
      {/* 1. Header Title & Description */}
      <div className="mb-4">
        <h2 className="text-xl font-bold font-h1 text-on-surface">Jury Panel Permissions</h2>
        <p className="text-xs text-outline mt-0.5">Manage jury members, roles and evaluation access.</p>
      </div>

      {/* 2. Searchbar & Filter by Role Row (Underneath Header) */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Searchbar */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#746A5F] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search jury member by name or email..."
            className="w-full h-10 pl-10 pr-9 bg-[#E5D8C2]/80 border border-[#221E1A]/10 rounded-xl text-xs text-[#241F1A] placeholder:text-[#746A5F] focus:outline-none focus:border-brand-periwinkle focus:ring-1 focus:ring-brand-periwinkle/30 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#746A5F] hover:text-[#241F1A] p-0.5 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter by Role */}
        <div className="relative shrink-0">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'All' | 'Head Jury' | 'Jury')}
            className="h-10 px-3.5 pr-8 bg-[#E5D8C2]/80 border border-[#221E1A]/10 rounded-xl text-xs text-[#241F1A] focus:outline-none focus:border-brand-periwinkle focus:ring-1 focus:ring-brand-periwinkle/30 transition-all cursor-pointer font-medium"
          >
            <option value="All" className="bg-[#FFFCF6]">{isVie ? 'Tất cả vai trò' : 'All Roles'}</option>
            <option value="Head Jury" className="bg-[#FFFCF6]">{isVie ? 'Trưởng ban' : 'Head Jury'}</option>
            <option value="Jury" className="bg-[#FFFCF6]">{isVie ? 'Giám khảo' : 'Jury'}</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[550px]">
          <thead>
            <tr className="border-b border-[#221E1A]/10 text-[11px] font-bold text-outline uppercase tracking-wider">
              <th className="pb-3 px-3">{isVie ? 'Thành viên' : 'Member'}</th>
              <th className="pb-3 px-3">{isVie ? 'Vai trò' : 'Role'}</th>
              <th className="pb-3 px-3">{isVie ? 'Trạng thái' : 'Status'}</th>
              <th className="pb-3 px-3 text-right">{isVie ? 'Thao tác' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#221E1A]/10 text-sm">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-xs text-outline">
                  {members.length === 0
                    ? isVie
                      ? 'Chưa có thành viên ban giám khảo nào được phân công.'
                      : 'No jury members assigned yet.'
                    : isVie
                      ? 'Không tìm thấy giám khảo nào khớp với điều kiện tìm kiếm.'
                      : 'No jury members found matching your search and filter criteria.'}
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-[#FFFCF6] transition-colors">
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
                          ? 'bg-[#8A6A1F]/20 border border-[#8A6A1F]/40 text-[#8A6A1F]'
                          : 'bg-brand-periwinkle/15 border border-brand-periwinkle/30 text-brand-periwinkle'
                      }`}
                    >
                      {member.role === 'Head Jury' ? (
                        <Crown className="w-3 h-3" />
                      ) : (
                        <UserCheck className="w-3 h-3" />
                      )}
                      {member.role === 'Head Jury' ? (isVie ? 'Trưởng ban' : 'Head Jury') : (isVie ? 'Giám khảo' : 'Jury')}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                        member.status === 'Confirmed'
                          ? 'text-[#2F6B63] bg-[#2F6B63]/20 border border-[#2F6B63]/30'
                          : 'text-[#8A6A1F] bg-[#8A6A1F]/20 border border-[#8A6A1F]/30'
                      }`}
                    >
                      {member.status === 'Confirmed' ? (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      {member.status === 'Confirmed' ? (isVie ? 'Đã xác nhận' : 'Confirmed') : (isVie ? 'Chờ chấp nhận' : 'Pending')}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {member.status === 'Confirmed' && (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(member)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#221E1A]/10 bg-[#FFFCF6] hover:bg-[#F0E7D8] text-xs text-[#241F1A] transition-all cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3 text-brand-periwinkle" />
                          <span>{isVie ? 'Đổi vai trò' : 'Edit Role'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenRemove(member)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#A8321C]/40 bg-[#A8321C]/10 hover:bg-[#A8321C]/20 text-xs text-[#A8321C] transition-all cursor-pointer"
                        title={member.status === 'Pending' ? (isVie ? 'Hủy lời mời' : 'Cancel Invitation') : (isVie ? 'Xóa thành viên' : 'Remove Member')}
                      >
                        <UserX className="w-3 h-3 text-[#A8321C]" />
                        <span>{member.status === 'Pending' ? (isVie ? 'Hủy mời' : 'Cancel Invite') : (isVie ? 'Xóa' : 'Remove')}</span>
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#E5D8C2] backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleSaveRole} className="w-full max-w-md rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left m-auto max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setEditingMember(null)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-[#F0E7D8] text-[#746A5F] hover:text-[#241F1A]"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-[#241F1A] font-h1">
              {isVie ? 'Chỉnh sửa vai trò Giám khảo' : 'Edit Jury Role'}
            </h3>
            <p className="text-xs text-outline mt-1">
              {isVie ? (
                <>Thay đổi quyền hạn cho <span className="font-semibold text-[#241F1A]">{editingMember.name}</span> ({editingMember.email || 'Không có email'}).</>
              ) : (
                <>Change permissions for <span className="font-semibold text-[#241F1A]">{editingMember.name}</span> ({editingMember.email || 'No email'}).</>
              )}
            </p>

            <div className="mt-4 p-3 rounded-xl border border-[#2C5A86]/30 bg-[#2C5A86]/10 flex items-start gap-2.5 text-xs text-[#2C5A86]">
              <Info className="w-4 h-4 text-[#2C5A86] shrink-0 mt-0.5" />
              <span>
                {isVie ? (
                  <>Chỉ được phép thay đổi vai trò trước khi giai đoạn chấm thi bắt đầu (<code className="text-[#241F1A]">JudgingStartAt</code>).</>
                ) : (
                  <>Role changes are allowed only before the judging phase starts (<code className="text-[#241F1A]">JudgingStartAt</code>).</>
                )}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  {isVie ? 'Chọn vai trò' : 'Select Role'}
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditRole('Jury')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      editRole === 'Jury'
                        ? 'border-brand-periwinkle bg-brand-periwinkle/20 text-[#241F1A] shadow-[0_0_15px_rgba(167,172,217,0.2)]'
                        : 'border-[#221E1A]/10 bg-[#FFFCF6] text-[#746A5F] hover:bg-[#F0E7D8]'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-brand-periwinkle" />
                    {isVie ? 'Giám khảo' : 'Jury'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditRole('Head Jury')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      editRole === 'Head Jury'
                        ? 'border-[#8A6A1F]/30 bg-[#8A6A1F]/20 text-[#8A6A1F] shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                        : 'border-[#221E1A]/10 bg-[#FFFCF6] text-[#746A5F] hover:bg-[#F0E7D8]'
                    }`}
                  >
                    <Crown className="w-4 h-4 text-[#8A6A1F]" />
                    {isVie ? 'Trưởng ban' : 'Head Jury'}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="px-4 py-2 rounded-xl border border-[#221E1A]/10 text-xs font-semibold text-[#746A5F] hover:bg-[#FFFCF6] transition-all cursor-pointer"
              >
                {isVie ? 'Hủy' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B24A26] to-[#2F6B63] text-[#241F1A] text-xs font-bold hover:brightness-110 transition-all cursor-pointer"
              >
                {isVie ? 'Lưu thay đổi' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Remove Member Confirmation Modal Portaled to document.body */}
      {mounted && memberToRemove && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#E5D8C2] backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl border border-[#A8321C]/40 bg-[#FFFCF6] p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left m-auto">
            <h3 className="text-lg font-bold text-[#241F1A] font-h1">
              {memberToRemove.status === 'Pending'
                ? isVie
                  ? 'Hủy lời mời Giám khảo'
                  : 'Cancel Jury Invitation'
                : isVie
                  ? 'Xóa khỏi Ban giám khảo'
                  : 'Remove Jury Member'}
            </h3>
            <p className="text-xs text-[#746A5F] mt-2 leading-relaxed">
              {memberToRemove.status === 'Pending' ? (
                isVie ? (
                  <>
                    Bạn có chắc chắn muốn hủy lời mời tham gia ban giám khảo gửi tới{' '}
                    <span className="font-bold text-[#241F1A]">{memberToRemove.name}</span> không? </>
                ) : (
                  <>
                    Are you sure you want to cancel the pending jury invitation sent to{' '}
                    <span className="font-bold text-[#241F1A]">{memberToRemove.name}</span>?
                  </>
                )
              ) : isVie ? (
                <> Bạn có chắc chắn muốn xóa <span className="font-bold text-[#241F1A]">{memberToRemove.name}</span> khỏi Ban giám khảo không? Thành viên này sẽ không còn quyền truy cập nhiệm vụ chấm thi cho sự kiện này. </>
              ) : (
                <>
                  Are you sure you want to remove <span className="font-bold text-[#241F1A]">{memberToRemove.name}</span> from the Jury Panel? They will no longer have access to evaluation tasks for this event.
                </>
              )}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="px-4 py-2 rounded-xl border border-[#221E1A]/10 text-xs font-semibold text-[#746A5F] hover:bg-[#FFFCF6] transition-all cursor-pointer"
              >
                {isVie ? 'Giữ lại' : 'Keep'}
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                className="px-4 py-2 rounded-xl bg-[#A8321C]/12 hover:bg-[#A8321C]/12 text-[#241F1A] text-xs font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer"
              >
                {memberToRemove.status === 'Pending'
                  ? isVie
                    ? 'Hủy lời mời'
                    : 'Cancel Invitation'
                  : isVie
                    ? 'Xóa thành viên'
                    : 'Remove Member'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}



