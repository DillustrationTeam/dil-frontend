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
  return <section className="space-y-3 rounded-2xl border border-[#A7ACD9]/30 bg-[#A7ACD9]/5 p-4">
    <button type="button" disabled={!file || busy} className="rounded-xl bg-[#A7ACD9] px-4 py-2 text-sm font-semibold text-[#1F2335] disabled:opacity-40" onClick={async () => {
      if (!file) return; setBusy(true); setError(''); controller.current?.abort(); const abort = new AbortController(); controller.current = abort;
      try { const value = await artworkAiService.suggest(file, abort.signal); if (currentFile.current === file) setSuggestion({ file, value }); }
      catch (cause) { if (!abort.signal.aborted) setError(extractErrorMessage(cause, 'Không tạo được gợi ý. Bạn vẫn có thể nhập thủ công.')); }
      finally { setBusy(false); }
    }}>{busy ? 'AI đang đọc ảnh…' : '✨ Gợi ý tag & mô tả bằng AI'}</button>
    <p className="text-xs text-slate-400">Gửi ảnh đã chọn cho Gemini để gợi ý. Bạn xem và xác nhận trước khi áp dụng.</p>
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    {suggestion?.file === file && suggestion && <div className="space-y-2 text-sm text-slate-300"><p className="font-semibold text-white">{suggestion.value.title}</p><p>{suggestion.value.description}</p><p>{suggestion.value.tags.map(t => `#${t}`).join(' · ')}</p><p className="text-xs">Phong cách: {suggestion.value.style}</p><button type="button" className="rounded-xl border border-[#A7ACD9]/50 px-4 py-2 text-[#A7ACD9]" onClick={() => { onApply(suggestion.value); setSuggestion(null); }}>Áp dụng vào biểu mẫu</button></div>}
  </section>;
}
