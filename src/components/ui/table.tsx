'use client';

import { ReactNode } from 'react';

export interface TableColumn {
  key: string;
  label: string;
}

interface TableProps<T extends { id: string }> {
  columns: TableColumn[];
  data: T[];
  renderActions?: (item: T) => ReactNode;
}

export function Table<T extends { id: string }>({
  columns,
  data,
  renderActions,
}: TableProps<T>) {
  return (
    <div className="glass-container overflow-hidden rounded-[28px]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A7ACD9]"
                >
                  {column.label}
                </th>
              ))}
              {renderActions ? (
                <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A7ACD9]">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (renderActions ? 1 : 0)}
                  className="px-5 py-10 text-center text-sm text-[#919099]"
                >
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                  {columns.map((column) => (
                    <td key={column.key} className="px-5 py-4 text-sm text-[#E4E1E5]">
                      {String((item as Record<string, unknown>)[column.key] ?? '—')}
                    </td>
                  ))}
                  {renderActions ? <td className="px-5 py-4">{renderActions(item)}</td> : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
