import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  Github, Users, Wifi, WifiOff, Sun, Moon, Maximize2, Minimize2,
  Download, Upload, Clock, Share2, Keyboard, Palette, Menu,
} from "lucide-react";
import type { ActiveUser, EditorTheme } from "@/lib/types";
import { EDITOR_THEMES } from "@/lib/types";
import { GithubSaveDialog } from "./github-save-dialog";
import { ShortcutsModal } from "./shortcuts-modal";

interface ToolbarProps {
  isConnected: boolean;
  activeUsers: ActiveUser[];
  documentContent: string;
  documentTitle: string;
  onTitleChange: (title: string) => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  editorTheme: EditorTheme;
  onEditorThemeChange: (t: EditorTheme) => void;
  onExportMd: () => void;
  onExportHtml: () => void;
  onImport: () => void;
  onShowHistory: () => void;
  onShowShare: () => void;
  shareToken?: string | null;
  onToggleSidebar?: () => void;
  isMobile?: boolean;
}

export function Toolbar({
  isConnected,
  activeUsers,
  documentContent,
  documentTitle,
  onTitleChange,
  isFocusMode,
  onToggleFocusMode,
  isDark,
  onToggleDark,
  editorTheme,
  onEditorThemeChange,
  onExportMd,
  onExportHtml,
  onImport,
  onShowHistory,
  onShowShare,
  shareToken,
  onToggleSidebar,
  isMobile,
}: ToolbarProps) {
  const [isGithubDialogOpen, setIsGithubDialogOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between px-3 md:px-6 py-2.5 border-b border-border bg-card shadow-sm z-10 relative shrink-0">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          {isMobile && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={onToggleSidebar}>
              <Menu className="w-4 h-4" />
            </Button>
          )}
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            className="bg-transparent border-none text-base md:text-lg font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-2 py-1 max-w-[140px] md:max-w-xs truncate transition-all"
            placeholder="Untitled Document"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${isConnected ? "bg-primary/10 text-primary border-primary/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                {isConnected ? "Live" : "Offline"}
              </div>
            </TooltipTrigger>
            <TooltipContent>{isConnected ? "Real-time sync active" : "Attempting to reconnect…"}</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {/* Active users */}
          <div className="hidden md:flex items-center -space-x-1.5 mr-1">
            {activeUsers.slice(0, 4).map((user) => (
              <Tooltip key={user.userId}>
                <TooltipTrigger asChild>
                  <div
                    className={`w-7 h-7 rounded-full border-2 border-card flex items-center justify-center text-[10px] font-bold text-white shadow-sm transition-all ${user.isTyping ? "ring-2 ring-offset-1 ring-offset-card animate-pulse" : ""}`}
                    style={{ backgroundColor: user.color, ringColor: user.color }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                </TooltipTrigger>
                <TooltipContent>{user.username}{user.isTyping ? " (typing…)" : ""}</TooltipContent>
              </Tooltip>
            ))}
            {activeUsers.length > 4 && (
              <div className="w-7 h-7 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                +{activeUsers.length - 4}
              </div>
            )}
          </div>

          {/* Share */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${shareToken ? "text-primary" : ""}`} onClick={onShowShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share document</TooltipContent>
          </Tooltip>

          {/* History */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onShowHistory}>
                <Clock className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Version history</TooltipContent>
          </Tooltip>

          {/* Export / Import */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Download className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Export / Import</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onExportMd}>
                <Download className="w-3.5 h-3.5 mr-2" />Export as .md
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportHtml}>
                <Download className="w-3.5 h-3.5 mr-2" />Export as .html
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onImport}>
                <Upload className="w-3.5 h-3.5 mr-2" />Import .md file
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Editor theme */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden md:flex h-8 w-8 p-0">
                    <Palette className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Editor theme</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-48">
              {(Object.keys(EDITOR_THEMES) as EditorTheme[]).map((t) => (
                <DropdownMenuItem key={t} onClick={() => onEditorThemeChange(t)} className={editorTheme === t ? "bg-accent" : ""}>
                  <div className="w-3 h-3 rounded-full mr-2 border border-border" style={{ backgroundColor: EDITOR_THEMES[t].bg }} />
                  {EDITOR_THEMES[t].label}
                  {editorTheme === t && <span className="ml-auto text-primary text-xs">✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dark mode */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onToggleDark}>
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isDark ? "Light mode" : "Dark mode"}</TooltipContent>
          </Tooltip>

          {/* Focus mode */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onToggleFocusMode}>
                {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isFocusMode ? "Exit focus mode" : "Focus mode"}</TooltipContent>
          </Tooltip>

          {/* Shortcuts */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden md:flex h-8 w-8 p-0 text-muted-foreground text-xs font-bold" onClick={() => setIsShortcutsOpen(true)}>
                <Keyboard className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Keyboard shortcuts (Ctrl+/)</TooltipContent>
          </Tooltip>

          {/* GitHub */}
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex border-border hover:bg-muted/50 transition-colors h-8 gap-1.5 text-xs"
            onClick={() => setIsGithubDialogOpen(true)}
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Save to GitHub</span>
          </Button>
        </div>
      </div>

      <GithubSaveDialog
        isOpen={isGithubDialogOpen}
        onOpenChange={setIsGithubDialogOpen}
        documentContent={documentContent}
        defaultTitle={documentTitle || "Untitled"}
      />
      <ShortcutsModal isOpen={isShortcutsOpen} onOpenChange={setIsShortcutsOpen} />
    </>
  );
}
