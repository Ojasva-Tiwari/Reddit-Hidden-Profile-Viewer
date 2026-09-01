import React from "react";
import { WorkbenchSidebar } from "@/components/layout/WorkbenchSidebar";

export default function ProfileWorkbenchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { username: string };
}) {
  const username = decodeURIComponent(params.username);

  return (
    <div className="flex flex-1 w-full min-h-[calc(100vh-48px)]">
      {/* 300px Fixed Sidebar */}
      <WorkbenchSidebar username={username} />

      {/* Main Content Area (offset by 300px on desktop) */}
      <main className="flex-1 ml-0 md:ml-[300px] p-margin-mobile md:p-margin-desktop w-full max-w-[1280px] mx-auto flex flex-col gap-lg pb-xl">
        {children}
      </main>
    </div>
  );
}
