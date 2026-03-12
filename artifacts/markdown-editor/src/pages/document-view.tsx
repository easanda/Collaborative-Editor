import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams } from "wouter";
import { useGetDocument, useUpdateDocument } from "@workspace/api-client-react";
import { useSocket } from "@/hooks/use-socket";
import { useDarkMode, useEditorTheme } from "@/hooks/use-theme";
import { Toolbar } from "@/components/editor/toolbar";
import { FormattingToolbar } from "@/components/editor/formatting-toolbar";
import { StatusBar } from "@/components/editor/status-bar";
import { FindReplace } from "@/components/editor/find-replace";
import { TagsBar } from "@/components/editor/tags-bar";
import { VersionHistory } from "@/components/editor/version-history";
import { ShareDialog } from "@/components/editor/share-dialog";
import { useDebounce } from "use-debounce";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { generateUserId, generateUsername, getRandomColor, EDITOR_THEMES, type TextUpdateEvent } from "@/lib/types";

const USER_ID = generateUserId();
const USERNAME = generateUsername();
const USER_COLOR = getRandomColor();

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function markdownToHtml(title: string, content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #24292f; }
    pre { background: #f6f8fa; padding: 1rem; border-radius: 6px; overflow: auto; }
    code { background: #f6f8fa; padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.9em; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #d0d7de; padding-left: 1rem; color: #57606a; margin: 0; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #d0d7de; padding: 8px 12px; }
    th { background: #f6f8fa; }
    img { max-width: 100%; }
  </style>
</head>
<body>
  <div id="content">
${content}
  </div>
</body>
</html>`;
}

export function DocumentView() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: document, isLoading, error } = useGetDocument(id!);
  const updateMutation = useUpdateDocument({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/documents"] }),
    },
  });

  // UI state
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [shareToken, setShareToken] = useState<string | null | undefined>(null);
  const [isTypingLocally, setIsTypingLocally] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [splitRatio, setSplitRatio] = useState(50);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [isMobileView, setIsMobileView] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDragging = useRef(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  const { isDark, toggle: toggleDark } = useDarkMode();
  const { theme: editorTheme, changeTheme: setEditorTheme } = useEditorTheme();
  const themeStyles = EDITOR_THEMES[editorTheme];

  // Debounce for auto-save
  const [debouncedContent] = useDebounce(content, 2000);
  const [debouncedTitle] = useDebounce(title, 2000);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Socket handlers
  const handleRemoteTextUpdate = useCallback((event: TextUpdateEvent) => {
    setContent(event.content);
  }, []);

  const handleRemoteTitleUpdate = useCallback((newTitle: string) => {
    setTitle(newTitle);
  }, []);

  const { isConnected, activeUsers, emitTextUpdate, emitTitleUpdate, emitTyping } = useSocket(
    id,
    USER_ID,
    USERNAME,
    USER_COLOR,
    handleRemoteTextUpdate,
    handleRemoteTitleUpdate
  );

  // Init from DB
  useEffect(() => {
    if (document && !isTypingLocally) {
      setContent(document.content);
      setTitle(document.title);
      setTags(document.tags ?? []);
      setShareToken(document.shareToken ?? null);
    }
  }, [document?.id]);

  // Auto-save
  useEffect(() => {
    if (!document) return;
    if (debouncedContent === document.content && debouncedTitle === document.title) return;
    updateMutation.mutate({ id: id!, data: { content: debouncedContent, title: debouncedTitle } });
  }, [debouncedContent, debouncedTitle]);

  // Content change handler
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setIsTypingLocally(true);
    emitTextUpdate({ documentId: id!, content: newContent, userId: USER_ID });
    emitTyping(id!, USER_ID, USERNAME, USER_COLOR, true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      emitTyping(id!, USER_ID, USERNAME, USER_COLOR, false);
      setIsTypingLocally(false);
    }, 2000);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setIsTypingLocally(true);
    emitTitleUpdate(id!, newTitle, USER_ID);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "b") { e.preventDefault(); applyFormat("**", "bold text"); }
        if (e.key === "i") { e.preventDefault(); applyFormat("_", "italic text"); }
        if (e.key === "k") { e.preventDefault(); insertLink(); }
        if (e.key === "`") { e.preventDefault(); applyFormat("`", "code"); }
        if (e.key === "f") { e.preventDefault(); setShowFindReplace((v) => !v); }
        if (e.key === "/") { e.preventDefault(); /* handled by ShortcutsModal in toolbar */ }
        if (e.shiftKey && e.key === "C") { e.preventDefault(); insertCodeBlock(); }
      }
      if (e.key === "Escape") {
        if (isFocusMode) setIsFocusMode(false);
        if (showFindReplace) setShowFindReplace(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFocusMode, showFindReplace, content]);

  const applyFormat = (syntax: string, placeholder: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end) || placeholder;
    const newContent = content.slice(0, start) + syntax + selected + syntax + content.slice(end);
    handleContentChange(newContent);
    setTimeout(() => ta.setSelectionRange(start + syntax.length, start + syntax.length + selected.length), 0);
  };

  const insertLink = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end) || "link text";
    const newContent = content.slice(0, start) + `[${selected}](url)` + content.slice(end);
    handleContentChange(newContent);
    setTimeout(() => ta.setSelectionRange(start + selected.length + 3, start + selected.length + 6), 0);
  };

  const insertCodeBlock = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const selected = content.slice(start, ta.selectionEnd) || "code here";
    const newContent = content.slice(0, start) + "```\n" + selected + "\n```" + content.slice(ta.selectionEnd);
    handleContentChange(newContent);
  };

  // Export
  const handleExportMd = () => {
    downloadFile(content, `${title || "document"}.md`, "text/markdown");
  };

  const handleExportHtml = () => {
    const simpleHtml = content
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/_(.+?)_/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");
    downloadFile(markdownToHtml(title, simpleHtml), `${title || "document"}.html`, "text/html");
  };

  // Import
  const handleImport = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      handleContentChange(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Resizable pane
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    const container = splitContainerRef.current;
    if (!container) return;
    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const rect = container.getBoundingClientRect();
      const ratio = ((ev.clientX - rect.left) / rect.width) * 100;
      setSplitRatio(Math.min(80, Math.max(20, ratio)));
    };
    const onUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Version restore
  const handleVersionRestore = (restoredContent: string, restoredTitle: string) => {
    setContent(restoredContent);
    setTitle(restoredTitle);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background text-muted-foreground space-y-4">
        <div className="text-destructive w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <span className="text-2xl font-bold">!</span>
        </div>
        <h2 className="text-xl font-semibold text-foreground">Document Not Found</h2>
        <p>This document may have been deleted.</p>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col overflow-hidden bg-background ${isFocusMode ? "fixed inset-0 z-50" : ""}`}>
      {/* Hidden file input for import */}
      <input ref={fileInputRef} type="file" accept=".md,.txt" className="hidden" onChange={handleFileChange} />

      <Toolbar
        isConnected={isConnected}
        activeUsers={activeUsers}
        documentContent={content}
        documentTitle={title}
        onTitleChange={handleTitleChange}
        isFocusMode={isFocusMode}
        onToggleFocusMode={() => setIsFocusMode((v) => !v)}
        isDark={isDark}
        onToggleDark={toggleDark}
        editorTheme={editorTheme}
        onEditorThemeChange={setEditorTheme}
        onExportMd={handleExportMd}
        onExportHtml={handleExportHtml}
        onImport={handleImport}
        onShowHistory={() => setShowHistory(true)}
        onShowShare={() => setShowShare(true)}
        shareToken={shareToken}
      />

      {!isFocusMode && (
        <FormattingToolbar
          textareaRef={textareaRef}
          content={content}
          onContentChange={handleContentChange}
        />
      )}

      {!isFocusMode && (
        <TagsBar
          documentId={id!}
          tags={tags}
          onTagsChange={setTags}
        />
      )}

      {/* Mobile: editor/preview tabs */}
      {isMobileView && (
        <div className="flex border-b border-border shrink-0">
          <button
            className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === "editor" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
            onClick={() => setActiveTab("editor")}
          >
            Editor
          </button>
          <button
            className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === "preview" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
            onClick={() => setActiveTab("preview")}
          >
            Preview
          </button>
        </div>
      )}

      {/* Split pane */}
      <div ref={splitContainerRef} className="flex-1 flex overflow-hidden relative">
        {/* Editor */}
        {(!isMobileView || activeTab === "editor") && (
          <div
            className="h-full relative flex flex-col overflow-hidden"
            style={{ width: isMobileView ? "100%" : `${splitRatio}%` }}
          >
            {showFindReplace && (
              <FindReplace
                textareaRef={textareaRef}
                content={content}
                onContentChange={handleContentChange}
                onClose={() => setShowFindReplace(false)}
              />
            )}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full h-full p-6 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-0"
              style={{
                backgroundColor: themeStyles.bg,
                color: themeStyles.text,
                caretColor: themeStyles.caret,
                fontFamily: "var(--app-font-mono)",
              }}
              placeholder="Start typing your markdown here…"
              spellCheck={false}
            />
          </div>
        )}

        {/* Drag handle */}
        {!isMobileView && (
          <div
            className="w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors shrink-0 active:bg-primary"
            onMouseDown={handleDragStart}
          />
        )}

        {/* Preview */}
        {(!isMobileView || activeTab === "preview") && (
          <div
            className="h-full overflow-y-auto bg-background"
            style={{ width: isMobileView ? "100%" : `${100 - splitRatio}%` }}
          >
            <div className="p-8 pb-32 max-w-3xl mx-auto">
              <div className="prose prose-invert max-w-none prose-pre:bg-[#1e1e2e] prose-pre:border prose-pre:border-border prose-a:text-primary prose-headings:font-bold prose-img:rounded-xl break-words">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content || "*No content yet.*"}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Version history panel */}
        {showHistory && (
          <VersionHistory
            documentId={id!}
            onClose={() => setShowHistory(false)}
            onRestore={handleVersionRestore}
          />
        )}
      </div>

      {!isFocusMode && (
        <StatusBar content={content} isSaving={updateMutation.isPending} />
      )}

      <ShareDialog
        isOpen={showShare}
        onOpenChange={setShowShare}
        documentId={id!}
        shareToken={shareToken}
        onTokenChange={setShareToken}
      />
    </div>
  );
}
