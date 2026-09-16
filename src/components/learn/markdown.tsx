import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Info, Lightbulb, AlertTriangle } from "lucide-react";
import { Diagram } from "@/components/learn/diagrams";
import { DIAGRAM_IDS, type DiagramId } from "@/content/schemas";
import { cn } from "@/lib/cn";

type HastNode = { type: string; tagName?: string; value?: string; children?: HastNode[] };

function firstStrongText(node: HastNode | undefined): string | null {
  const p = node?.children?.find((c) => c.type === "element" && c.tagName === "p");
  const strong = p?.children?.find((c) => c.type === "element" && c.tagName === "strong");
  const text = strong?.children?.find((c) => c.type === "text")?.value ?? null;
  return text ? text.trim() : null;
}

const calloutStyles = {
  note: { icon: Info, className: "border-brand-200 bg-brand-50 text-brand-800", label: "Note" },
  tip: { icon: Lightbulb, className: "border-cyan-500/40 bg-cyan-100 text-cyan-700", label: "Tip" },
  careful: { icon: AlertTriangle, className: "border-amber-300 bg-warning-50 text-warning-700", label: "Careful" },
} as const;

const components: Components = {
  a: ({ href, children, ...rest }) => {
    const external = typeof href === "string" && /^https?:/.test(href);
    return (
      <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} {...rest}>
        {children}
      </a>
    );
  },
  blockquote: ({ node, children, ...rest }) => {
    const label = firstStrongText(node as HastNode | undefined);
    const key = label?.replace(/:$/, "").toLowerCase() as keyof typeof calloutStyles | undefined;
    if (key && key in calloutStyles) {
      const style = calloutStyles[key];
      const Icon = style.icon;
      return (
        <aside className={cn("not-prose my-6 flex gap-3 rounded-xl border px-4 py-3 text-[0.95rem] leading-6 [&_p]:m-0 [&_p+p]:mt-2 [&_strong:first-child]:sr-only", style.className)} role="note" aria-label={style.label}>
          <Icon className="mt-1 size-4 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">{children}</div>
        </aside>
      );
    }
    return <blockquote {...rest}>{children}</blockquote>;
  },
  code: ({ className, children, ...rest }) => {
    const lang = /language-(\w+)/.exec(className ?? "")?.[1];
    if (lang === "diagram") {
      const id = String(children).trim();
      if ((DIAGRAM_IDS as readonly string[]).includes(id)) return <Diagram id={id as DiagramId} />;
      return <code {...rest}>{children}</code>;
    }
    return (
      <code className={className} {...rest}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...rest }) => {
    // Diagram code blocks render as figures, not <pre>.
    const child = Array.isArray(children) ? children[0] : children;
    const className = (child as { props?: { className?: string } })?.props?.className ?? "";
    if (/language-diagram/.test(className)) return <>{children}</>;
    return <pre {...rest}>{children}</pre>;
  },
  table: ({ children, ...rest }) => (
    <div className="not-prose my-6 overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-sm [&_td]:border-t [&_td]:border-line [&_td]:px-3 [&_td]:py-2 [&_th]:bg-pale [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-navy-900" {...rest}>
        {children}
      </table>
    </div>
  ),
};

export function Markdown({ content, className, compact = false }: { content: string; className?: string; compact?: boolean }) {
  return (
    <div className={cn("prose prose-club max-w-none", compact && "prose-sm", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} skipHtml>
        {content}
      </ReactMarkdown>
    </div>
  );
}
