import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { Home } from "@/pages/home";
import { DocumentView } from "@/pages/document-view";
import { ShareView } from "@/pages/share-view";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function EditorLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex w-full h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <Sidebar
        isMobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Switch>
          <Route path="/" component={Home} />
          <Route
            path="/doc/:id"
            component={() => (
              <DocumentView onToggleSidebar={() => setMobileSidebarOpen((v) => !v)} />
            )}
          />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/share/:token" component={ShareView} />
      <Route component={EditorLayout} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
