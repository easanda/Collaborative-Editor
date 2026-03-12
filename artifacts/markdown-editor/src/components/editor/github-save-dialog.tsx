import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSaveToGithub } from "@workspace/api-client-react";
import { Github, Loader2, ExternalLink } from "lucide-react";

interface GithubSaveDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  documentContent: string;
  defaultTitle: string;
}

export function GithubSaveDialog({ isOpen, onOpenChange, documentContent, defaultTitle }: GithubSaveDialogProps) {
  const [filename, setFilename] = useState(`${defaultTitle.toLowerCase().replace(/\s+/g, '-')}.md`);
  const [description, setDescription] = useState(`Exported from Collaborative Markdown Editor`);
  const [isPublic, setIsPublic] = useState(false);
  const [gistUrl, setGistUrl] = useState<string | null>(null);

  const { toast } = useToast();
  const saveMutation = useSaveToGithub({
    mutation: {
      onSuccess: (data) => {
        setGistUrl(data.htmlUrl);
        toast({
          title: "Saved to GitHub successfully!",
          description: "Your markdown document is now a GitHub Gist.",
        });
      },
      onError: (error: any) => {
        const status = error?.status || error?.response?.status;
        if (status === 401) {
          toast({
            variant: "destructive",
            title: "GitHub Token Missing",
            description: "Please configure your GITHUB_TOKEN secret to enable saving to GitHub.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Failed to save",
            description: error?.message || "An unexpected error occurred.",
          });
        }
      }
    }
  });

  const handleSave = () => {
    saveMutation.mutate({
      data: {
        filename,
        content: documentContent || "# Empty Document",
        description,
        isPublic,
      }
    });
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setTimeout(() => setGistUrl(null), 300); // Reset after animation
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <Github className="w-5 h-5 text-primary" />
            Save to GitHub Gist
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Export your current document as a GitHub Gist. Make sure your personal access token is configured.
          </DialogDescription>
        </DialogHeader>

        {gistUrl ? (
          <div className="py-6 flex flex-col items-center justify-center space-y-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="w-12 h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center">
              <Github className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium">Gist created successfully!</p>
            <a 
              href={gistUrl} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium text-sm bg-primary/10 px-4 py-2 rounded-full"
            >
              View Gist <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filename">Filename</Label>
              <Input 
                id="filename" 
                value={filename} 
                onChange={(e) => setFilename(e.target.value)} 
                className="font-mono text-sm bg-background border-border focus-visible:ring-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none h-20 bg-background border-border focus-visible:ring-primary text-sm"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
              <div className="space-y-0.5">
                <Label htmlFor="public-gist" className="text-sm font-medium">Public Gist</Label>
                <p className="text-xs text-muted-foreground">Make this gist visible to everyone</p>
              </div>
              <Switch 
                id="public-gist" 
                checked={isPublic} 
                onCheckedChange={setIsPublic}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={() => handleClose(false)} className="text-muted-foreground hover:text-foreground">
            {gistUrl ? "Close" : "Cancel"}
          </Button>
          {!gistUrl && (
            <Button 
              onClick={handleSave} 
              disabled={saveMutation.isPending || !filename.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-24 shadow-lg shadow-primary/20"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : "Save Gist"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
