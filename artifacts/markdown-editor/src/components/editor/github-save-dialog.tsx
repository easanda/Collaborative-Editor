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
  const [filename, setFilename] = useState(`${defaultTitle.toLowerCase().replace(/\s+/g, "-")}.md`);
  const [description, setDescription] = useState("Exported from Collaborative Markdown Editor");
  const [isPublic, setIsPublic] = useState(false);
  const [gistId, setGistId] = useState("");
  const [gistUrl, setGistUrl] = useState<string | null>(null);

  const isUpdate = gistId.trim().length > 0;
  const { toast } = useToast();

  const saveMutation = useSaveToGithub({
    mutation: {
      onSuccess: (data) => {
        setGistUrl(data.htmlUrl);
        toast({ title: data.isUpdate ? "Gist updated successfully!" : "Gist created successfully!" });
      },
      onError: (error: any) => {
        const status = error?.status || error?.response?.status;
        if (status === 401) {
          toast({ variant: "destructive", title: "GitHub Token Missing", description: "Add GITHUB_TOKEN secret with 'gist' scope to enable this feature." });
        } else {
          toast({ variant: "destructive", title: "Save failed", description: error?.message ?? "An unexpected error occurred." });
        }
      },
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      data: { filename, content: documentContent || "# Empty Document", description, isPublic, gistId: gistId.trim() || null },
    });
  };

  const handleClose = (open: boolean) => {
    if (!open) setTimeout(() => setGistUrl(null), 300);
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Github className="w-5 h-5 text-primary" />
            {isUpdate ? "Update GitHub Gist" : "Save to GitHub Gist"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isUpdate ? "Update an existing Gist with current document content." : "Export as a new GitHub Gist. Make sure your token is configured."}
          </DialogDescription>
        </DialogHeader>

        {gistUrl ? (
          <div className="py-6 flex flex-col items-center justify-center space-y-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="w-12 h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center">
              <Github className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium">{isUpdate ? "Gist updated!" : "Gist created!"}</p>
            <a href={gistUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium text-sm bg-primary/10 px-4 py-2 rounded-full">
              View Gist <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filename">Filename</Label>
              <Input id="filename" value={filename} onChange={(e) => setFilename(e.target.value)} className="font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="resize-none h-16 text-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gistId">
                Existing Gist ID{" "}
                <span className="text-muted-foreground font-normal text-xs">(leave blank to create new)</span>
              </Label>
              <Input id="gistId" value={gistId} onChange={(e) => setGistId(e.target.value)} placeholder="e.g. abc123def456..." className="font-mono text-sm" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
              <div>
                <Label htmlFor="public-gist" className="text-sm font-medium">Public Gist</Label>
                <p className="text-xs text-muted-foreground">Visible to everyone</p>
              </div>
              <Switch id="public-gist" checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={() => handleClose(false)} className="text-muted-foreground">{gistUrl ? "Close" : "Cancel"}</Button>
          {!gistUrl && (
            <Button onClick={handleSave} disabled={saveMutation.isPending || !filename.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-24">
              {saveMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : isUpdate ? "Update Gist" : "Create Gist"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
