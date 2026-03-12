import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListDocuments, useCreateDocument, useDeleteDocument } from "@workspace/api-client-react";
import { Plus, FileText, Trash2, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useListDocuments();
  
  const createMutation = useCreateDocument({
    mutation: {
      onSuccess: (newDoc) => {
        queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
        setLocation(`/doc/${newDoc.id}`);
      }
    }
  });

  const deleteMutation = useDeleteDocument({
    mutation: {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
        if (location === `/doc/${variables.id}`) {
          setLocation('/');
        }
      }
    }
  });

  const handleCreate = () => {
    createMutation.mutate({
      data: {
        title: "Untitled Document",
        content: "# New Document\n\nStart typing here..."
      }
    });
  };

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-72 border-r border-border bg-sidebar h-screen flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 mb-6">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-8 h-8 rounded-md" />
          <h1 className="font-bold text-sidebar-foreground tracking-tight text-lg">MarkSync</h1>
        </div>
        
        <Button 
          onClick={handleCreate} 
          disabled={createMutation.isPending}
          className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/10 transition-all font-medium"
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
            placeholder="Search documents..." 
            className="pl-9 bg-sidebar-accent/50 border-transparent focus-visible:ring-primary/50 text-sm h-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center p-6 text-sm text-muted-foreground">
            No documents found.
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isActive = location === `/doc/${doc.id}`;
            return (
              <div 
                key={doc.id}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm border border-sidebar-border/50" 
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground border border-transparent"
                }`}
                onClick={() => setLocation(`/doc/${doc.id}`)}
              >
                <div className="flex items-start gap-3 overflow-hidden">
                  <FileText className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? "text-primary" : ""}`} />
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate leading-tight">{doc.title}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                      {format(new Date(doc.updatedAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm('Are you sure you want to delete this document?')) {
                      deleteMutation.mutate({ id: doc.id });
                    }
                  }}
                  className={`p-1.5 rounded-md hover:bg-destructive/20 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 ${deleteMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
