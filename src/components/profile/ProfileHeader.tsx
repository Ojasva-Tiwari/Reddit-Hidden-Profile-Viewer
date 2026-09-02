"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { UserProfile } from "@/types";

export function ProfileHeader({ username }: { username: string }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [syncing, setSyncing] = useState(false);

  const loadProfile = async () => {
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(username)}`);
      const json = await res.json();
      if (res.ok && !json.error) {
        setProfile(json.data || json.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [username]);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(username)}/sync`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setProfile(data.user);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = (format: "json" | "csv") => {
    window.open(`/api/profile/${encodeURIComponent(username)}/export?format=${format}`, "_blank");
  };

  return (
    <div className="space-y-4 pt-4 sm:pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* User Monogram & Name */}
        <div className="flex items-center gap-3.5">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-surface-container border border-outline/50 flex items-center justify-center text-primary font-bold text-xl overflow-hidden flex-shrink-0 shadow-sm">
            {profile?.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={`u/${username}`}
                width={64}
                height={64}
                unoptimized
                priority
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{username.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
                u/{username}
              </h1>
              {profile?.syncStatus === "COMPLETED" && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Synced" />
              )}
            </div>

            {/* Quick stats pills */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant mt-1">
              {/* Karma Display */}
              {profile ? (
                profile.totalKarma !== null && profile.totalKarma !== undefined ? (
                  <span>
                    <strong className="text-on-surface font-semibold">
                      {profile.totalKarma.toLocaleString()}
                    </strong>{" "}
                    karma
                  </strong>
                ) : profile.linkKarma !== null && profile.linkKarma !== undefined && profile.commentKarma !== null && profile.commentKarma !== undefined ? (
                  <span>
                    <strong className="text-on-surface font-semibold">
                      {profile.linkKarma.toLocaleString()}
                    </strong>{" "}
                    post •{" "}
                    <strong className="text-on-surface font-semibold">
                      {profile.commentKarma.toLocaleString()}
                    </strong>{" "}
                    comment karma
                  </span>
                ) : (
                  <span className="text-on-surface-variant/80">Karma unavailable</span>
                )
              ) : null}

              {/* Account Creation Date vs Join date unavailable */}
              {profile ? (
                <>
                  <span>•</span>
                  {profile.createdUtc ? (
                    <span>
                      Joined{" "}
                      <strong className="text-on-surface font-semibold">
                        {new Date(profile.createdUtc).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </strong>
                    </span>
                  ) : (
                    <span className="text-on-surface-variant/80">Join date unavailable</span>
                  )}
                </>
              ) : null}

              {/* Archive Observation Bounds (distinct from Account Creation Date) */}
              {profile?.firstSeenUtc && (
                <>
                  <span>•</span>
                  <span title="First observed in archival records">
                    First archived{" "}
                    <strong className="text-on-surface font-semibold">
                      {new Date(profile.firstSeenUtc).getFullYear()}
                    </strong>
                  </span>
                </>
              )}

              {profile?.lastSeenUtc && (
                <>
                  <span>•</span>
                  <span>
                    Last active{" "}
                    <strong className="text-on-surface font-semibold">
                      {new Date(profile.lastSeenUtc).getFullYear()}
                    </strong>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-surface-container hover:bg-surface-container-high border border-outline/50 text-on-surface transition-colors disabled:opacity-50"
          >
            <span
              className={`material-symbols-outlined text-[16px] ${
                syncing ? "animate-spin text-primary" : ""
              }`}
            >
              refresh
            </span>
            <span>{syncing ? "Syncing..." : "Sync archive"}</span>
          </button>

          <button
            onClick={() => handleExport("json")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-surface-container hover:bg-surface-container-high border border-outline/50 text-on-surface transition-colors"
            title="Download JSON archive export"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export</span>
          </button>
        </div>
      </div>
    </div>
  );
}
