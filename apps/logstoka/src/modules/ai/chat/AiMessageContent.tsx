import React from 'react';
import { Link } from 'react-router-dom';

type Props = {
  content: string;
  className?: string;
};

type Segment =
  | { type: 'text'; value: string }
  | { type: 'link'; label: string; path: string };

function parseSegments(content: string): Segment[] {
  const segments: Segment[] = [];
  const re = /\[([^\]]+)\]\((\/app\/[^)\s]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(content)) !== null) {
    if (match.index > last) {
      segments.push({ type: 'text', value: content.slice(last, match.index) });
    }
    segments.push({ type: 'link', label: match[1]!, path: match[2]! });
    last = match.index + match[0].length;
  }

  if (last < content.length) {
    segments.push({ type: 'text', value: content.slice(last) });
  }

  return segments.length ? segments : [{ type: 'text', value: content }];
}

const AiMessageContent: React.FC<Props> = ({ content, className }) => {
  const segments = parseSegments(content);

  return (
    <p className={className ?? 'whitespace-pre-wrap text-sm'}>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <React.Fragment key={`t-${i}`}>{seg.value}</React.Fragment>;
        }
        return (
          <Link
            key={`l-${i}-${seg.path}`}
            to={seg.path}
            className="font-bold text-orange-600 underline underline-offset-2 hover:text-orange-700"
          >
            {seg.label}
          </Link>
        );
      })}
    </p>
  );
};

export default AiMessageContent;
