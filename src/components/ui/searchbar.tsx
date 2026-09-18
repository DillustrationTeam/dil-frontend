'use client';

import { KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';

interface SearchbarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
}

export function Searchbar({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
}: SearchbarProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSearch?.();
    }
  };

  return (
    <div className="flex w-full items-center gap-3">
      <div className="relative flex-1">
        <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#919099]">
          search
        </span>
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-full border border-[#46464e]/30 bg-[#1b1b1e] py-2.5 pl-12 pr-4 text-sm text-[#E4E1E5] placeholder-white/30 transition-all focus:border-[#A7ACD9] focus:outline-none focus:ring-1 focus:ring-[#A7ACD9]"
        />
      </div>
      <Button onClick={onSearch} disabled={!value.trim()} variant="secondary">
        Search
      </Button>
    </div>
  );
}
