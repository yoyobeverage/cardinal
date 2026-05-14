import ReactMarkdown from "react-markdown";

interface Props {
  markdown: string;
}

export default function ExplanationCard({ markdown }: Props) {
  if (!markdown.trim()) return null;
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900 p-5 text-sm leading-relaxed text-zinc-200">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="text-zinc-100">{children}</strong>,
          em: ({ children }) => <em className="text-emerald-300">{children}</em>,
          ul: ({ children }) => <ul className="mb-3 list-disc pl-5 last:mb-0">{children}</ul>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
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
