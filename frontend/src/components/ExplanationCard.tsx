import ReactMarkdown from "react-markdown";

import { INK, INK_2, MINT } from "../theme";

interface Props {
  markdown: string;
}

export default function ExplanationCard({ markdown }: Props) {
  if (!markdown.trim()) return null;
  return (
    <div className="text-base leading-relaxed" style={{ color: INK_2 }}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          strong: ({ children }) => (
            <strong style={{ color: INK, fontWeight: 600 }}>{children}</strong>
          ),
          em: ({ children }) => <em style={{ color: MINT, fontStyle: "italic" }}>{children}</em>,
          ul: ({ children }) => <ul className="mb-3 list-disc pl-5 last:mb-0">{children}</ul>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: MINT }}
            >
              {children}
            </a>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
