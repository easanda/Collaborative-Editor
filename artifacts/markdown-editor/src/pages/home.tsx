import { FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateDocument } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

export function Home() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const createMutation = useCreateDocument({
    mutation: {
      onSuccess: (newDoc) => {
        queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
        setLocation(`/doc/${newDoc.id}`);
      }
    }
  });

  const handleCreate = () => {
    createMutation.mutate({
      data: {
        title: "Welcome to MarkSync",
        content: "# Welcome to MarkSync\n\nA beautiful, real-time collaborative markdown editor.\n\n## Features\n- **Real-time syncing**: See others type instantly\n- **Live Preview**: GitHub flavored markdown out of the box\n- **Save to Gist**: Instantly export your work to GitHub\n\nEnjoy!"
      }
    });
  };

  return (
    <div className="flex-1 flex items-center justify-center h-screen bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[128px] pointer-events-none" />
      
      <div className="text-center z-10 max-w-md px-6">
        <div className="w-20 h-20 mx-auto mb-8 bg-card border border-border shadow-2xl rounded-2xl flex items-center justify-center animate-in fade-in zoom-in duration-500">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="MarkSync Logo" className="w-12 h-12 rounded-lg" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
          Collaborative Markdown
        </h1>
        
        <p className="text-lg text-muted-foreground mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both leading-relaxed">
          Write, sync, and export beautiful markdown documents in real-time with your team.
        </p>
        
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
          <Button 
            size="lg" 
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 font-semibold px-8 py-6 rounded-xl hover:-translate-y-0.5 transition-all"
            onClick={handleCreate}
            disabled={createMutation.isPending}
          >
            <FileEdit className="w-5 h-5 mr-3" />
            {createMutation.isPending ? "Creating Workspace..." : "Create New Document"}
          </Button>
        </div>
      </div>
    </div>
  );
}
