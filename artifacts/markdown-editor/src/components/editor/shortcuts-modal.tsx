import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

const SHORTCUTS = [
  { category: "Formatting", items: [
    { keys: ["Ctrl", "B"], desc: "Bold" },
    { keys: ["Ctrl", "I"], desc: "Italic" },
    { keys: ["Ctrl", "K"], desc: "Insert Link" },
    { keys: ["Ctrl", "`"], desc: "Inline Code" },
    { keys: ["Ctrl", "Shift", "C"], desc: "Code Block" },
  ]},
  { category: "Navigation", items: [
    { keys: ["Ctrl", "F"], desc: "Find & Replace" },
    { keys: ["Esc"], desc: "Close panels / Exit focus mode" },
    { keys: ["Enter"], desc: "Find next match" },
    { keys: ["Shift", "Enter"], desc: "Find previous match" },
  ]},
  { category: "Document", items: [
    { keys: ["Ctrl", "S"], desc: "Force save" },
    { keys: ["Ctrl", "/"], desc: "Show shortcuts" },
  ]},
];

interface ShortcutsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutsModal({ isOpen, onOpenChange }: ShortcutsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
          {SHORTCUTS.map((section) => (
            <div key={section.category}>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {section.category}
              </h4>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <div key={item.desc} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{item.desc}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, i) => (
                        <kbd
                          key={i}
                          className="px-1.5 py-0.5 text-[10px] font-mono bg-muted border border-border rounded text-muted-foreground"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
