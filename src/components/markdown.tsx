import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Renderização de Markdown controlada: sem `rehype-raw`/`dangerouslySetInnerHTML`, portanto
// HTML arbitrário no conteúdo nunca é executado (Etapa 9 do prompt original).
export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
