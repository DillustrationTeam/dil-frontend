 'use client';
import { useEffect, useRef, useState } from 'react';
import { artworkAiService, type MetadataSuggestion } from '../services/artwork-ai.service';
import { extractErrorMessage } from '@/lib/api-client';
export function ArtworkMetadataAssistant({ file, onApply }: { file: File | null; onApply: (value: MetadataSuggestion) => void }) {
  const [suggestion, setSuggestion] = useState<{ file: File; value: MetadataSuggestion } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  const currentFile = useRef(file);
  useEffect(() => { currentFile.current = file; return () => { controller.current?.abort(); }; }, [file]);
  return <section className="space-y-3 rounded-2xl border border-[#B24A26]/30 bg-[#B24A26]/5 p-4">
    <button type="button" disabled={!file || busy} className="rounded-xl bg-[#B24A26] px-4 py-2 text-sm font-semibold text-[#F7F2E9] disabled:opacity-40" onClick={async () => {
      if (!file) return; setBusy(true); setError(''); controller.current?.abort(); const abort = new AbortController(); controller.current = abort;
      try { const value = await artworkAiService.suggest(file, abort.signal); if (currentFile.current === file) setSuggestion({ file, value }); }
      catch (cause) { if (!abort.signal.aborted) setError(extractErrorMessage(cause, 'Không tạo được gợi ý. Bạn vẫn có thể nhập thủ công.')); }
      finally { setBusy(false); }
    }}>{busy ? 'AI đang đọc ảnh…' : '✨ Gợi ý tag & mô tả bằng AI'}</button>
    <p className="text-xs text-[#746A5F]">Gửi ảnh đã chọn cho Gemini để gợi ý. Bạn xem và xác nhận trước khi áp dụng.</p>
    {error && <p role="alert" className="text-sm text-[#A8321C]">{error}</p>}
    {suggestion?.file === file && suggestion && <div className="space-y-2 text-sm text-[#746A5F]"><p className="font-semibold text-[#241F1A]">{suggestion.value.title}</p><p>{suggestion.value.description}</p><p>{suggestion.value.tags.map(t => `#${t}`).join(' · ')}</p><p className="text-xs text-[#8C3718]">Danh mục đề xuất: <strong>{suggestion.value.categoryName || suggestion.value.style}</strong></p><button type="button" className="rounded-xl border border-[#B24A26]/50 px-4 py-2 text-[#B24A26]" onClick={() => { onApply(suggestion.value); setSuggestion(null); }}>Áp dụng vào biểu mẫu</button></div>}
  </section>;
}
