import type { ReactNode } from "react";

export function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${index}`} className="font-semibold text-slate-950">
          {match[1]}
        </strong>,
      );
    } else {
      nodes.push(
        <em key={`${keyPrefix}-i-${index}`} className="italic">
          {match[2] ?? match[3]}
        </em>,
      );
    }
    lastIndex = pattern.lastIndex;
    index += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export function splitTopLevel(text: string, regex: RegExp): string[] {
  const parts: string[] = [];
  let last = 0;
  regex.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    parts.push(match[0]);
    last = regex.lastIndex;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts;
}

const HEADING_SIZES: Record<string, string> = {
  h2: "mt-2 text-xl font-semibold text-slate-950",
  h3: "mt-2 text-lg font-semibold text-slate-950",
  h4: "text-base font-semibold text-slate-900",
};

export function MarkdownBlock({ block, blockKey }: { block: string; blockKey: string }) {
  const lines = block.split("\n");
  const first = lines[0].trim();

  if (first.startsWith("```")) {
    const body = lines
      .slice(1)
      .join("\n")
      .replace(/```\s*$/, "");
    return (
      <pre className="overflow-x-auto rounded-md border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
        <code>{body.replace(/\s+$/, "")}</code>
      </pre>
    );
  }

  if (/^\|.*\|/.test(first)) {
    const rows = lines.filter((line) => /^\s*\|/.test(line));
    const cells = rows.map((row) =>
      row
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim()),
    );

    if (
      cells.length >= 2 &&
      cells[1].every((cell) => /^:?-{2,}:?$/.test(cell) || cell === "")
    ) {
      const [head, , ...body] = cells;

      return (
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-900">
              <tr>
                {head.map((cell, index) => (
                  <th key={`${blockKey}-h-${index}`} className="px-3 py-2 font-semibold">
                    {renderInline(cell, `${blockKey}-h-${index}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={`${blockKey}-r-${rowIndex}`} className="border-t border-slate-100">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`${blockKey}-r-${rowIndex}-c-${cellIndex}`}
                      className="px-3 py-2 align-top text-slate-700"
                    >
                      {renderInline(cell, `${blockKey}-r-${rowIndex}-c-${cellIndex}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }

  if (/^#{2,4} /.test(first)) {
    const level = first.match(/^#+/)![0].length;
    const tag = (['h2', 'h3', 'h4'][level - 2] ?? 'h4') as 'h2' | 'h3' | 'h4';
    const Tag = tag;

    return (
      <Tag className={HEADING_SIZES[tag]}>
        {renderInline(first.replace(/^#+ /, ''), `${blockKey}-hdg`)}
      </Tag>
    );
  }

  if (lines.some((line) => /^[-*] /.test(line.trim()))) {
    const items = lines.filter((line) => /^[-*] /.test(line.trim()));

    return (
      <ul className="list-disc space-y-2 pl-5 text-slate-700">
        {items.map((item, index) => (
          <li key={`${blockKey}-li-${index}`}>
            {renderInline(item.trim().replace(/^[-*] /, ''), `${blockKey}-li-${index}`)}
          </li>
        ))}
      </ul>
    );
  }

  if (/^\d+\. /.test(first)) {
    const items = lines.filter((line) => /^\d+\. /.test(line.trim()));

    return (
      <ol className="list-decimal space-y-2 pl-5 text-slate-700">
        {items.map((item, index) => (
          <li key={`${blockKey}-ol-${index}`}>
            {renderInline(item.trim().replace(/^\d+\. /, ''), `${blockKey}-ol-${index}`)}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <p className="leading-7 text-slate-700">{renderInline(block.trim(), `${blockKey}-p`)}</p>
  );
}

export function renderContent(content: string | null) {
  if (!content) {
    return <p className="text-sm text-slate-600">assessment content is not ready yet.</p>;
  }

  return splitTopLevel(content, /```[\s\S]*?(?:```|$)/g)
    .flatMap((piece, pieceIndex) =>
      piece.includes("```")
        ? [{ text: piece, key: `c-${pieceIndex}` }]
        : piece
            .split(/\n{2,}/)
            .map((part, partIndex) => ({
              text: part,
              key: `t-${pieceIndex}-${partIndex}`,
            })),
    )
    .filter((entry) => entry.text.trim())
    .map((entry) => <MarkdownBlock key={entry.key} block={entry.text} blockKey={entry.key} />);
}
