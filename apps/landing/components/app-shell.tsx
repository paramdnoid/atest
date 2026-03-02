"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export function AppShell({
  userEmail,
  userName,
  workspaceName,
  children,
}: {
  userEmail: string;
  userName?: string;
  workspaceName: string;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar
        userEmail={userEmail}
        userName={userName}
        workspaceName={workspaceName}
      />
      <SidebarInset>
        <div className="flex-1 overflow-y-auto rounded-xl border border-black/20">
          <div id="main-content" className="mx-auto w-full px-4 pt-2 pb-10 sm:px-6 sm:pt-3">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
