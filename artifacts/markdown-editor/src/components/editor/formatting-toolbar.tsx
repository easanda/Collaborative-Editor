import { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  Code, Quote, List, ListOrdered, Link, Minus, Image as ImageIcon,
  Terminal,
} from "lucide-react";

interface FormattingToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onContentChange: (content: string) => void;
  content: string;
}

type WrapMode = "wrap" | "line-prefix" | "block";

function insertMarkdown(
  textarea: HTMLTextAreaElement,
  syntax: string,
  mode: WrapMode = "wrap",
  placeholder = "text"
): string {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || placeholder;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);

  let newText = "";
  let cursorStart = start;
  let cursorEnd = start;

  if (mode === "wrap") {
    newText = `${before}${syntax}${selected}${syntax}${after}`;
    cursorStart = start + syntax.length;
    cursorEnd = cursorStart + selected.length;
  } else if (mode === "line-prefix") {
    const lineStart = before.lastIndexOf("\n") + 1;
    const lineContent = textarea.value.slice(lineStart, end);
    const newLine = `${syntax}${lineContent}`;
    newText = `${textarea.value.slice(0, lineStart)}${newLine}${after}`;
    cursorStart = lineStart + syntax.length;
    cursorEnd = cursorStart + lineContent.length;
  } else if (mode === "block") {
    const prefix = before.endsWith("\n") || before === "" ? "" : "\n";
    const suffix = after.startsWith("\n") || after === "" ? "" : "\n";
    newText = `${before}${prefix}${syntax}\n${selected}\n${syntax}${suffix}${after}`;
    cursorStart = start + prefix.length + syntax.length + 1;
    cursorEnd = cursorStart + selected.length;
  }

  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(cursorStart, cursorEnd);
  }, 0);

  return newText;
}

interface FormatBtn {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  action: (ta: HTMLTextAreaElement, content: string) => string;
}

const BUTTONS: FormatBtn[] = [
  {
    icon: <Bold className="w-3.5 h-3.5" />, label: "Bold", shortcut: "Ctrl+B",
    action: (ta, c) => { const n = insertMarkdown(ta, "**", "wrap", "bold text"); return n; },
  },
  {
    icon: <Italic className="w-3.5 h-3.5" />, label: "Italic", shortcut: "Ctrl+I",
    action: (ta) => insertMarkdown(ta, "_", "wrap", "italic text"),
  },
  {
    icon: <Strikethrough className="w-3.5 h-3.5" />, label: "Strikethrough",
    action: (ta) => insertMarkdown(ta, "~~", "wrap", "strikethrough"),
  },
  { icon: null, label: "divider1" } as unknown as FormatBtn,
  {
    icon: <Heading1 className="w-3.5 h-3.5" />, label: "Heading 1",
    action: (ta) => insertMarkdown(ta, "# ", "line-prefix"),
  },
  {
    icon: <Heading2 className="w-3.5 h-3.5" />, label: "Heading 2",
    action: (ta) => insertMarkdown(ta, "## ", "line-prefix"),
  },
  {
    icon: <Heading3 className="w-3.5 h-3.5" />, label: "Heading 3",
    action: (ta) => insertMarkdown(ta, "### ", "line-prefix"),
  },
  { icon: null, label: "divider2" } as unknown as FormatBtn,
  {
    icon: <Code className="w-3.5 h-3.5" />, label: "Inline Code", shortcut: "Ctrl+`",
    action: (ta) => insertMarkdown(ta, "`", "wrap", "code"),
  },
  {
    icon: <Terminal className="w-3.5 h-3.5" />, label: "Code Block", shortcut: "Ctrl+Shift+C",
    action: (ta) => insertMarkdown(ta, "```", "block", "code here"),
  },
  {
    icon: <Quote className="w-3.5 h-3.5" />, label: "Blockquote",
    action: (ta) => insertMarkdown(ta, "> ", "line-prefix"),
  },
  { icon: null, label: "divider3" } as unknown as FormatBtn,
  {
    icon: <List className="w-3.5 h-3.5" />, label: "Bullet List",
    action: (ta) => insertMarkdown(ta, "- ", "line-prefix"),
  },
  {
    icon: <ListOrdered className="w-3.5 h-3.5" />, label: "Numbered List",
    action: (ta) => insertMarkdown(ta, "1. ", "line-prefix"),
  },
  {
    icon: <Link className="w-3.5 h-3.5" />, label: "Link", shortcut: "Ctrl+K",
    action: (ta) => {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = ta.value.slice(start, end) || "link text";
      const before = ta.value.slice(0, start);
      const after = ta.value.slice(end);
      const newText = `${before}[${selected}](url)${after}`;
      setTimeout(() => {
        ta.focus();
        const linkStart = start + selected.length + 3;
        ta.setSelectionRange(linkStart, linkStart + 3);
      }, 0);
      return newText;
    },
  },
  {
    icon: <ImageIcon className="w-3.5 h-3.5" />, label: "Image",
    action: (ta) => {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = ta.value.slice(start, end) || "alt text";
      const before = ta.value.slice(0, start);
      const after = ta.value.slice(end);
      const newText = `${before}![${selected}](url)${after}`;
      setTimeout(() => {
        ta.focus();
        const linkStart = start + selected.length + 4;
        ta.setSelectionRange(linkStart, linkStart + 3);
      }, 0);
      return newText;
    },
  },
  {
    icon: <Minus className="w-3.5 h-3.5" />, label: "Horizontal Rule",
    action: (ta) => {
      const before = ta.value.slice(0, ta.selectionStart);
      const after = ta.value.slice(ta.selectionEnd);
      const prefix = before.endsWith("\n") || before === "" ? "" : "\n";
      const newText = `${before}${prefix}\n---\n${after}`;
      setTimeout(() => ta.focus(), 0);
      return newText;
    },
  },
];

export function FormattingToolbar({ textareaRef, onContentChange, content }: FormattingToolbarProps) {
  const handleAction = (btn: FormatBtn) => {
    if (!textareaRef.current) return;
    const newContent = btn.action(textareaRef.current, content);
    onContentChange(newContent);
  };

  return (
    <div className="flex items-center gap-0.5 px-4 py-1.5 border-b border-border bg-card/50 flex-wrap">
      {BUTTONS.map((btn, i) => {
        if (btn.label.startsWith("divider")) {
          return <div key={i} className="w-px h-5 bg-border mx-1" />;
        }
        return (
          <Tooltip key={btn.label}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-accent/50"
                onClick={() => handleAction(btn)}
              >
                {btn.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {btn.label}{btn.shortcut ? ` (${btn.shortcut})` : ""}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
