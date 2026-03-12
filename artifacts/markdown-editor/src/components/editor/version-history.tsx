import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListDocumentVersions, useSaveDocumentVersion, useDeleteDocumentVersion, useRestoreDocumentVersion } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { X, Clock, Save, RotateCcw, Trash2, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface VersionHistoryProps {
  documentId: string;
  onClose: () => void;
  onRestore: (content: string, title: string) => void;
}

export function VersionHistory({ documentId, onClose, onRestore }: VersionHistoryProps) {
  const [newLabel, setNewLabel] = useState("");
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: versions = [], isLoading } = useListDocumentVersions(documentId);

  const saveMutation = useSaveDocumentVersion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}/versions`] });
        setNewLabel("");
        setSavingSnapshot(false);
        toast({ title: "Snapshot saved!" });
      },
    },
  });

  const deleteMutation = useDeleteDocumentVersion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}/versions`] });
      },
    },
  });

  const restoreMutation = useRestoreDocumentVersion({
    mutation: {
      onSuccess: (doc) => {
        onRestore(doc.content, doc.title);
        queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}`] });
        toast({ title: "Document restored to selected version." });
        onClose();
      },
    },
  });

  const handleSaveSnapshot = () => {
    saveMutation.mutate({
      id: documentId,
      data: { label: newLabel || undefined },
    });
  };

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-card border-l border-border shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Version History</h3>
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-3 border-b border-border space-y-2">
        <p className="text-xs text-muted-foreground">Save a labeled snapshot of the current state:</p>
        {savingSnapshot ? (
          <div className="flex gap-2">
            <Input
              autoFocus
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveSnapshot()}
              placeholder="Label (optional)…"
              className="h-7 text-xs flex-1"
            />
            <Button
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleSaveSnapshot}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSavingSnapshot(false)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs gap-1.5"
            onClick={() => setSavingSnapshot(true)}
          >
            <Plus className="w-3 h-3" />
            Save Snapshot
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : versions.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            <Save className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No saved snapshots yet.</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {versions.map((v) => (
              <div
                key={v.id}
                className="group p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-card transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {v.label ?? "Snapshot"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {format(new Date(v.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground truncate mb-2">{v.title}</p>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px] gap-1 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => restoreMutation.mutate({ id: documentId, versionId: v.id })}
                    disabled={restoreMutation.isPending}
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    Restore
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px] gap-1 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                    onClick={() => deleteMutation.mutate({ id: documentId, versionId: v.id })}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
