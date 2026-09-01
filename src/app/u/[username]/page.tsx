"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SAMPLE_PROFILE, SAMPLE_POSTS, SAMPLE_COMMENTS } from "@/lib/sampleData";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ContentDetailModal } from "@/components/modals/ContentDetailModal";

export default function ProfileOverviewPage({ params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username);
  const profile = { ...SAMPLE_PROFILE, username };

  const [selectedContent, setSelectedContent] = useState<any | null>(null);

  return (
    <>
      {/* Development Sample Data Banner */}
      <div className="flex items-center justify-between p-xs px-sm bg-primary/10 border border-primary/30 rounded-sm font-code text-[11px] text-primary">
        <span>[MILESTONE 1 MOCKUP]: Displaying structured design-system preview for target u/{username}</span>
        <span className="font-bold">STATUS: VALIDATED</span>
      </div>

      {/* Profile Header Hero Card (Screen 1) */}
      <section className="bg-surface-container-low border border-outline rounded-sm p-lg md:p-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-xl relative">
        {/* Sync Status Badge */}
        <div className="absolute top-md right-md flex items-center gap-xs px-sm py-[2px] bg-surface-container-lowest border border-outline rounded-full">
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="font-code text-code text-on-surface-variant">Archive Sync: Complete</span>
        </div>

        <div className="flex items-center gap-xl mt-lg md:mt-0">
          {/* Avatar / Monogram */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-sm bg-surface-container-lowest border border-outline flex items-center justify-center overflow-hidden flex-shrink-0 text-primary font-display-lg">
            <span className="material-symbols-outlined text-[48px]" data-icon="fingerprint">
              fingerprint
            </span>
          </div>

          <div>
            <h1 className="font-display-lg text-display-lg text-on-background mb-xs">
              u/{profile.username}
            </h1>
            <div className="flex flex-wrap items-center gap-md font-code text-code text-on-surface-variant">
              <span className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px]" data-icon="calendar_today">
                  calendar_today
                </span>
                {profile.accountAgeYears} years
              </span>
              <span className="text-outline">|</span>
              <span className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px]" data-icon="visibility">
                  visibility
                </span>
                First: 2018
              </span>
              <span className="text-outline">|</span>
              <span className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px]" data-icon="update">
                  update
                </span>
                Last: 2024
              </span>
            </div>
          </div>
        </div>

        {/* Total Karma Block */}
        <div className="flex flex-col md:items-end font-code border-t md:border-t-0 md:border-l border-outline pt-md md:pt-0 md:pl-xl w-full md:w-auto">
          <span className="font-label-caps text-label-caps text-on-surface-variant">TOTAL ARCHIVED KARMA</span>
          <span className="text-display-lg font-display-lg text-primary">{profile.totalKarma.toLocaleString()}</span>
          <span className="text-code text-on-surface-variant text-[11px]">
            {profile.linkKarma.toLocaleString()} Post • {profile.commentKarma.toLocaleString()} Comment
          </span>
        </div>
      </section>

      {/* Metric Tiles Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-sm">
        <Card level={1} density="compact">
          <span className="font-label-caps text-[10px] text-on-surface-variant block">TOTAL POSTS</span>
          <span className="font-code text-headline-md text-on-surface font-semibold">{profile.metrics.totalPosts}</span>
        </Card>
        <Card level={1} density="compact">
          <span className="font-label-caps text-[10px] text-on-surface-variant block">TOTAL COMMENTS</span>
          <span className="font-code text-headline-md text-on-surface font-semibold">{profile.metrics.totalComments}</span>
        </Card>
        <Card level={1} density="compact">
          <span className="font-label-caps text-[10px] text-status-deleted block">DELETED BY USER</span>
          <span className="font-code text-headline-md text-status-deleted font-semibold">
            {profile.metrics.deletedPosts + profile.metrics.deletedComments}
          </span>
        </Card>
        <Card level={1} density="compact">
          <span className="font-label-caps text-[10px] text-status-removed block">MOD REMOVED</span>
          <span className="font-code text-headline-md text-status-removed font-semibold">
            {profile.metrics.removedPosts + profile.metrics.removedComments}
          </span>
        </Card>
        <Card level={1} density="compact">
          <span className="font-label-caps text-[10px] text-status-edited block">EDITED REVISIONS</span>
          <span className="font-code text-headline-md text-status-edited font-semibold">
            {profile.metrics.editedPosts + profile.metrics.editedComments}
          </span>
        </Card>
        <Card level={1} density="compact">
          <span className="font-label-caps text-[10px] text-primary block">AI INSIGHTS</span>
          <span className="font-code text-headline-md text-primary font-semibold">30 / 30</span>
        </Card>
      </section>

      {/* Two Column Layout: Recent Archival Activity & Provenance Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Left 2 Cols: Recent Submissions */}
        <div className="lg:col-span-2 space-y-md">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-xs">
              <span className="material-symbols-outlined text-[20px] text-secondary" data-icon="article">
                article
              </span>
              <span>Recent Archival Submissions</span>
            </h2>
            <Link href={`/u/${username}/posts`} className="font-label-caps text-label-caps text-secondary hover:underline">
              VIEW ALL ({profile.metrics.totalPosts}) →
            </Link>
          </div>

          <div className="space-y-sm">
            {SAMPLE_POSTS.slice(0, 3).map((post) => (
              <Card
                key={post.id}
                level={1}
                density="normal"
                hoverable
                onClick={() => setSelectedContent(post)}
                className="space-y-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-xs font-code text-code text-on-surface-variant">
                    <span className="text-secondary font-medium">r/{post.subreddit}</span>
                    <span>•</span>
                    <span>{new Date(post.createdUtc).toLocaleDateString()}</span>
                  </div>
                  <StatusBadge status={post.status} size="sm" />
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold line-clamp-1">
                  {post.title}
                </h3>
                <p className="font-body-dense text-body-dense text-on-surface-variant line-clamp-2">
                  {post.selftext}
                </p>
                <div className="flex items-center gap-md font-code text-code text-on-surface-variant pt-xs border-t border-outline/40">
                  <span className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[14px]" data-icon="thumb_up">
                      thumb_up
                    </span>
                    {post.score}
                  </span>
                  <span className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[14px]" data-icon="chat_bubble">
                      chat_bubble
                    </span>
                    {post.numComments}
                  </span>
                </div>
              </Card>
            ))}
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
                30 INSIGHTS READY
              </span>
            </div>
            <p className="font-body-dense text-body-dense text-on-surface-variant">
              Behavioral analysis synthesized from {profile.metrics.totalPosts + profile.metrics.totalComments} historical records with verified citations.
            </p>
            <Link href={`/u/${username}/ai-summary`} className="block">
              <Button variant="primary" size="md" className="w-full" icon="auto_awesome">
                EXPLORE 30 THINGS
              </Button>
            </Link>
          </Card>

          {/* Subreddit Focus */}
          <Card level={1} density="normal" className="space-y-xs">
            <span className="font-label-caps text-label-caps text-on-surface-variant block">TOP COMMUNITY CONCENTRATION</span>
            <div className="space-y-xs pt-xs">
              <div className="flex items-center justify-between font-code text-code">
                <span className="text-secondary">r/starcraft</span>
                <span className="text-on-surface">36.5%</span>
              </div>
              <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden">
                <div className="bg-secondary h-full" style={{ width: "36.5%" }} />
              </div>

              <div className="flex items-center justify-between font-code text-code pt-xs">
                <span className="text-secondary">r/programming</span>
                <span className="text-on-surface">22.9%</span>
              </div>
              <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: "22.9%" }} />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Content Detail Modal Hook */}
      {selectedContent && (
        <ContentDetailModal
          isOpen={!!selectedContent}
          onClose={() => setSelectedContent(null)}
          title={selectedContent.title}
          author={selectedContent.author}
          subreddit={selectedContent.subreddit}
          redditId={selectedContent.redditId}
          createdUtc={selectedContent.createdUtc}
          editedUtc={selectedContent.editedUtc}
          status={selectedContent.status}
          score={selectedContent.score}
          numComments={selectedContent.numComments}
          currentBody={selectedContent.selftext}
          provenanceHistory={[
            {
              version: 1,
              recordedAt: selectedContent.createdUtc,
              status: "VISIBLE",
              content: selectedContent.selftext,
            },
          ]}
        />
      )}
    </>
  );
}
