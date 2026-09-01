import React from "react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileNavTabs } from "@/components/profile/ProfileNavTabs";

export default function ProfileWorkbenchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { username: string };
}) {
  const username = decodeURIComponent(params.username).replace(/^u\//i, "");

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 pb-16 space-y-6">
      {/* Clean Profile Header */}
      <ProfileHeader username={username} />

      {/* Horizontal Navigation Pills */}
      <ProfileNavTabs username={username} />

      {/* Subpage Content */}
      <main className="w-full">{children}</main>
    </div>
  );
}
