'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Heart, MessageSquare, X } from 'lucide-react';

interface WorkroomEmotePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmote: (emote: string) => void;
  onSendInstant?: (emote: string) => void;
}

const EMOJI_LIST = [
  '💖', '✨', '🎨', '🖌️', '🌸', '🥺', '🥰', '👍',
  '🎉', '👏', '🔥', '🐱', '☕', '🍰', '💯', '🎀',
  '💌', '😻', '🐾', '🍵', '🍡', '🧁', '🍭', '🍮',
  '🥛', '⭐', '💫', '🌟', '🤍', '💜', '💙', '💛',
  '👌', '🙌', '👀', '😳', '🥳', '😎', '🤤', '😭',
];

const KAOMOJI_LIST = [
  '(⁠◍⁠•⁠ᴗ⁠•⁠◍⁠)⁠❤',
  '(⁠人⁠*⁠´⁠∀⁠｀⁠)⁠｡⁠*ﾟ⁠+',
  '(⁠≧⁠▽⁠≦⁠)',
  '(⁠｡⁠♥⁠‿⁠♥⁠｡⁠)',
  '(⁠づ⁠｡⁠◕⁠‿⁠‿⁠◕⁠｡⁠)⁠づ',
  '(⁠*⁠˘⁠︶⁠˘⁠*⁠)⁠.⁠｡⁠*⁠♡',
  '(⁠◠⁠‿⁠◕⁠)',
  '(⁠つ⁠✧⁠ω⁠✧⁠)⁠つ',
  '(⁠ﾉ⁠◕⁠ヮ⁠◕⁠)⁠ﾉ⁠*⁠:⁠･ﾟ⁠✧',
  '(⁠/⁠^⁠-⁠^⁠(⁠^⁠ ⁠^⁠*⁠)⁠/',
  '(⁠*⁠＾⁠3⁠＾⁠)⁠/⁠~⁠♡',
  '(⁠灬⁠º⁠‿⁠º⁠灬⁠)⁠♡',
  '(⁠・⁠∀⁠・⁠)',
  '(⁠o⁠´⁠･⁠_⁠･⁠)⁠っ',
  '(⁠｡⁠•̀⁠ᴗ⁠-⁠)⁠✧',
  '(⁠◕⁠ᴗ⁠◕⁠✿⁠)',
];

const QUICK_PHRASES = [
  { label: 'Bản vẽ đẹp lắm ạ! ✨', text: 'Bản vẽ đẹp lắm bạn ơi! ✨' },
  { label: 'Nhờ bạn chỉnh xíu nha ✏️', text: 'Nhờ bạn chỉnh giúp mình chi tiết này xíu nha ✏️' },
  { label: 'Đang lên nét, đợi xíu nhé 🎨', text: 'Mình đang lên nét cho mốc này, bạn đợi xíu nhé! 🎨' },
  { label: 'Đã nạp Escrow mốc này! 🛡️', text: 'Mình đã nạp Escrow cho mốc này rồi nhé! 🛡️' },
  { label: 'Cảm ơn bạn nhiều nha! 💖', text: 'Cảm ơn bạn nhiều nha! 💖' },
  { label: 'Duyệt mốc này luôn nha! ✓', text: 'Mốc này ưng quá, mình duyệt luôn nha! ✓' },
];

export const WorkroomEmotePicker: React.FC<WorkroomEmotePickerProps> = ({
  isOpen,
  onClose,
  onSelectEmote,
  onSendInstant,
}) => {
  const [tab, setTab] = useState<'emoji' | 'kaomoji' | 'phrases'>('emoji');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-14 left-2 sm:left-4 z-50 w-[310px] sm:w-[350px] rounded-2xl border-2 border-purple-500/30 bg-[#161827]/98 p-3 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 select-none text-slate-200"
    >
      {/* Header with Tabs & Close */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTab('emoji')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              tab === 'emoji'
                ? 'bg-fuchsia-500/25 text-fuchsia-300 border border-fuchsia-400/40 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles size={12} /> Emoji
          </button>

          <button
            type="button"
            onClick={() => setTab('kaomoji')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              tab === 'kaomoji'
                ? 'bg-purple-500/25 text-purple-300 border border-purple-400/40 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Heart size={12} /> Kaomoji
          </button>

          <button
            type="button"
            onClick={() => setTab('phrases')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition ${
              tab === 'phrases'
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare size={12} /> Câu nhanh
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="size-6 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition"
          title="Đóng bảng biểu cảm"
        >
          <X size={14} />
        </button>
      </div>

      {/* Tab 1: Emoji Grid */}
      {tab === 'emoji' && (
        <div className="grid grid-cols-8 gap-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
          {EMOJI_LIST.map((emo, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectEmote(emo)}
              className="size-8 rounded-lg text-xl hover:bg-white/15 flex items-center justify-center transition-transform hover:scale-125 active:scale-95"
              title={emo}
            >
              {emo}
            </button>
          ))}
        </div>
      )}

      {/* Tab 2: Kaomoji List */}
      {tab === 'kaomoji' && (
        <div className="grid grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
          {KAOMOJI_LIST.map((kao, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectEmote(kao)}
              className="p-1.5 text-xs font-medium rounded-lg bg-white/5 hover:bg-purple-500/20 text-purple-200 border border-white/5 hover:border-purple-400/30 transition truncate text-center"
              title={kao}
            >
              {kao}
            </button>
          ))}
        </div>
      )}

      {/* Tab 3: Quick Phrases */}
      {tab === 'phrases' && (
        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
          {QUICK_PHRASES.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-slate-200 transition group"
            >
              <button
                type="button"
                onClick={() => onSelectEmote(item.text)}
                className="flex-1 text-left truncate hover:text-emerald-300 font-medium"
                title="Chèn vào ô nhập"
              >
                {item.label}
              </button>
              {onSendInstant && (
                <button
                  type="button"
                  onClick={() => onSendInstant(item.text)}
                  className="shrink-0 px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/40 transition opacity-80 group-hover:opacity-100 ml-1.5"
                  title="Gửi trực tiếp ngay lập tức"
                >
                  Gửi ngay
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer hint */}
      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
        <span>* Nhấp để chèn vào tin nhắn</span>
        <span className="text-purple-300/80 font-mono">Workroom Emotes ♡</span>
      </div>
    </div>
  );
};
