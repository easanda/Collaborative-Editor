import { useParams } from "wouter";
import { useGetDocumentByShareToken } from "@workspace/api-client-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Lock } from "lucide-react";

export function ShareView() {
  const { token } = useParams<{ token: string }>();
  const { data: document, isLoading, error } = useGetDocumentByShareToken(token!);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Link Not Found</h1>
        <p className="text-muted-foreground max-w-md">
          This shared document link is invalid or has been revoked by its owner.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="MarkSync" className="w-6 h-6 rounded" />
          <span className="font-semibold text-foreground">{document.title}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-3 h-3" />
          Read-only
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-2">{document.title}</h1>
        {document.tags && document.tags.length > 0 && (
          <div className="flex gap-2 mb-8 flex-wrap">
            {document.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full border border-border">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="prose prose-invert max-w-none prose-pre:bg-[#1e1e2e] prose-pre:border prose-pre:border-border prose-a:text-primary prose-headings:font-bold break-words">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {document.content || "*This document is empty.*"}
          </ReactMarkdown>
        </div>
      </main>
    </div>
  );
}
