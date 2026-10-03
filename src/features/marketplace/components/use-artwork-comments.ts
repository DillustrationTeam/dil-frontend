'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { extractErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/use-auth-store';
import { ArtworkCommentDto, marketplaceService } from '../services/marketplace.service';

const commentSchema = z.string().trim().min(1, 'Nhập nội dung bình luận.').max(1000, 'Bình luận tối đa 1000 ký tự.');
const display = (item: ArtworkCommentDto) => ({ name: item.authorName || 'Bạn', text: item.body, time: new Date(item.createdAt).toLocaleDateString('vi-VN') });

export function useArtworkComments(id: string) {
  const userId = useAuthStore((state) => state.user?.id);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<ReturnType<typeof display>[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const lock = useRef(false);
  useEffect(() => {
    const current = ++generation.current;
    void (async () => {
      setComments([]); setComment(''); setSubmitting(false); setLoading(true); lock.current = false;
      try {
        const data = await marketplaceService.getArtworkComments(id);
        if (current === generation.current) setComments(data.map(display));
      } catch (cause) {
        if (current === generation.current) toast.error(extractErrorMessage(cause, 'Không tải được bình luận.'));
      } finally {
        if (current === generation.current) setLoading(false);
      }
    })();
    return () => { generation.current = current + 1; };
  }, [id, userId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (lock.current || loading) return;
    if (!useAuthStore.getState().isAuthenticated) { toast.error('Vui lòng đăng nhập để bình luận.'); return; }
    const parsed = commentSchema.safeParse(comment);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    const current = generation.current;
    lock.current = true; setSubmitting(true);
    try {
      const next = await marketplaceService.createArtworkComment(id, parsed.data);
      if (current !== generation.current) return;
      setComments((items) => [display(next), ...items]); setComment('');
    } catch (cause) {
      if (current === generation.current) toast.error(extractErrorMessage(cause, 'Không gửi được bình luận. Nội dung đã được giữ lại.'));
    } finally {
      if (current === generation.current) { lock.current = false; setSubmitting(false); }
    }
  };
  return { comment, setComment, comments, submit, submitting: submitting || loading };
}
