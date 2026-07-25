import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type MarkdownSize = "sm" | "base" | "lg" | "xl";

const SIZE_CLASS: Record<MarkdownSize, string> = {
  sm: "prose-sm",
  base: "prose-base",
  lg: "prose-lg",
  xl: "prose-xl",
};

// Renderização de Markdown controlada: sem `rehype-raw`/`dangerouslySetInnerHTML`, portanto
// HTML arbitrário no conteúdo nunca é executado (Etapa 9 do prompt original).
// `size` é passado como prop dedicada (não como className livre) para nunca ter duas classes
// `prose-*` de tamanho conflitantes na mesma renderização — `twMerge` não conhece as classes do
// plugin de tipografia para resolver esse conflito sozinho.
export function Markdown({ content, size = "sm" }: { content: string; size?: MarkdownSize }) {
  return (
    <div
      className={`prose ${SIZE_CLASS[size]} dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
