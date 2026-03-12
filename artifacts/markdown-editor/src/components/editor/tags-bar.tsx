import { useState, KeyboardEvent } from "react";
import { useUpdateDocumentTags } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Plus, Tag } from "lucide-react";

const TAG_COLORS = [
  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "bg-green-500/20 text-green-300 border-green-500/30",
  "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "bg-pink-500/20 text-pink-300 border-pink-500/30",
  "bg-teal-500/20 text-teal-300 border-teal-500/30",
];

function tagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash + tag.charCodeAt(i)) % TAG_COLORS.length;
  return TAG_COLORS[hash];
}

interface TagsBarProps {
  documentId: string;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagsBar({ documentId, tags, onTagsChange }: TagsBarProps) {
  const [input, setInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const queryClient = useQueryClient();

  const updateTagsMutation = useUpdateDocumentTags({
    mutation: {
      onSuccess: (doc) => {
        onTagsChange(doc.tags ?? []);
        queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      },
    },
  });

  const saveTags = (newTags: string[]) => {
    updateTagsMutation.mutate({ id: documentId, data: { tags: newTags } });
  };

  const handleAddTag = () => {
    const tag = input.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag || tags.includes(tag)) { setInput(""); setIsAdding(false); return; }
    const newTags = [...tags, tag];
    saveTags(newTags);
    setInput("");
    setIsAdding(false);
  };

  const handleRemoveTag = (tag: string) => {
    saveTags(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAddTag();
    if (e.key === "Escape") { setInput(""); setIsAdding(false); }
  };

  return (
    <div className="flex items-center gap-1.5 px-4 py-1.5 border-b border-border bg-card/30 flex-wrap min-h-[32px]">
      <Tag className="w-3 h-3 text-muted-foreground shrink-0" />
      {tags.map((tag) => (
        <span
          key={tag}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${tagColor(tag)}`}
        >
          {tag}
          <button
            onClick={() => handleRemoveTag(tag)}
            className="hover:opacity-70 transition-opacity"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}
      {isAdding ? (
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleAddTag}
          className="text-[11px] bg-transparent border-b border-primary outline-none w-24 text-foreground placeholder:text-muted-foreground"
          placeholder="add tag…"
        />
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add tag
        </button>
      )}
    </div>
  );
}
