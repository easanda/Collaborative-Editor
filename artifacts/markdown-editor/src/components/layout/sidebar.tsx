import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListDocuments, useCreateDocument, useDeleteDocument, useDuplicateDocument } from "@workspace/api-client-react";
import { Plus, FileText, Trash2, Search, Loader2, Copy, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";

const TAG_COLORS: Record<string, string> = {};
const PALETTE = ["#f38ba8", "#a6e3a1", "#89b4fa", "#fab387", "#cba6f7", "#94e2d5", "#f9e2af"];

function tagDotColor(tag: string) {
  if (!TAG_COLORS[tag]) {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) hash = (hash + tag.charCodeAt(i)) % PALETTE.length;
    TAG_COLORS[tag] = PALETTE[hash];
  }
  return TAG_COLORS[tag];
}

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useListDocuments();

  const createMutation = useCreateDocument({
    mutation: {
      onSuccess: (newDoc) => {
        queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
        setLocation(`/doc/${newDoc.id}`);
        onMobileClose?.();
      },
    },
  });

  const deleteMutation = useDeleteDocument({
    mutation: {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
        if (location === `/doc/${variables.id}`) setLocation("/");
      },
    },
  });

  const duplicateMutation = useDuplicateDocument({
    mutation: {
      onSuccess: (newDoc) => {
        queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
        setLocation(`/doc/${newDoc.id}`);
        onMobileClose?.();
      },
    },
  });

  const handleCreate = () => {
    createMutation.mutate({ data: { title: "Untitled Document", content: "# Untitled Document\n\nStart typing here…" } });
  };

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase()) ||
    (doc.tags ?? []).some((t) => t.includes(search.toLowerCase()))
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onMobileClose} />
      )}

      <div
        className={`
          fixed md:relative inset-y-0 left-0 z-40 md:z-auto
          w-72 border-r border-border bg-sidebar h-screen flex flex-col flex-shrink-0
          transition-transform duration-200
          ${isMobileOpen === undefined ? "" : isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3 mb-4">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-7 h-7 rounded-md" />
            <h1 className="font-bold text-sidebar-foreground tracking-tight">MarkSync</h1>
            {onMobileClose && (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 ml-auto md:hidden" onClick={onMobileClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/10 font-medium h-9"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            New Document
          </Button>
        </div>

        <div className="px-4 py-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-9 bg-sidebar-accent/50 border-transparent focus-visible:ring-primary/50 text-sm h-8"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center p-6 text-xs text-muted-foreground">No documents found.</div>
          ) : (
            filteredDocs.map((doc) => {
              const isActive = location === `/doc/${doc.id}`;
              const tags = doc.tags ?? [];
              return (
                <div
                  key={doc.id}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm border border-sidebar-border/50"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground border border-transparent"
                  }`}
                  onClick={() => { setLocation(`/doc/${doc.id}`); onMobileClose?.(); }}
                >
                  <div className="flex items-start gap-2.5 overflow-hidden flex-1 min-w-0">
                    <FileText className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? "text-primary" : ""}`} />
                    <div className="overflow-hidden min-w-0 flex-1">
                      <p className="text-sm font-medium truncate leading-tight">{doc.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-[10px] text-muted-foreground/70">
                          {format(new Date(doc.updatedAt), "MMM d")}
                        </p>
                        {tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tagDotColor(tag) }} title={tag} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); duplicateMutation.mutate({ id: doc.id }); }}
                      className="p-1 rounded hover:bg-accent/50 hover:text-foreground transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this document?")) deleteMutation.mutate({ id: doc.id });
                      }}
                      className="p-1 rounded hover:bg-destructive/20 hover:text-destructive transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
