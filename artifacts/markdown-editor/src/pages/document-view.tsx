import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useGetDocument, useUpdateDocument } from "@workspace/api-client-react";
import { useSocket } from "@/hooks/use-socket";
import { Toolbar } from "@/components/editor/toolbar";
import { useDebounce } from "use-debounce";
import { TextUpdateEvent } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function DocumentView() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  
  const { data: document, isLoading, error } = useGetDocument(id!);
  const updateMutation = useUpdateDocument({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      }
    }
  });

  const { socket, isConnected, activeUsers } = useSocket(id);

  // Local state for the editor
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  
  // Track if a remote update just happened to prevent echo loop
  const [isTyping, setIsTyping] = useState(false);

  // Debounce saving to the REST API
  const [debouncedContent] = useDebounce(content, 2000);
  const [debouncedTitle] = useDebounce(title, 2000);

  // Initialize local state when document loads
  useEffect(() => {
    if (document && !isTyping) {
      setContent(document.content);
      setTitle(document.title);
    }
  }, [document?.id]); // Only re-run when document ID changes

  // Handle Socket events
  useEffect(() => {
    if (!socket) return;

    const handleTextUpdate = (data: TextUpdateEvent) => {
      if (data.documentId === id) {
        setIsTyping(false); // Reset typing flag so we accept external changes safely
        setContent(data.content);
      }
    };

    socket.on('text-update', handleTextUpdate);
    return () => {
      socket.off('text-update', handleTextUpdate);
    };
  }, [socket, id]);

  // Handle auto-save via REST API
  useEffect(() => {
    if (!document) return;
    
    // Only save if things actually changed from what we got from the DB
    if (debouncedContent !== document.content || debouncedTitle !== document.title) {
      updateMutation.mutate({
        id: id!,
        data: {
          content: debouncedContent,
          title: debouncedTitle
        }
      });
    }
  }, [debouncedContent, debouncedTitle]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setIsTyping(true);
    
    // Broadcast via socket immediately
    if (socket && isConnected) {
      socket.emit('text-update', {
        documentId: id,
        content: newContent
      } as TextUpdateEvent);
    }
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
        <p>This document may have been deleted or you don't have access to it.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
      <Toolbar 
        isConnected={isConnected}
        activeUsers={activeUsers}
        documentContent={content}
        documentTitle={title}
        onTitleChange={setTitle}
      />
      
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden relative">
        {/* Editor Pane */}
        <div className="h-full border-r border-border/50 relative group">
          <div className="absolute top-0 left-0 w-full p-2 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
             <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-2 py-1 bg-card rounded-sm shadow-sm border border-border">Markdown</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="w-full h-full p-6 bg-transparent text-foreground font-mono text-[14px] leading-relaxed resize-none focus:outline-none focus:ring-0 custom-scrollbar"
            placeholder="Start typing your markdown here..."
            spellCheck={false}
          />
        </div>

        {/* Preview Pane */}
        <div className="h-full relative group bg-grid-pattern bg-background overflow-y-auto custom-scrollbar">
          <div className="absolute top-0 right-0 w-full p-2 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity">
             <span className="text-[10px] uppercase font-bold tracking-wider text-primary px-2 py-1 bg-primary/10 rounded-sm shadow-sm border border-primary/20">Preview</span>
          </div>
          
          <div className="p-8 pb-32 w-full max-w-3xl mx-auto">
            <div className="prose prose-invert prose-pre:bg-[#1e1e2e] prose-pre:border prose-pre:border-border prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-headings:font-bold prose-h1:text-4xl prose-h2:text-2xl prose-h3:text-xl prose-img:rounded-xl prose-img:shadow-lg max-w-none break-words">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content || '*No content yet.*'}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
