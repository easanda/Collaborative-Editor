import { useState, useEffect, RefObject } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, ChevronDown, ChevronUp, Replace } from "lucide-react";

interface FindReplaceProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  content: string;
  onContentChange: (content: string) => void;
  onClose: () => void;
}

export function FindReplace({ textareaRef, content, onContentChange, onClose }: FindReplaceProps) {
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);

  useEffect(() => {
    if (!find) { setMatchCount(0); return; }
    const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const matches = [...content.matchAll(regex)];
    setMatchCount(matches.length);
    setCurrentMatch(matches.length > 0 ? 1 : 0);
  }, [find, content]);

  const handleFindNext = () => {
    if (!find || !textareaRef.current) return;
    const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const matches = [...content.matchAll(regex)];
    if (!matches.length) return;
    const idx = currentMatch % matches.length;
    const m = matches[idx];
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(m.index!, m.index! + m[0].length);
    setCurrentMatch(idx + 1);
  };

  const handleFindPrev = () => {
    if (!find || !textareaRef.current) return;
    const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const matches = [...content.matchAll(regex)];
    if (!matches.length) return;
    const idx = (currentMatch - 2 + matches.length) % matches.length;
    const m = matches[idx];
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(m.index!, m.index! + m[0].length);
    setCurrentMatch(idx + 1);
  };

  const handleReplaceOne = () => {
    if (!find) return;
    const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    onContentChange(content.replace(regex, replace));
  };

  const handleReplaceAll = () => {
    if (!find) return;
    const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    onContentChange(content.replace(regex, replace));
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && e.shiftKey) handleFindPrev();
      else if (e.key === "Enter") handleFindNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [find, currentMatch, content]);

  return (
    <div className="absolute top-2 right-4 z-50 bg-card border border-border rounded-lg shadow-xl p-3 w-80">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground">Find & Replace</span>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
          <X className="w-3 h-3" />
        </Button>
      </div>
      <div className="space-y-2">
        <div className="relative flex items-center gap-1">
          <Input
            autoFocus
            value={find}
            onChange={(e) => setFind(e.target.value)}
            placeholder="Find…"
            className="h-7 text-xs pr-16"
          />
          {find && (
            <span className="absolute right-16 text-[10px] text-muted-foreground">
              {matchCount > 0 ? `${currentMatch}/${matchCount}` : "0 results"}
            </span>
          )}
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={handleFindPrev} disabled={!matchCount}>
            <ChevronUp className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={handleFindNext} disabled={!matchCount}>
            <ChevronDown className="w-3 h-3" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Input
            value={replace}
            onChange={(e) => setReplace(e.target.value)}
            placeholder="Replace with…"
            className="h-7 text-xs flex-1"
          />
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs shrink-0" onClick={handleReplaceOne} disabled={!find || !matchCount}>
            Replace
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs shrink-0" onClick={handleReplaceAll} disabled={!find || !matchCount}>
            All
          </Button>
        </div>
      </div>
    </div>
  );
}
