import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Github, Users, Wifi, WifiOff } from "lucide-react";
import { UserJoinedEvent } from "@/lib/types";
import { GithubSaveDialog } from "./github-save-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ToolbarProps {
  isConnected: boolean;
  activeUsers: UserJoinedEvent[];
  documentContent: string;
  documentTitle: string;
  onTitleChange: (title: string) => void;
}

export function Toolbar({ 
  isConnected, 
  activeUsers, 
  documentContent, 
  documentTitle,
  onTitleChange 
}: ToolbarProps) {
  const [isGithubDialogOpen, setIsGithubDialogOpen] = useState(false);

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card shadow-sm z-10 relative">
      <div className="flex items-center gap-4">
        <input 
          type="text"
          value={documentTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          className="bg-transparent border-none text-lg font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-2 py-1 max-w-xs truncate transition-all"
          placeholder="Untitled Document"
        />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${isConnected ? 'bg-primary/10 text-primary border-primary/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
              {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {isConnected ? 'Connected' : 'Offline'}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {isConnected ? "Real-time sync is active" : "Attempting to reconnect..."}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-4">
        {/* Active Users */}
        <div className="flex items-center -space-x-2">
          {activeUsers.slice(0, 3).map((user) => (
            <Tooltip key={user.userId}>
              <TooltipTrigger asChild>
                <div 
                  className="w-8 h-8 rounded-full border-2 border-card flex items-center justify-center text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: user.color || '#8bd5ca' }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {user.username}
              </TooltipContent>
            </Tooltip>
          ))}
          {activeUsers.length > 3 && (
            <div className="w-8 h-8 rounded-full border-2 border-card bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground z-10 shadow-sm">
              +{activeUsers.length - 3}
            </div>
          )}
          {activeUsers.length > 0 && (
            <div className="ml-4 pl-3 flex items-center gap-1.5 text-sm text-muted-foreground border-l border-border/50 hidden md:flex">
              <Users className="w-4 h-4" />
              <span>{activeUsers.length} active</span>
            </div>
          )}
        </div>

        <Button 
          variant="outline" 
          size="sm"
          className="border-border hover:bg-muted/50 transition-colors"
          onClick={() => setIsGithubDialogOpen(true)}
        >
          <Github className="w-4 h-4 mr-2" />
          Save to GitHub
        </Button>
      </div>

      <GithubSaveDialog 
        isOpen={isGithubDialogOpen} 
        onOpenChange={setIsGithubDialogOpen}
        documentContent={documentContent}
        defaultTitle={documentTitle || "Untitled"}
      />
    </div>
  );
}
