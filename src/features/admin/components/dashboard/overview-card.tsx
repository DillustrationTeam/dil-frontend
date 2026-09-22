'use client';

interface OverviewCardProps {
  title: string;
  value: string | number;
}

export function OverviewCard({ title, value }: OverviewCardProps) {
  return (
    <div className="glass-container rounded-[28px] p-5 periwinkle-glow">
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A7ACD9]">
        {title}
      </span>
      <p className="font-h1 mt-3 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
