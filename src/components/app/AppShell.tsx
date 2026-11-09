"use client";

import { Suspense, type ReactNode } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { UploadDialogProvider } from "./uploadContext";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";
import { BreadcrumbProvider } from "./BreadcrumbContext";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <UploadDialogProvider>
        <BreadcrumbProvider>
          <Suspense fallback={null}>
            <AppSidebar />
          </Suspense>

          <SidebarInset className="min-w-0 bg-background">
            <Suspense fallback={null}>
              <AppHeader />
            </Suspense>
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              {children}
            </main>
          </SidebarInset>
        </BreadcrumbProvider>
      </UploadDialogProvider>
    </SidebarProvider>
  );
}
