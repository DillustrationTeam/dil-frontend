'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth-store';
import { uploadService } from '@/features/creator-studio/services/upload.service';
import { profileSettingsService } from '@/features/profile-settings/services/profile-settings.service';
import toast from 'react-hot-toast';

export function PersonalProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const [uploading, setUploading] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);

  const uploadAvatar = async (file?: File) => {
    if (!file || uploading) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast.error('Chọn ảnh JPG, PNG hoặc WebP tối đa 5MB.');
      return;
    }
    setUploading(true);
    try {
      const avatarUrl = await uploadService.uploadFile(file, 'profile-avatars', 'c_fill,w_400,h_400,q_auto,f_auto');
      const updatedUser = await profileSettingsService.updateProfile({ avatarUrl });
      const auth = useAuthStore.getState();
      auth.setUser(updatedUser, auth.roles);
      toast.success('Đã cập nhật ảnh đại diện.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải ảnh lên.');
    } finally {
      setUploading(false);
      if (avatarInput.current) avatarInput.current.value = '';
    }
  };

  useEffect(() => {
    if (!authenticated || !user) router.replace('/login?returnUrl=%2Fprofile%2Fme');
  }, [authenticated, router, user]);

  if (!authenticated || !user) {
    return <main className="grid min-h-[60vh] place-items-center bg-[#1F2335] text-sm text-[#C7C5CF]">Đang chuyển tới đăng nhập…</main>;
  }

  return (
    <main className="min-h-[70vh] bg-[#1F2335] px-4 py-10 text-[#E4E1E5] sm:px-6">
      <div className="mx-auto max-w-3xl">
        {user.coverUrl && <div className="relative mb-6 h-48 overflow-hidden rounded-2xl"><Image src={user.coverUrl} alt="Ảnh bìa hồ sơ" fill unoptimized className="object-cover" /></div>}
        <div className="mb-6 flex items-center gap-4">
          {user.avatarUrl ? <Image src={user.avatarUrl} alt={`Ảnh đại diện ${user.fullName}`} width={96} height={96} unoptimized className="h-24 w-24 rounded-full object-cover" /> : <span className="grid h-24 w-24 place-items-center rounded-full bg-[#A7ACD9]/20 text-3xl text-[#A7ACD9]">{user.fullName.charAt(0)}</span>}
          <div><button type="button" disabled={uploading} onClick={() => avatarInput.current?.click()} className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white disabled:opacity-50">{uploading ? 'Đang tải…' : 'Tải ảnh đại diện'}</button><p className="mt-2 text-xs text-[#919099]">JPG, PNG, WebP · tối đa 5MB</p></div>
          <input ref={avatarInput} type="file" aria-label="Chọn ảnh đại diện" accept="image/jpeg,image/png,image/webp" disabled={uploading} className="hidden" onChange={(event) => void uploadAvatar(event.target.files?.[0])} />
        </div>
        <p className="text-xs uppercase tracking-[.18em] text-[#A7ACD9]">Hồ sơ cá nhân</p>
        <h1 className="mt-2 font-h1 text-3xl font-bold text-white">{user.fullName}</h1>
        {user.bio && <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-6 text-[#C7C5CF]">{user.bio}</p>}
        {user.socialLinks?.length ? <ul className="mt-4 flex flex-wrap gap-3">{user.socialLinks.map((url) => <li key={url}><a href={url} target="_blank" rel="noreferrer" className="text-sm text-[#A7ACD9] underline">{url}</a></li>)}</ul> : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/settings" className="rounded-xl bg-[#A7ACD9] px-4 py-2.5 text-sm font-semibold text-[#1F2335]">Chỉnh sửa hồ sơ</Link>
          <Link href="/client/commissions" className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white">Đơn commission</Link>
        </div>
      </div>
    </main>
  );
}
