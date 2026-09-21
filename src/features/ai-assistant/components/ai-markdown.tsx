import React from 'react';

interface AiMarkdownProps {
  content: string;
}

export function AiMarkdown({ content }: AiMarkdownProps) {
  if (!content) return null;

  // Tách nội dung thành các khối: Khối mã nguồn (code blocks) và các khối thông thường
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  let blockKey = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textChunk = content.slice(lastIndex, match.index);
      parts.push(
        <div key={`text-${blockKey++}`} className="space-y-2">
          {renderRegularMarkdown(textChunk)}
        </div>
      );
    }

    const language = match[1] || '';
    const code = match[2];
    parts.push(
      <div
        key={`code-${blockKey++}`}
        className="my-3 overflow-hidden rounded-2xl border border-white/10 bg-[#13141f]"
      >
        {language && (
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-brand-periwinkle">
            <span>{language}</span>
          </div>
        )}
        <pre className="overflow-x-auto p-3 font-mono text-xs text-on-surface leading-relaxed">
          <code>{code.trim()}</code>
        </pre>
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const textChunk = content.slice(lastIndex);
    parts.push(
      <div key={`text-${blockKey++}`} className="space-y-2">
        {renderRegularMarkdown(textChunk)}
      </div>
    );
  }

  return <div className="space-y-2 text-xs leading-relaxed text-on-surface">{parts}</div>;
}

function renderRegularMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let lineIdx = 0;

  while (lineIdx < lines.length) {
    const line = lines[lineIdx];
    const trimmed = line.trim();

    // Dòng trống
    if (!trimmed) {
      lineIdx++;
      continue;
    }

    // Tiêu đề: ###, ##, #
    if (trimmed.startsWith('#### ')) {
      elements.push(
        <h4 key={`h4-${lineIdx}`} className="font-h1 text-xs font-bold text-brand-periwinkle mt-3 mb-1">
          {renderInlineFormatting(trimmed.slice(5))}
        </h4>
      );
      lineIdx++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${lineIdx}`} className="font-h1 text-sm font-bold text-brand-periwinkle mt-4 mb-1.5">
          {renderInlineFormatting(trimmed.slice(4))}
        </h3>
      );
      lineIdx++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${lineIdx}`} className="font-h1 text-base font-bold text-white mt-5 mb-2 border-b border-white/10 pb-1">
          {renderInlineFormatting(trimmed.slice(3))}
        </h2>
      );
      lineIdx++;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${lineIdx}`} className="font-h1 text-lg font-bold text-white mt-5 mb-2 border-b border-white/10 pb-1.5">
          {renderInlineFormatting(trimmed.slice(2))}
        </h1>
      );
      lineIdx++;
      continue;
    }

    // Đường kẻ ngang: ---
    if (trimmed === '---' || trimmed === '***') {
      elements.push(<hr key={`hr-${lineIdx}`} className="my-3 border-white/10" />);
      lineIdx++;
      continue;
    }

    // Bảng Markdown: | cột 1 | cột 2 |
    //                 | --- | --- |
    //                 | ô 1 | ô 2 |
    // Dòng đầu là tiêu đề, dòng thứ hai là dòng phân cách, các dòng sau là dữ liệu.
    if (trimmed.startsWith('|')) {
      const tableStart = lineIdx;
      const tableLines: string[] = [];
      while (lineIdx < lines.length && lines[lineIdx].trim().startsWith('|')) {
        tableLines.push(lines[lineIdx].trim());
        lineIdx++;
      }

      if (tableLines.length >= 2 && isTableSeparator(tableLines[1])) {
        elements.push(renderTable(tableLines, `table-${tableStart}`));
      } else {
        // Không phải bảng hợp lệ — trả về đoạn văn thô để không mất nội dung.
        tableLines.forEach((raw, i) => {
          elements.push(
            <p key={`tp-${tableStart}-${i}`} className="leading-relaxed">
              {renderInlineFormatting(raw)}
            </p>
          );
        });
      }
      continue;
    }

    // Trích dẫn: >
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`quote-${lineIdx}`}
          className="my-2 border-l-2 border-brand-periwinkle/60 bg-brand-periwinkle/5 pl-3 py-1 italic text-on-surface-variant rounded-r-xl"
        >
          {renderInlineFormatting(trimmed.slice(2))}
        </blockquote>
      );
      lineIdx++;
      continue;
    }

    // Danh sách đầu dòng (- hoặc *)
    if (/^[-*]\s+/.test(trimmed)) {
      const listItems: React.ReactNode[] = [];
      while (lineIdx < lines.length && /^[-*]\s+/.test(lines[lineIdx].trim())) {
        const itemText = lines[lineIdx].trim().replace(/^[-*]\s+/, '');
        listItems.push(
          <li key={`li-${lineIdx}`} className="flex items-start gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-periwinkle" />
            <span className="flex-1">{renderInlineFormatting(itemText)}</span>
          </li>
        );
        lineIdx++;
      }
      elements.push(
        <ul key={`ul-${lineIdx}`} className="my-2 space-y-1 pl-1">
          {listItems}
        </ul>
      );
      continue;
    }

    // Danh sách đánh số (1. 2. 3.)
    if (/^\d+\.\s+/.test(trimmed)) {
      const listItems: React.ReactNode[] = [];
      while (lineIdx < lines.length && /^\d+\.\s+/.test(lines[lineIdx].trim())) {
        const itemMatch = lines[lineIdx].trim().match(/^(\d+)\.\s+(.*)/);
        if (itemMatch) {
          listItems.push(
            <li key={`oli-${lineIdx}`} className="flex items-start gap-2">
              <span className="font-mono text-[11px] font-bold text-brand-periwinkle shrink-0 mt-0.5">
                {itemMatch[1]}.
              </span>
              <span className="flex-1">{renderInlineFormatting(itemMatch[2])}</span>
            </li>
          );
        }
        lineIdx++;
      }
      elements.push(
        <ol key={`ol-${lineIdx}`} className="my-2 space-y-1 pl-1">
          {listItems}
        </ol>
      );
      continue;
    }

    // Đoạn văn bản thông thường
    elements.push(
      <p key={`p-${lineIdx}`} className="leading-relaxed">
        {renderInlineFormatting(trimmed)}
      </p>
    );
    lineIdx++;
  }

  return elements;
}

function renderInlineFormatting(text: string): React.ReactNode {
  // Biểu thức chính quy tách:
  // 1. In đậm: **text**
  // 2. In nghiêng: *text*
  // 3. Inline code: `text`
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={index} className="italic text-brand-periwinkle/90">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="rounded-md border border-white/10 bg-black/30 px-1.5 py-0.5 font-mono text-[11px] text-brand-periwinkle"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

/** Cắt một dòng bảng thành các ô: bỏ dấu | ở hai đầu rồi tách theo |. */
function splitTableRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((cell) => cell.trim());
}

/** Dòng phân cách của bảng: chỉ gồm dấu gạch và dấu hai chấm, VD `| --- | :--: |`. */
function isTableSeparator(line: string): boolean {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{1,}:?$/.test(cell));
}

/** Căn lề cột đọc từ dòng phân cách: :--- trái · :---: giữa · ---: phải. */
function columnAlignment(separatorCell: string): 'left' | 'center' | 'right' {
  const left = separatorCell.startsWith(':');
  const right = separatorCell.endsWith(':');
  if (left && right) return 'center';
  if (right) return 'right';
  return 'left';
}

function renderTable(tableLines: string[], key: string): React.ReactNode {
  const headers = splitTableRow(tableLines[0]);
  const alignments = splitTableRow(tableLines[1]).map(columnAlignment);
  const bodyRows = tableLines.slice(2).map(splitTableRow);

  const alignClass = (index: number) =>
    alignments[index] === 'center' ? 'text-center' : alignments[index] === 'right' ? 'text-right' : 'text-left';

  return (
    <div key={key} className="my-3 overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[20rem] border-collapse text-xs">
        <thead>
          <tr className="bg-white/[0.05]">
            {headers.map((header, columnIndex) => (
              <th
                key={columnIndex}
                scope="col"
                className={`border-b border-white/15 px-3 py-2 font-bold text-brand-periwinkle ${alignClass(columnIndex)}`}
              >
                {renderInlineFormatting(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 1 ? 'bg-white/[0.02]' : undefined}>
              {/* Ô thiếu thì để trống, ô thừa thì cắt bỏ — luôn khớp số cột tiêu đề. */}
              {headers.map((_, columnIndex) => (
                <td
                  key={columnIndex}
                  className={`border-b border-white/5 px-3 py-2 align-top text-on-surface ${alignClass(columnIndex)}`}
                >
                  {renderInlineFormatting(row[columnIndex] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
