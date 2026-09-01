"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState } from "@/components/ui/StateDisplays";
import { ContentDetailModal } from "@/components/modals/ContentDetailModal";
import { UserProfile } from "@/types";

export default function ProfileOverviewPage({ params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username).replace(/^u\//i, "");

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSourceOrigin, setDataSourceOrigin] = useState<string>("UPSTREAM");
  const [selectedContent, setSelectedContent] = useState<any | null>(null);

  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(username)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || `No historical records found for user u/${username}.`);
        setProfile(null);
      } else {
        setProfile(data.user);
        setDataSourceOrigin(data.source || "ARCTIC_SHIFT");
      }
    } catch (err: any) {
      setError(`Failed to connect to internal profile API: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [username]);

  const triggerHistoricalSync = async () => {
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
    } catch (err: any) {
      console.error("Sync error:", err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <LoadingState
        message={`Querying Arctic Shift historical indexes for target u/${username}...`}
      />
    );
  }

  if (error || !profile) {
    return (
      <ErrorState
        title="Archival Target Not Found"
        message={error || `Could not find historical Reddit records for user 'u/${username}'.`}
        onRetry={fetchProfileData}
      />
    );
  }

  const syncStatusLabel =
    profile.syncStatus === "COMPLETED"
      ? "Archive Sync: Complete"
      : profile.syncStatus === "IN_PROGRESS" || syncing
      ? "Archive Sync: Syncing..."
      : profile.syncStatus === "PARTIAL"
      ? "Archive Sync: Partial (100 Items)"
      : "Archive Sync: Initialized";

  return (
    <>
      {/* Live Data Provenance Banner */}
      <div className="flex items-center justify-between p-xs px-sm bg-secondary/10 border border-secondary/30 rounded-sm font-code text-[11px] text-secondary">
        <span className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-[14px]" data-icon="database">
            database
          </span>
          <span>[LIVE ARCTIC SHIFT DATA]: Retrieved from {dataSourceOrigin} for target u/{profile.username}</span>
        </span>
        <span className="font-bold">STATUS: VERIFIED</span>
      </div>

      {/* Profile Header Hero Card (Screen 1) */}
      <section className="bg-surface-container-low border border-outline rounded-sm p-lg md:p-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-xl relative">
        {/* Sync Status Badge */}
        <div className="absolute top-md right-md flex items-center gap-xs px-sm py-[2px] bg-surface-container-lowest border border-outline rounded-full">
          <div
            className={`w-2 h-2 rounded-full ${
              profile.syncStatus === "COMPLETED"
                ? "bg-secondary"
                : syncing || profile.syncStatus === "IN_PROGRESS"
                ? "bg-primary animate-pulse"
                : "bg-status-edited"
            }`}
          />
          <span className="font-code text-code text-on-surface-variant">{syncStatusLabel}</span>
        </div>

        <div className="flex items-center gap-xl mt-lg md:mt-0">
          {/* Avatar / Monogram */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-sm bg-surface-container-lowest border border-outline flex items-center justify-center overflow-hidden flex-shrink-0 text-primary font-display-lg">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={`u/${profile.username}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="material-symbols-outlined text-[48px]" data-icon="fingerprint">
                fingerprint
              </span>
            )}
          </div>

          <div>
            <h1 className="font-display-lg text-display-lg text-on-background mb-xs">
              u/{profile.username}
            </h1>
            <div className="flex flex-wrap items-center gap-md font-code text-code text-on-surface-variant">
              {profile.redditId && (
                <>
                  <span className="flex items-center gap-xs text-primary">
                    <span className="material-symbols-outlined text-[16px]" data-icon="tag">
                      tag
                    </span>
                    {profile.redditId}
                  </span>
                  <span className="text-outline">|</span>
                </>
              )}
              <span className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px]" data-icon="visibility">
                  visibility
                </span>
                First: {profile.firstSeenUtc ? new Date(profile.firstSeenUtc).getFullYear() : "Archived"}
              </span>
              <span className="text-outline">|</span>
              <span className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px]" data-icon="update">
                  update
                </span>
                Last: {profile.lastSeenUtc ? new Date(profile.lastSeenUtc).getFullYear() : "Recent"}
              </span>
            </div>
          </div>
        </div>

        {/* Sync Controls & Total Karma Block */}
        <div className="flex flex-col md:items-end font-code border-t md:border-t-0 md:border-l border-outline pt-md md:pt-0 md:pl-xl w-full md:w-auto gap-sm">
          <div>
            <span className="font-label-caps text-label-caps text-on-surface-variant block md:text-right">
              TOTAL ARCHIVED KARMA
            </span>
            <span className="text-display-lg font-display-lg text-primary block md:text-right">
              {profile.totalKarma.toLocaleString()}
            </span>
            <span className="text-code text-on-surface-variant text-[11px] block md:text-right">
              {profile.linkKarma.toLocaleString()} Post • {profile.commentKarma.toLocaleString()} Comment
            </span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={triggerHistoricalSync}
            disabled={syncing}
            icon={syncing ? "sync" : "refresh"}
          >
            {syncing ? "SYNCING HISTORICAL RECORDS..." : "RUN ARCHIVAL SYNC"}
          </Button>
        </div>
      </section>

      {/* Metric Tiles Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-sm">
        <Card level={1} density="compact">
          <span className="font-label-caps text-[10px] text-on-surface-variant block">ACCOUNT STATUS</span>
          <span className="font-code text-headline-sm text-secondary font-semibold">ACTIVE</span>
        </Card>
        <Card level={1} density="compact">
          <span className="font-label-caps text-[10px] text-on-surface-variant block">SYNC PROGRESS</span>
          <span className="font-code text-headline-sm text-on-surface font-semibold">
            {profile.syncProgressPercent ?? 0}%
          </span>
        </Card>
        <Card level={1} density="compact">
          <span className="font-label-caps text-[10px] text-status-deleted block">DELETED CONTENT</span>
          <span className="font-code text-headline-sm text-status-deleted font-semibold">TRACKED</span>
        </Card>
        <Card level={1} density="compact">
          <span className="font-label-caps text-[10px] text-status-removed block">MOD REMOVALS</span>
          <span className="font-code text-headline-sm text-status-removed font-semibold">TRACKED</span>
        </Card>
        <Card level={1} density="compact">
          <span className="font-label-caps text-[10px] text-status-edited block">REVISION DIFFS</span>
          <span className="font-code text-headline-sm text-status-edited font-semibold">PRESERVED</span>
        </Card>
        <Card level={1} density="compact">
          <span className="font-label-caps text-[10px] text-primary block">AI PROFILING</span>
          <span className="font-code text-headline-sm text-primary font-semibold">READY</span>
        </Card>
      </section>

      {/* Two Column Layout: Navigation shortcuts & Phase 2 AI callout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Left 2 Cols: Archive feeds navigation */}
        <div className="lg:col-span-2 space-y-md">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-xs">
              <span className="material-symbols-outlined text-[20px] text-secondary" data-icon="inventory_2">
                inventory_2
              </span>
              <span>Archival Feeds & Timeline</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <Link href={`/u/${username}/posts`} className="block">
              <Card level={1} density="normal" hoverable className="space-y-xs h-full">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-secondary">POSTS ARCHIVE</span>
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">arrow_forward</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Submissions Feed
                </h3>
                <p className="font-body-dense text-body-dense text-on-surface-variant">
                  Inspect submitted posts, selftexts, media attachments, and removal states.
                </p>
              </Card>
            </Link>

            <Link href={`/u/${username}/comments`} className="block">
              <Card level={1} density="normal" hoverable className="space-y-xs h-full">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-secondary">COMMENTS ARCHIVE</span>
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">arrow_forward</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Comments Feed
                </h3>
                <p className="font-body-dense text-body-dense text-on-surface-variant">
                  Historical comment stream with parent context and revision diffs.
                </p>
              </Card>
            </Link>

            <Link href={`/u/${username}/activity`} className="block">
              <Card level={1} density="normal" hoverable className="space-y-xs h-full">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-secondary">ACTIVITY MATRIX</span>
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">arrow_forward</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Community Breakdown
                </h3>
                <p className="font-body-dense text-body-dense text-on-surface-variant">
                  Subreddit distribution charts, time-of-day heatmap, and activity velocity.
                </p>
              </Card>
            </Link>

            <Link href={`/u/${username}/timeline`} className="block">
              <Card level={1} density="normal" hoverable className="space-y-xs h-full">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-secondary">CHRONOLOGY</span>
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">arrow_forward</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Unified Timeline
                </h3>
                <p className="font-body-dense text-body-dense text-on-surface-variant">
                  Linear chronological stream of all user posts and comments over time.
                </p>
              </Card>
            </Link>
          </div>
        </div>

        {/* Right 1 Col: AI Profiling Quick Callout */}
        <div className="space-y-md">
          <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-xs">
            <span className="material-symbols-outlined text-[20px] text-primary" data-icon="auto_awesome">
              auto_awesome
            </span>
            <span>Profile AI Profiling</span>
          </h2>

          <Card level={1} density="normal" className="space-y-md border-primary/30">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-primary">PHASE 2 SUMMARY</span>
              <span className="text-[10px] bg-primary/10 text-primary border border-primary/30 px-xs py-[1px] rounded-sm">
                EVIDENCE CITATIONS
              </span>
            </div>
            <p className="font-body-dense text-body-dense text-on-surface-variant">
              Behavioral analysis synthesized from historical records with verified citations back to original posts and comments.
            </p>
            <Link href={`/u/${username}/ai-summary`} className="block">
              <Button variant="primary" size="md" className="w-full" icon="auto_awesome">
                EXPLORE 30 THINGS
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}
