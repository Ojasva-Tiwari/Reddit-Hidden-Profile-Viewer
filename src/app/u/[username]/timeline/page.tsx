"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateDisplays";
import { ContentDetailModal } from "@/components/modals/ContentDetailModal";
import { TimelineEvent } from "@/types";

export default function TimelinePage({ params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username).replace(/^u\//i, "");

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  const fetchTimeline = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(username)}/timeline?limit=100&sort=newest`);
      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error?.message || "Failed to load timeline events from archive.");
      } else {
        setEvents(json.data || []);
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [username]);

  if (loading) {
    return <LoadingState message={`Constructing chronological activity timeline for u/${username}...`} />;
  }

  if (error) {
    return (
      <ErrorState
        title="Timeline Query Failed"
        message={error}
        onRetry={fetchTimeline}
      />
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        title="No Timeline Records Found"
        description={`No chronological activity events could be reconstructed for u/${username}.`}
        actionLabel="RETRY"
        onAction={fetchTimeline}
      />
    );
  }

  // Group timeline events by year
  const years = Array.from(new Set(events.map((e) => e.year))).sort((a, b) => b - a);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md pb-xs border-b border-outline">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface flex items-center gap-xs">
            <span className="material-symbols-outlined text-[24px] text-secondary" data-icon="timeline">
              timeline
            </span>
            <span>Historical Activity Timeline</span>
          </h1>
          <p className="font-code text-code text-on-surface-variant">
            Target: u/{username} • Chronological stream of {events.length} submissions and comments
          </p>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="space-y-lg relative pl-6 md:pl-8 border-l border-outline ml-2 md:ml-4 mt-md">
        {years.map((year) => {
          const eventsInYear = events.filter((e) => e.year === year);
          return (
            <div key={year} className="space-y-md relative">
              {/* Year Anchor Node */}
              <div className="absolute -left-[31px] md:-left-[39px] -top-1 flex items-center gap-xs">
                <div className="w-4 h-4 rounded-full bg-secondary-container border-2 border-secondary" />
                <span className="font-label-caps text-label-caps text-secondary font-bold bg-surface-container px-sm py-[2px] rounded-sm border border-outline">
                  {year}
                </span>
              </div>

              {/* Events in this year */}
              <div className="space-y-sm pt-6">
                {eventsInYear.map((ev) => (
                  <Card
                    key={`${ev.type}_${ev.id}`}
                    level={1}
                    density="normal"
                    hoverable
                    onClick={() => setSelectedEvent(ev)}
                    className="space-y-xs relative"
                  >
                    {/* Node connector dot */}
                    <div className="absolute -left-[31px] md:-left-[39px] top-4 w-2 h-2 rounded-full bg-outline-variant" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-xs font-code text-code text-on-surface-variant">
                        <span className="text-secondary font-medium">r/{ev.subreddit}</span>
                        <span>•</span>
                        <span className="text-primary">{ev.redditId}</span>
                        <span>•</span>
                        <span>{ev.dateStr}</span>
                        <span>•</span>
                        <span className="text-primary uppercase text-[10px]">{ev.type}</span>
                      </div>
                      <StatusBadge status={ev.status} size="sm" />
                    </div>

                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      {ev.title}
                    </h3>

                    <p className="font-body-dense text-body-dense text-on-surface-variant">
                      {ev.snippet}
                    </p>

                    <div className="flex items-center justify-between pt-xs border-t border-outline/40 font-code text-code text-on-surface-variant text-[12px]">
                      <span>Score: {ev.score}</span>
                      <span className="font-label-caps text-label-caps text-secondary">INSPECT PROVENANCE →</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Detail Modal */}
      {selectedEvent && (
        <ContentDetailModal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent.title}
          author={username}
          subreddit={selectedEvent.subreddit}
          redditId={selectedEvent.redditId}
          createdUtc={selectedEvent.dateStr}
          status={selectedEvent.status}
          score={selectedEvent.score}
          currentBody={selectedEvent.snippet}
          provenanceHistory={[
            {
              version: 1,
              recordedAt: selectedEvent.dateStr,
              status: selectedEvent.status,
              content: selectedEvent.snippet,
            },
          ]}
        />
      )}
    </>
  );
}
