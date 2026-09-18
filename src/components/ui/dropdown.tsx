'use client';

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
}

export function Dropdown({ value, options, onChange }: DropdownProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-xl border border-white/10 bg-[#0e0e11]/50 px-4 py-2.5 text-sm text-[#E4E1E5] focus:border-[#A7ACD9] focus:outline-none focus:ring-1 focus:ring-[#A7ACD9]"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-[#1F2335]">
          {option.label}
        </option>
      ))}
    </select>
  );
}
