import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGenerateShareToken, useRevokeShareToken } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Share2, Copy, Trash2, Loader2, Link, CheckCheck } from "lucide-react";

interface ShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  shareToken?: string | null;
  onTokenChange: (token: string | null) => void;
}

export function ShareDialog({ isOpen, onOpenChange, documentId, shareToken, onTokenChange }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const shareUrl = shareToken
    ? `${window.location.origin}${import.meta.env.BASE_URL}share/${shareToken}`
    : null;

  const generateMutation = useGenerateShareToken({
    mutation: {
      onSuccess: (data) => {
        onTokenChange(data.shareToken);
        queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      },
    },
  });

  const revokeMutation = useRevokeShareToken({
    mutation: {
      onSuccess: () => {
        onTokenChange(null);
        queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
        toast({ title: "Share link revoked." });
      },
    },
  });

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied to clipboard!" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-primary" />
            Share Document
          </DialogTitle>
        </DialogHeader>

        {shareUrl ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Anyone with this link can view (but not edit) this document.
            </p>
            <div className="flex items-center gap-2 p-3 bg-background rounded-lg border border-border">
              <Link className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-foreground font-mono flex-1 truncate">{shareUrl}</p>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant="outline"
                size="sm"
                onClick={handleCopy}
              >
                {copied ? <CheckCheck className="w-3.5 h-3.5 mr-2 text-green-400" /> : <Copy className="w-3.5 h-3.5 mr-2" />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => revokeMutation.mutate({ id: documentId })}
                disabled={revokeMutation.isPending}
              >
                {revokeMutation.isPending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />
                }
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate a shareable read-only link for this document.
            </p>
            <Button
              className="w-full"
              onClick={() => generateMutation.mutate({ id: documentId })}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</>
                : <><Share2 className="w-4 h-4 mr-2" />Generate Share Link</>
              }
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
