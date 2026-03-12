interface StatusBarProps {
  content: string;
  isSaving: boolean;
}

export function StatusBar({ content, isSaving }: StatusBarProps) {
  const text = content.trim();
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const chars = content.length;
  const lines = content.split("\n").length;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  return (
    <div className="flex items-center justify-between px-4 py-1 border-t border-border bg-card/30 text-[11px] text-muted-foreground select-none shrink-0">
      <div className="flex items-center gap-4">
        <span>{words.toLocaleString()} words</span>
        <span>{chars.toLocaleString()} chars</span>
        <span>{lines.toLocaleString()} lines</span>
        <span>~{readingTime} min read</span>
      </div>
      <div className="flex items-center gap-2">
        {isSaving && (
          <span className="text-primary/70 animate-pulse">Saving…</span>
        )}
      </div>
    </div>
  );
}
