"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { StatusBadge, NsfwBadge } from "@/components/ui/StatusBadge";
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
      const res = await fetch(
        `/api/profile/${encodeURIComponent(username)}/timeline?limit=100&sort=newest`
      );
      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error?.message || "Failed to load history from archive.");
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
    return <LoadingState message={`Constructing historical timeline for u/${username}...`} />;
  }

  if (error) {
    return (
      <ErrorState
        title="Could not load history"
        message={error}
        onRetry={fetchTimeline}
      />
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        title="No history found"
        description={`No activity history could be found for u/${username}.`}
        actionLabel="Retry"
        onAction={fetchTimeline}
      />
    );
  }

  const years = Array.from(new Set(events.map((e) => e.year))).sort((a, b) => b - a);

  return (
    <div className="space-y-8">
      {/* Timeline Stream */}
      <div className="space-y-10 relative pl-6 sm:pl-8 border-l border-outline/50 ml-3 sm:ml-4 pt-2">
        {years.map((year) => {
          const eventsInYear = events.filter((e) => e.year === year);
          return (
            <div key={year} className="space-y-4 relative">
              {/* Year Badge Node */}
              <div className="absolute -left-[37px] sm:-left-[45px] -top-2 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span className="text-xs font-bold text-primary bg-surface border border-outline/50 px-2.5 py-0.5 rounded-full shadow-xs">
                  {year}
                </span>
              </div>

              {/* Events in this year */}
              <div className="space-y-3 pt-6">
                {eventsInYear.map((ev) => (
                  <Card
                    key={`${ev.type}_${ev.id}`}
                    level={1}
                    density="normal"
                    hoverable
                    onClick={() => setSelectedEvent(ev)}
                    className="space-y-2 relative"
                  >
                    {/* Small Node Connector */}
                    <div className="absolute -left-[35px] sm:-left-[43px] top-5 w-2 h-2 rounded-full bg-outline-variant" />

                    <div className="flex items-center justify-between text-xs text-on-surface-variant">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary">r/{ev.subreddit}</span>
                        {ev.isNsfw && <NsfwBadge size="sm" />}
                        <span>•</span>
                        <span className="capitalize">{ev.type.toLowerCase()}</span>
                        <span>•</span>
                        <span>{ev.dateStr}</span>
                      </div>
                      <StatusBadge status={ev.status} size="sm" />
                    </div>

                    <h3 className="text-base font-semibold text-on-surface leading-snug">
                      {ev.title}
                    </h3>

                    {ev.snippet && (
                      <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed">
                        {ev.snippet}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-outline/30 text-xs text-on-surface-variant">
                      <span className="font-medium text-on-surface">{ev.score} upvotes</span>
                      <span className="text-primary font-medium flex items-center gap-1">
                        <span>View details</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </span>
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
          type={selectedEvent.type === "POST" ? "POST" : "COMMENT"}
          title={selectedEvent.title}
          author={username}
          subreddit={selectedEvent.subreddit}
          redditId={selectedEvent.redditId}
          createdUtc={selectedEvent.dateStr}
          status={selectedEvent.status}
          score={selectedEvent.score}
          currentBody={selectedEvent.snippet}
          isNsfw={selectedEvent.isNsfw}
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
    </div>
  );
}
